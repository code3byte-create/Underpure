<?php

class WishlistController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Helper to get the authenticated user ID.
     * Assumes authMiddleware() has already populated $_REQUEST['user'].
     */
    private function getUserId() {
        if (!isset($_REQUEST['user']) || !isset($_REQUEST['user']['id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit();
        }
        return $_REQUEST['user']['id'];
    }

    /**
     * GET /api/wishlist
     * Fetch all wishlisted products for the authenticated user, including images.
     */
    public function index() {
        $userId = $this->getUserId();

        try {
            // Fetch wishlisted products
            $sql = "SELECT 
                        p.id, p.slug, p.name, p.description, p.price, p.original_price, 
                        p.stock_count, p.badge, p.category_id, c.label as category_label,
                        w.created_at as wishlisted_at
                    FROM wishlists w
                    JOIN products p ON w.product_id = p.id
                    LEFT JOIN categories c ON p.category_id = c.id
                    WHERE w.user_id = ?
                    ORDER BY w.created_at DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId]);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // If wishlist is not empty, fetch associated images
            if (count($products) > 0) {
                $productIds = array_column($products, 'id');
                $placeholders = implode(',', array_fill(0, count($productIds), '?'));
                
                $imgSql = "SELECT id, product_id, image_url, color, is_primary 
                           FROM product_images 
                           WHERE product_id IN ($placeholders)";
                $imgStmt = $this->pdo->prepare($imgSql);
                $imgStmt->execute($productIds);
                $images = $imgStmt->fetchAll(PDO::FETCH_ASSOC);

                // Group images by product_id
                $imagesByProduct = [];
                foreach ($images as $img) {
                    $imagesByProduct[$img['product_id']][] = $img;
                }

                // Attach images to each product
                foreach ($products as &$product) {
                    $product['images'] = $imagesByProduct[$product['id']] ?? [];
                }
            }

            http_response_code(200);
            echo json_encode($products);
            
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/wishlist/{product_id}
     * Add a product to the user's wishlist. Matches unique compound key to avoid duplicates.
     */
    public function add($productId) {
        $userId = $this->getUserId();

        if (empty($productId) || !is_numeric($productId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid product ID']);
            return;
        }

        try {
            // Check if product exists
            $checkStmt = $this->pdo->prepare("SELECT id FROM products WHERE id = ?");
            $checkStmt->execute([$productId]);
            if (!$checkStmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'Product not found']);
                return;
            }

            // Use INSERT IGNORE to silently skip duplicate entries based on the primary key (user_id, product_id)
            $sql = "INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId, $productId]);

            if ($stmt->rowCount() > 0) {
                http_response_code(201);
                echo json_encode(['message' => 'Product added to wishlist']);
            } else {
                http_response_code(200);
                echo json_encode(['message' => 'Product is already in the wishlist']);
            }

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }

    /**
     * DELETE /api/wishlist/{product_id}
     * Remove a product from the user's wishlist.
     */
    public function remove($productId) {
        $userId = $this->getUserId();

        if (empty($productId) || !is_numeric($productId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid product ID']);
            return;
        }

        try {
            $sql = "DELETE FROM wishlists WHERE user_id = ? AND product_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId, $productId]);

            if ($stmt->rowCount() > 0) {
                http_response_code(200);
                echo json_encode(['message' => 'Product removed from wishlist']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Product not found in wishlist']);
            }

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }
}
