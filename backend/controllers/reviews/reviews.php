<?php
// Product Reviews API - users product par review aur rating de sakte hain
// GET = product ki reviews, POST = nayi review add karna
require_once __DIR__ . '/../../config/db.php';

// Database connection
$db = new Database();
$conn = $db->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

// URL se product ID lena
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', $requestUri);
$productId = isset($uri[3]) ? (int)$uri[3] : null; // /backend/reviews/5

try {
    switch ($method) {

        // ===== GET - Product ki saari reviews fetch karna (Public - koi bhi dekh sakta hai) =====
        case 'GET':
            if (!$productId) {
                // Fetch top global reviews
                $query = "SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name, p.name as product_name, p.slug as product_slug, (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as product_image
                          FROM reviews r
                          JOIN users u ON r.user_id = u.id
                          JOIN products p ON r.product_id = p.id
                          WHERE r.rating >= 4 AND r.comment IS NOT NULL AND r.comment != ''
                          ORDER BY r.created_at DESC LIMIT 5";
                $stmt = $conn->prepare($query);
                $stmt->execute();
                $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    "success" => true,
                    "reviews" => $reviews
                ]);
                exit;
            }

            // Reviews fetch karna with user name
            $query = "SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
                      FROM reviews r
                      JOIN users u ON r.user_id = u.id
                      WHERE r.product_id = :pid
                      ORDER BY r.created_at DESC";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':pid', $productId, PDO::PARAM_INT);
            $stmt->execute();
            $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Average rating calculate karna
            $avgQuery = "SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as total_reviews 
                         FROM reviews WHERE product_id = :pid";
            $avgStmt = $conn->prepare($avgQuery);
            $avgStmt->bindParam(':pid', $productId, PDO::PARAM_INT);
            $avgStmt->execute();
            $stats = $avgStmt->fetch(PDO::FETCH_ASSOC);

            // Rating distribution (kitne 5 star, kitne 4 star, etc.)
            $distQuery = "SELECT rating, COUNT(*) as count FROM reviews WHERE product_id = :pid GROUP BY rating ORDER BY rating DESC";
            $distStmt = $conn->prepare($distQuery);
            $distStmt->bindParam(':pid', $productId, PDO::PARAM_INT);
            $distStmt->execute();
            $distribution = $distStmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "success" => true,
                "product_id" => $productId,
                "avg_rating" => round((float)$stats['avg_rating'], 1),
                "total_reviews" => (int)$stats['total_reviews'],
                "rating_distribution" => $distribution,
                "reviews" => $reviews
            ]);
            break;

        // ===== POST - Nayi review add karna (Login required) =====
        case 'POST':
            // Authentication check - sirf logged-in users review de sakte hain
            require_once __DIR__ . '/../../middleware/auth.php';
            $loggedInUser = authenticateToken();
            $userId = $loggedInUser['user_id'];

            $data = json_decode(file_get_contents("php://input"), true);

            // Validation
            if (empty($data['product_id']) || empty($data['rating'])) {
                http_response_code(400);
                echo json_encode(["error" => "product_id aur rating required hain."]);
                exit;
            }

            $reviewProductId = (int)$data['product_id'];
            $rating = (int)$data['rating'];
            $comment = isset($data['comment']) ? trim($data['comment']) : null;

            // Rating 1-5 ke beech honi chahiye
            if ($rating < 1 || $rating > 5) {
                http_response_code(400);
                echo json_encode(["error" => "Rating 1 se 5 ke beech honi chahiye."]);
                exit;
            }

            // Check product exist karta hai
            $checkProduct = "SELECT id FROM products WHERE id = :pid";
            $checkStmt = $conn->prepare($checkProduct);
            $checkStmt->bindParam(':pid', $reviewProductId, PDO::PARAM_INT);
            $checkStmt->execute();

            if ($checkStmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(["error" => "Product nahi mila."]);
                exit;
            }

            // Check user ne pehle se review toh nahi di
            $checkReview = "SELECT id FROM reviews WHERE user_id = :uid AND product_id = :pid";
            $checkRStmt = $conn->prepare($checkReview);
            $checkRStmt->bindParam(':uid', $userId, PDO::PARAM_INT);
            $checkRStmt->bindParam(':pid', $reviewProductId, PDO::PARAM_INT);
            $checkRStmt->execute();

            if ($checkRStmt->rowCount() > 0) {
                // Agar pehle se review hai toh UPDATE kar do
                $updateQuery = "UPDATE reviews SET rating = :rating, comment = :comment WHERE user_id = :uid AND product_id = :pid";
                $updateStmt = $conn->prepare($updateQuery);
                $updateStmt->bindParam(':rating', $rating, PDO::PARAM_INT);
                $updateStmt->bindParam(':comment', $comment);
                $updateStmt->bindParam(':uid', $userId, PDO::PARAM_INT);
                $updateStmt->bindParam(':pid', $reviewProductId, PDO::PARAM_INT);
                $updateStmt->execute();

                echo json_encode([
                    "success" => true,
                    "message" => "Review update ho gayi."
                ]);
            } else {
                // Nayi review insert karna
                $insertQuery = "INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (:uid, :pid, :rating, :comment)";
                $insertStmt = $conn->prepare($insertQuery);
                $insertStmt->bindParam(':uid', $userId, PDO::PARAM_INT);
                $insertStmt->bindParam(':pid', $reviewProductId, PDO::PARAM_INT);
                $insertStmt->bindParam(':rating', $rating, PDO::PARAM_INT);
                $insertStmt->bindParam(':comment', $comment);
                $insertStmt->execute();

                http_response_code(201);
                echo json_encode([
                    "success" => true,
                    "message" => "Review add ho gayi.",
                    "review" => [
                        "id" => (int)$conn->lastInsertId(),
                        "rating" => $rating,
                        "comment" => $comment
                    ]
                ]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed."]);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Reviews error: " . $e->getMessage()]);
}
?>
