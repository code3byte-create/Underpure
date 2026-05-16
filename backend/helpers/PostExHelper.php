<?php
// PostEx Courier Service Helper (v3 API)
// Yeh class PostEx ki API se order book karta hai aur tracking number wapas deta hai
require_once __DIR__ . '/../config/postex.php';

class PostExHelper {

    // ===== 1. PostEx par Order Book karna (v3 API) =====
    // Order successfully save hone ke baad yeh function call hoga
    public static function createShipment($orderData) {
        $url = POSTEX_BASE_URL . '/create-order';

        // PostEx ke liye order items ki description banana
        $itemsDescription = '';
        if (isset($orderData['items']) && is_array($orderData['items'])) {
            $itemNames = [];
            foreach ($orderData['items'] as $item) {
                $itemNames[] = $item['product_name'] . ' x' . $item['quantity'];
            }
            $itemsDescription = implode(', ', $itemNames);
        }

        // PostEx v3 API ke required fields
        $postData = [
            'cityName'          => $orderData['shipping_city'],
            'customerName'      => $orderData['shipping_name'],
            'customerPhone'     => $orderData['shipping_phone'],       // Format: 03xxxxxxxxx
            'deliveryAddress'   => $orderData['shipping_address'],
            'invoiceDivision'   => 0,
            'invoicePayment'    => (float)$orderData['total_amount'],  // COD amount
            'items'             => 1,
            'orderDetail'       => $itemsDescription ?: 'Order #' . $orderData['order_id'],
            'orderRefNumber'    => 'UNDERPURE-' . $orderData['order_id'],
            'orderType'         => 'Normal',
            'pickupAddressCode' => '001',
            'transactionNotes'  => 'Order from UnderPure Store - #' . $orderData['order_id'],
        ];

        // cURL se PostEx API ko call karna
        $ch = curl_init();

        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($postData),
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'token: ' . POSTEX_API_TOKEN,   // PostEx v3 uses 'token' header
            ],
            CURLOPT_TIMEOUT        => 30,   // 30 second timeout
            CURLOPT_SSL_VERIFYPEER => false,  // SSL verify (set true in production with proper certs)
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        // cURL error check
        if ($curlError) {
            return [
                'success' => false,
                'error'   => 'cURL Error: ' . $curlError
            ];
        }

        // Response decode karna
        $responseData = json_decode($response, true);

        // HTTP status aur response check karna
        // PostEx v3 response format: { statusCode: 200, statusMessage: "Success", dist: { trackingNumber: "..." } }
        if ($httpCode === 200 && isset($responseData['dist']['trackingNumber'])) {
            return [
                'success'         => true,
                'tracking_number' => $responseData['dist']['trackingNumber'],
                'postex_response' => $responseData
            ];
        } else {
            return [
                'success'  => false,
                'error'    => isset($responseData['statusMessage']) 
                              ? $responseData['statusMessage'] 
                              : (isset($responseData['message']) ? $responseData['message'] : 'PostEx API Error'),
                'http_code' => $httpCode,
                'response' => $responseData
            ];
        }
    }

    // ===== 2. Tracking Number se Order ka Status Check karna =====
    public static function trackShipment($trackingNumber) {
        // v1 tracking endpoint is more reliable
        $url = 'https://api.postex.pk/services/integration/api/order/v1/track-order/' . $trackingNumber;

        $ch = curl_init();

        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPGET        => true,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'token: ' . POSTEX_API_TOKEN,
            ],
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            return [
                'success' => false,
                'error'   => 'cURL Error: ' . $curlError
            ];
        }

        $responseData = json_decode($response, true);

        if ($httpCode === 200) {
            return [
                'success'  => true,
                'tracking' => $responseData
            ];
        } else {
            return [
                'success'  => false,
                'error'    => isset($responseData['message']) ? $responseData['message'] : 'Tracking Error',
                'response' => $responseData
            ];
        }
    }

    // ===== 3. Tracking Number Database me Save karna =====
    public static function saveTrackingToOrder($conn, $orderId, $trackingNumber) {
        $query = "UPDATE orders SET tracking_number = :tracking, courier_status = 'booked', status = 'processing' WHERE id = :order_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':tracking', $trackingNumber);
        $stmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
?>
