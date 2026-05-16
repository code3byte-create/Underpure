<?php
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

require_once __DIR__ . "/../../helpers/JwtHelper.php";

class OrderController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * POST /checkout
     * Create a new order.
     */
    public function checkout() {
        $userId = null;
        $headers = getallheaders();
        $authHeader = isset($headers["Authorization"]) ? $headers["Authorization"] : (isset($headers["authorization"]) ? $headers["authorization"] : "");
        if (preg_match("/Bearer\s(\S+)/", $authHeader, $matches)) {
            $jwt = $matches[1];
            if ($jwt !== "guest") {
                try {
                    $decoded = JwtHelper::decode($jwt);
                    if ($decoded && isset($decoded['id'])) {
                        $userId = $decoded['id'];
                    }
                } catch (\Exception $e) {
                    // Ignore decoding errors
                }
            }
        }

        if ($userId) {
            $uCheck = $this->pdo->prepare("SELECT id FROM users WHERE id = ?");
            $uCheck->execute([$userId]);
            if (!$uCheck->fetch()) {
                $userId = null;
            }
        }

        $rawBody = file_get_contents("php://input");
        $data = json_decode($rawBody, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON payload.']);
            return;
        }

        if (empty($data['cart_items']) || !is_array($data['cart_items'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Cart items are required.']);
            return;
        }

        try {
            $this->pdo->beginTransaction();

            // Calculate subtotal
            $subtotal = 0;
            foreach ($data['cart_items'] as $item) {
                $subtotal += ($item['price'] ?? 0) * ($item['quantity'] ?? 1);
            }

            // Fetch shipping settings from database
            $stmtSettings = $this->pdo->query("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('freeShippingThreshold', 'deliveryFee')");
            $settings = [];
            while ($row = $stmtSettings->fetch(\PDO::FETCH_ASSOC)) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
            
            $threshold = isset($settings['freeShippingThreshold']) && is_numeric($settings['freeShippingThreshold']) ? (float)$settings['freeShippingThreshold'] : 5000;
            $deliveryFee = isset($settings['deliveryFee']) && is_numeric($settings['deliveryFee']) ? (float)$settings['deliveryFee'] : 200;

            // Calculate shipping and final total
            $shipping = ($subtotal >= $threshold) ? 0 : $deliveryFee;
            $total = $subtotal + $shipping;

            // Insert into orders
            $stmt = $this->pdo->prepare("
                INSERT INTO orders (user_id, shipping_name, shipping_email, shipping_phone, shipping_address, shipping_city, shipping_zip, total, status)
                VALUES (:user_id, :shipping_name, :shipping_email, :shipping_phone, :shipping_address, :shipping_city, :shipping_zip, :total, 'pending')
            ");

            $stmt->execute([
                ':user_id' => $userId,
                ':shipping_name' => $data['shipping_name'] ?? '',
                ':shipping_email' => $data['shipping_email'] ?? '',
                ':shipping_phone' => $data['shipping_phone'] ?? '',
                ':shipping_address' => $data['shipping_address'] ?? '',
                ':shipping_city' => $data['shipping_city'] ?? '',
                ':shipping_zip' => $data['shipping_zip'] ?? '',
                ':total' => $total
            ]);

            $orderId = $this->pdo->lastInsertId();

            // Insert into order_items
            $stmtItem = $this->pdo->prepare("
                INSERT INTO order_items (order_id, product_id, product_name, color, size, quantity, price)
                VALUES (:order_id, :product_id, :product_name, :color, :size, :quantity, :price)
            ");

            foreach ($data['cart_items'] as $item) {
                $productId = null;
                if (!empty($item['product_id'])) {
                    $pCheck = $this->pdo->prepare("SELECT id FROM products WHERE id = ?");
                    $pCheck->execute([$item['product_id']]);
                    if ($pCheck->fetch()) {
                        $productId = $item['product_id'];
                    }
                }

                $stmtItem->execute([
                    ':order_id' => $orderId,
                    ':product_id' => $productId,
                    ':product_name' => $item['product_name'] ?? 'Unknown Product',
                    ':color' => $item['color'] ?? null,
                    ':size' => $item['size'] ?? null,
                    ':quantity' => $item['quantity'] ?? 1,
                    ':price' => $item['price'] ?? 0
                ]);

                // Deduct Stock immediately
                if (!empty($productId)) {
                    $pStmt = $this->pdo->prepare("SELECT inventory FROM products WHERE id = ?");
                    $pStmt->execute([$productId]);
                    $productData = $pStmt->fetch(\PDO::FETCH_ASSOC);
                    
                    if ($productData && !empty($productData['inventory'])) {
                        $inventory = json_decode($productData['inventory'], true);
                        if (is_array($inventory)) {
                            $updated = false;
                            foreach ($inventory as &$invItem) {
                                if (isset($invItem['color']) && trim(strtolower($invItem['color'])) === trim(strtolower($item['color'] ?? ''))) {
                                    if (isset($invItem['sizes']) && is_array($invItem['sizes'])) {
                                        foreach ($invItem['sizes'] as &$sizeObj) {
                                            if (isset($sizeObj['size']) && trim(strtolower($sizeObj['size'])) === trim(strtolower($item['size'] ?? ''))) {
                                                $sizeObj['stock'] = max(0, ($sizeObj['stock'] ?? 0) - ($item['quantity'] ?? 1));
                                                $updated = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                                if ($updated) break;
                            }
                            
                            if ($updated) {
                                $totalStock = 0;
                                foreach ($inventory as $inv) {
                                    if (isset($inv['sizes']) && is_array($inv['sizes'])) {
                                        foreach ($inv['sizes'] as $sz) {
                                            $totalStock += ($sz['stock'] ?? 0);
                                        }
                                    }
                                }
                                $updStmt = $this->pdo->prepare("UPDATE products SET inventory = ?, stock_count = ? WHERE id = ?");
                                $updStmt->execute([json_encode($inventory), $totalStock, $productId]);
                            }
                        }
                    }
                }
            }

            $this->pdo->commit();

            http_response_code(201);
            echo json_encode([
                'message' => 'Order created successfully',
                'order' => [
                    'order_id' => $orderId,
                    'status' => 'pending',
                    'total' => $total
                ]
            ]);

        } catch (\PDOException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode([
                'error' => 'Database error during checkout', 
                'details' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
        } catch (\Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode([
                'error' => 'Server error during checkout', 
                'details' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
        }
    }

    /**
     * GET /orders
     * Fetch user's orders (or all if admin).
     */
    public function getUserOrders() {
        if (!isset($_REQUEST['user']) || !isset($_REQUEST['user']['id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $userId = $_REQUEST['user']['id'];
        $isAdmin = isset($_REQUEST['user']['role']) && $_REQUEST['user']['role'] === 'admin';

        try {
            if ($isAdmin) {
                $stmt = $this->pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
            } else {
                $stmt = $this->pdo->prepare("SELECT * FROM orders WHERE user_id = :user_id ORDER BY created_at DESC");
                $stmt->execute([':user_id' => $userId]);
            }
            
            $orders = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            // Fetch items for each order
            foreach ($orders as &$order) {
                $stmtItems = $this->pdo->prepare("
                    SELECT oi.*, 
                           (SELECT image_url FROM product_images pi WHERE pi.product_id = oi.product_id ORDER BY pi.is_primary DESC, pi.id ASC LIMIT 1) as image_url
                    FROM order_items oi 
                    WHERE oi.order_id = :order_id
                ");
                $stmtItems->execute([':order_id' => $order['id']]);
                $order['items'] = $stmtItems->fetchAll(\PDO::FETCH_ASSOC);
            }

            http_response_code(200);
            echo json_encode(['orders' => $orders]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }

    /**
     * PUT /orders/:id
     * Update order status (Admin only)
     */
    public function updateOrderStatus($orderId) {
        if (!isset($_REQUEST['user']) || $_REQUEST['user']['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden. Admin access required.']);
            return;
        }

        $rawBody = file_get_contents("php://input");
        $data = json_decode($rawBody, true);

        if (!isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Status is required']);
            return;
        }

        try {
            // Get old status to check if we are cancelling
            $stmtOld = $this->pdo->prepare("SELECT status FROM orders WHERE id = :id");
            $stmtOld->execute([':id' => $orderId]);
            $oldStatus = $stmtOld->fetchColumn();

            $newStatus = $data['status'];

            $stmt = $this->pdo->prepare("UPDATE orders SET status = :status WHERE id = :id");
            $stmt->execute([
                ':status' => $newStatus,
                ':id' => $orderId
            ]);

            // If changing to cancelled and it wasn't already cancelled
            if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                $stmtItems = $this->pdo->prepare("SELECT * FROM order_items WHERE order_id = :order_id");
                $stmtItems->execute([':order_id' => $orderId]);
                $items = $stmtItems->fetchAll(\PDO::FETCH_ASSOC);

                foreach ($items as $item) {
                    if (!empty($item['product_id'])) {
                        $pStmt = $this->pdo->prepare("SELECT inventory FROM products WHERE id = ?");
                        $pStmt->execute([$item['product_id']]);
                        $productData = $pStmt->fetch(\PDO::FETCH_ASSOC);
                        
                        if ($productData && !empty($productData['inventory'])) {
                            $inventory = json_decode($productData['inventory'], true);
                            $updated = false;
                            
                            foreach ($inventory as &$invItem) {
                                if (isset($invItem['color']) && trim(strtolower($invItem['color'])) === trim(strtolower($item['color'] ?? ''))) {
                                    if (isset($invItem['sizes']) && is_array($invItem['sizes'])) {
                                        foreach ($invItem['sizes'] as &$sizeObj) {
                                            if (isset($sizeObj['size']) && trim(strtolower($sizeObj['size'])) === trim(strtolower($item['size'] ?? ''))) {
                                                $sizeObj['stock'] = ($sizeObj['stock'] ?? 0) + ($item['quantity'] ?? 1);
                                                $updated = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                                if ($updated) break;
                            }
                            
                            if ($updated) {
                                $totalStock = 0;
                                foreach ($inventory as $inv) {
                                    if (isset($inv['sizes']) && is_array($inv['sizes'])) {
                                        foreach ($inv['sizes'] as $sz) {
                                            $totalStock += ($sz['stock'] ?? 0);
                                        }
                                    }
                                }
                                $updStmt = $this->pdo->prepare("UPDATE products SET inventory = ?, stock_count = ? WHERE id = ?");
                                $updStmt->execute([json_encode($inventory), $totalStock, $item['product_id']]);
                            }
                        }
                    }
                }
            }
            // If changing FROM cancelled to something else (e.g. pending/processing)
            elseif ($oldStatus === 'cancelled' && $newStatus !== 'cancelled') {
                 $stmtItems = $this->pdo->prepare("SELECT * FROM order_items WHERE order_id = :order_id");
                $stmtItems->execute([':order_id' => $orderId]);
                $items = $stmtItems->fetchAll(\PDO::FETCH_ASSOC);

                foreach ($items as $item) {
                    if (!empty($item['product_id'])) {
                        $pStmt = $this->pdo->prepare("SELECT inventory FROM products WHERE id = ?");
                        $pStmt->execute([$item['product_id']]);
                        $productData = $pStmt->fetch(\PDO::FETCH_ASSOC);
                        
                        if ($productData && !empty($productData['inventory'])) {
                            $inventory = json_decode($productData['inventory'], true);
                            $updated = false;
                            
                            foreach ($inventory as &$invItem) {
                                if (isset($invItem['color']) && trim(strtolower($invItem['color'])) === trim(strtolower($item['color'] ?? ''))) {
                                    if (isset($invItem['sizes']) && is_array($invItem['sizes'])) {
                                        foreach ($invItem['sizes'] as &$sizeObj) {
                                            if (isset($sizeObj['size']) && trim(strtolower($sizeObj['size'])) === trim(strtolower($item['size'] ?? ''))) {
                                                $sizeObj['stock'] = max(0, ($sizeObj['stock'] ?? 0) - ($item['quantity'] ?? 1));
                                                $updated = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                                if ($updated) break;
                            }
                            
                            if ($updated) {
                                $totalStock = 0;
                                foreach ($inventory as $inv) {
                                    if (isset($inv['sizes']) && is_array($inv['sizes'])) {
                                        foreach ($inv['sizes'] as $sz) {
                                            $totalStock += ($sz['stock'] ?? 0);
                                        }
                                    }
                                }
                                $updStmt = $this->pdo->prepare("UPDATE products SET inventory = ?, stock_count = ? WHERE id = ?");
                                $updStmt->execute([json_encode($inventory), $totalStock, $item['product_id']]);
                            }
                        }
                    }
                }
            }

            http_response_code(200);
            echo json_encode([
                'message' => 'Order status updated successfully',
                'order' => [
                    'id' => $orderId,
                    'status' => $newStatus
                ]
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }

    /**
     * POST /orders/:id/accept
     * Accept order → Send to PostEx for shipment booking (Admin only)
     */
    public function acceptOrder($orderId) {
        if (!isset($_REQUEST['user']) || $_REQUEST['user']['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden. Admin access required.']);
            return;
        }

        try {
            // 1. Order fetch karo with items
            $stmt = $this->pdo->prepare("SELECT * FROM orders WHERE id = :id");
            $stmt->execute([':id' => $orderId]);
            $order = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$order) {
                http_response_code(404);
                echo json_encode(['error' => 'Order not found']);
                return;
            }

            if ($order['status'] === 'cancelled') {
                http_response_code(400);
                echo json_encode(['error' => 'Cannot accept a cancelled order']);
                return;
            }

            if ($order['status'] !== 'pending') {
                http_response_code(400);
                echo json_encode(['error' => 'Order already processed. Current status: ' . $order['status']]);
                return;
            }

            // 2. Order items fetch karo
            $stmtItems = $this->pdo->prepare("SELECT * FROM order_items WHERE order_id = :order_id");
            $stmtItems->execute([':order_id' => $orderId]);
            $items = $stmtItems->fetchAll(\PDO::FETCH_ASSOC);

            // 3. Site settings se pickup address (contact_address) fetch karo
            $stmtAddr = $this->pdo->prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'contact_address'");
            $stmtAddr->execute();
            $pickupAddress = $stmtAddr->fetchColumn();
            if (!$pickupAddress) {
                $pickupAddress = 'Lahore, Pakistan'; // fallback
            }

            // PostEx ko order bhejo
            require_once __DIR__ . '/../../helpers/PostExHelper.php';

            // PostEx requires a phone number, use a fallback if empty
            $phone = !empty($order['shipping_phone']) ? $order['shipping_phone'] : '03000000000';

            $postexData = [
                'order_id'         => $order['id'],
                'shipping_name'    => $order['shipping_name'],
                'shipping_phone'   => $phone,
                'shipping_address' => $order['shipping_address'],
                'shipping_city'    => $order['shipping_city'],
                'total_amount'     => $order['total'],
                'items'            => $items,
                'pickup_address'   => $pickupAddress
            ];

            $postexResult = PostExHelper::createShipment($postexData);

            if ($postexResult['success']) {
                // 5. Tracking number save karo aur status update karo
                PostExHelper::saveTrackingToOrder($this->pdo, $orderId, $postexResult['tracking_number']);

                http_response_code(200);
                echo json_encode([
                    'message'         => 'Order accepted and sent to PostEx successfully',
                    'tracking_number' => $postexResult['tracking_number'],
                    'order'           => [
                        'id'              => $orderId,
                        'status'          => 'processing',
                        'tracking_number' => $postexResult['tracking_number'],
                        'courier_status'  => 'booked'
                    ]
                ]);
            } else {
                // PostEx fail hojaye to bhi status processing kar do aur error log karo
                // Taki admin ko pata chale ke PostEx me issue hai
                $stmt = $this->pdo->prepare("UPDATE orders SET status = 'processing' WHERE id = :id");
                $stmt->execute([':id' => $orderId]);

                http_response_code(200);
                echo json_encode([
                    'message'       => 'Order accepted but PostEx booking failed. Status updated to processing.',
                    'postex_error'  => $postexResult['error'] ?? 'Unknown PostEx error',
                    'order'         => [
                        'id'     => $orderId,
                        'status' => 'processing'
                    ]
                ]);
            }

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }

    /**
     * POST /orders/:id/cancel
     * Cancel an order (Admin only)
     */
    public function cancelOrder($orderId) {
        if (!isset($_REQUEST['user']) || $_REQUEST['user']['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden. Admin access required.']);
            return;
        }

        try {
            // Check if order exists
            $stmt = $this->pdo->prepare("SELECT * FROM orders WHERE id = :id");
            $stmt->execute([':id' => $orderId]);
            $order = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$order) {
                http_response_code(404);
                echo json_encode(['error' => 'Order not found']);
                return;
            }

            if ($order['status'] === 'delivered') {
                http_response_code(400);
                echo json_encode(['error' => 'Cannot cancel a delivered order']);
                return;
            }

            // Status cancel karo
            $stmt = $this->pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = :id");
            $stmt->execute([':id' => $orderId]);

            // Add Stock back to Inventory
            $stmtItems = $this->pdo->prepare("SELECT * FROM order_items WHERE order_id = :order_id");
            $stmtItems->execute([':order_id' => $orderId]);
            $items = $stmtItems->fetchAll(\PDO::FETCH_ASSOC);

            foreach ($items as $item) {
                if (!empty($item['product_id'])) {
                    $pStmt = $this->pdo->prepare("SELECT inventory FROM products WHERE id = ?");
                    $pStmt->execute([$item['product_id']]);
                    $productData = $pStmt->fetch(\PDO::FETCH_ASSOC);
                    
                    if ($productData && !empty($productData['inventory'])) {
                        $inventory = json_decode($productData['inventory'], true);
                        $updated = false;
                        
                        foreach ($inventory as &$invItem) {
                            if (isset($invItem['color']) && trim(strtolower($invItem['color'])) === trim(strtolower($item['color'] ?? ''))) {
                                if (isset($invItem['sizes']) && is_array($invItem['sizes'])) {
                                    foreach ($invItem['sizes'] as &$sizeObj) {
                                        if (isset($sizeObj['size']) && trim(strtolower($sizeObj['size'])) === trim(strtolower($item['size'] ?? ''))) {
                                            $sizeObj['stock'] = ($sizeObj['stock'] ?? 0) + ($item['quantity'] ?? 1);
                                            $updated = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            if ($updated) break;
                        }
                        
                        if ($updated) {
                            $totalStock = 0;
                            foreach ($inventory as $inv) {
                                if (isset($inv['sizes']) && is_array($inv['sizes'])) {
                                    foreach ($inv['sizes'] as $sz) {
                                        $totalStock += ($sz['stock'] ?? 0);
                                    }
                                }
                            }
                            $updStmt = $this->pdo->prepare("UPDATE products SET inventory = ?, stock_count = ? WHERE id = ?");
                            $updStmt->execute([json_encode($inventory), $totalStock, $item['product_id']]);
                        }
                    }
                }
            }

            http_response_code(200);
            echo json_encode([
                'message' => 'Order cancelled successfully',
                'order'   => [
                    'id'     => $orderId,
                    'status' => 'cancelled'
                ]
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }

    /**
     * POST /orders/sync-postex
     * Sync local order statuses from PostEx tracking (Admin only)
     */
    public function syncPostExStatuses() {
        if (!isset($_REQUEST['user']) || $_REQUEST['user']['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden. Admin access required.']);
            return;
        }

        try {
            // Fetch all orders that have a tracking number and are not already in a final state
            $stmt = $this->pdo->query("SELECT id, tracking_number, status, courier_status FROM orders WHERE tracking_number IS NOT NULL AND status NOT IN ('cancelled', 'delivered')");
            $orders = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            if (empty($orders)) {
                http_response_code(200);
                echo json_encode(['message' => 'No active PostEx orders to sync.', 'updated' => 0]);
                return;
            }

            require_once __DIR__ . '/../../helpers/PostExHelper.php';
            $updatedCount = 0;

            foreach ($orders as $order) {
                $trackingResult = PostExHelper::trackShipment($order['tracking_number']);
                
                if ($trackingResult['success'] && isset($trackingResult['tracking']['dist'])) {
                    $dist = $trackingResult['tracking']['dist'];
                    
                    // The main transactionStatus might not say Cancelled directly, let's check history
                    $isCancelled = false;
                    $isDelivered = false;
                    $lastMessage = $dist['transactionStatus'] ?? '';

                    if (isset($dist['transactionStatusHistory']) && is_array($dist['transactionStatusHistory'])) {
                        // History is usually chronological or reverse chronological. 
                        // Let's check all messages to see if it was cancelled or delivered.
                        foreach ($dist['transactionStatusHistory'] as $historyItem) {
                            $msg = strtolower($historyItem['transactionStatusMessage'] ?? '');
                            $lastMessage = $historyItem['transactionStatusMessage']; // Keep latest readable status
                            
                            if (strpos($msg, 'cancel') !== false) {
                                $isCancelled = true;
                            } elseif (strpos($msg, 'deliver') !== false) {
                                $isDelivered = true;
                            }
                        }
                    }

                    $newStatus = $order['status'];
                    if ($isCancelled) {
                        $newStatus = 'cancelled';
                    } elseif ($isDelivered) {
                        $newStatus = 'delivered';
                    } elseif (strpos(strtolower($lastMessage), 'ship') !== false || strpos(strtolower($lastMessage), 'transit') !== false) {
                        $newStatus = 'shipped';
                    }

                    // Update if there's a change in local status or courier status message
                    if ($newStatus !== $order['status'] || $lastMessage !== $order['courier_status']) {
                        $updStmt = $this->pdo->prepare("UPDATE orders SET status = :status, courier_status = :courier_status WHERE id = :id");
                        $updStmt->execute([
                            ':status' => $newStatus,
                            ':courier_status' => $lastMessage,
                            ':id' => $order['id']
                        ]);
                        $updatedCount++;
                    }
                }
            }

            http_response_code(200);
            echo json_encode([
                'message' => "Synced successfully. Updated $updatedCount orders.",
                'updated' => $updatedCount
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }
}
