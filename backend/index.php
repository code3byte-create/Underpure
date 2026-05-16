<?php
// CORS Headers
$allowed_origins = [
    "http://localhost:5173", // Local testing
    "https://www.underpure.com", // Live domain
    "https://underpure.com" // Live domain without www
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    // Default fallback
    header("Access-Control-Allow-Origin: *");
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle Preflight OPTIONS Request
if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") {
    http_response_code(200);
    exit();
}

// 1. Establish PDO Connection
require_once __DIR__ . "/config/db.php";

// Apni actual Database class se connection banayen
$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}

// --- AUTO REPAIR DB ---
try {
    // 1. users fix
    $cols = $pdo->query("DESCRIBE users")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('google_id', $cols)) $pdo->exec("ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL");
    if (!in_array('is_admin', $cols)) $pdo->exec("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE");
    if (!in_array('otp_code', $cols)) $pdo->exec("ALTER TABLE users ADD COLUMN otp_code VARCHAR(10) DEFAULT NULL");

    // 2. products fix
    $pcols = $pdo->query("DESCRIBE products")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('category_id', $pcols)) $pdo->exec("ALTER TABLE products ADD COLUMN category_id INT DEFAULT NULL");
    if (!in_array('stock_count', $pcols)) $pdo->exec("ALTER TABLE products ADD COLUMN stock_count INT DEFAULT 0");
    if (!in_array('low_stock_threshold', $pcols)) $pdo->exec("ALTER TABLE products ADD COLUMN low_stock_threshold INT DEFAULT 5");
    if (!in_array('badge', $pcols)) $pdo->exec("ALTER TABLE products ADD COLUMN badge VARCHAR(50) DEFAULT NULL");
    if (!in_array('sizes', $pcols)) $pdo->exec("ALTER TABLE products ADD COLUMN sizes LONGTEXT DEFAULT NULL");
    if (!in_array('colors', $pcols)) $pdo->exec("ALTER TABLE products ADD COLUMN colors LONGTEXT DEFAULT NULL");
    if (!in_array('inventory', $pcols)) $pdo->exec("ALTER TABLE products ADD COLUMN inventory LONGTEXT DEFAULT NULL");
    if (!in_array('featured', $pcols)) $pdo->exec("ALTER TABLE products ADD COLUMN featured BOOLEAN DEFAULT FALSE");
    if (!in_array('original_price', $pcols)) $pdo->exec("ALTER TABLE products ADD COLUMN original_price DECIMAL(10,2) DEFAULT NULL");

    // 2.1 categories fix
    $ccols = $pdo->query("DESCRIBE categories")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('parent_id', $ccols)) $pdo->exec("ALTER TABLE categories ADD COLUMN parent_id INT DEFAULT NULL");
    if (!in_array('size_class_id', $ccols)) $pdo->exec("ALTER TABLE categories ADD COLUMN size_class_id INT DEFAULT NULL");
    if (!in_array('sub_label', $ccols)) $pdo->exec("ALTER TABLE categories ADD COLUMN sub_label VARCHAR(255) DEFAULT NULL");
    if (!in_array('image_url', $ccols)) $pdo->exec("ALTER TABLE categories ADD COLUMN image_url VARCHAR(255) DEFAULT NULL");
    if (!in_array('priority', $ccols)) $pdo->exec("ALTER TABLE categories ADD COLUMN priority INT DEFAULT 0");

    // 3. Create missing tables
    $pdo->exec("CREATE TABLE IF NOT EXISTS site_settings (id INT AUTO_INCREMENT PRIMARY KEY, setting_key VARCHAR(255) UNIQUE, setting_value LONGTEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    
    // Ensure UNIQUE constraint on setting_key if it's missing
    try {
        $pdo->exec("ALTER TABLE site_settings ADD UNIQUE (setting_key)");
    } catch (Exception $e) {}

    // Check if we need to upgrade to LONGTEXT
    try {
        $s_cols = $pdo->query("SHOW COLUMNS FROM site_settings LIKE 'setting_value'")->fetch();
        if ($s_cols && strtolower($s_cols['Type']) !== 'longtext') {
            $pdo->exec("ALTER TABLE site_settings MODIFY COLUMN setting_value LONGTEXT");
        }
    } catch (Exception $e) {}

    $pdo->exec("CREATE TABLE IF NOT EXISTS product_images (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, image_url TEXT NOT NULL, color VARCHAR(50), is_primary BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS size_classes (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, sizes TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    
    // Orders table fix
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT DEFAULT NULL, shipping_name VARCHAR(255), shipping_email VARCHAR(255), shipping_phone VARCHAR(50), shipping_address TEXT, shipping_city VARCHAR(100), shipping_zip VARCHAR(20), total DECIMAL(10,2) NOT NULL DEFAULT 0.00, status VARCHAR(50) DEFAULT 'pending', tracking_number VARCHAR(100), courier_status TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    $ocols = $pdo->query("DESCRIBE orders")->fetchAll(PDO::FETCH_COLUMN);
    
    // Ensure user_id is NULLable for guests
    $pdo->exec("ALTER TABLE orders MODIFY COLUMN user_id INT DEFAULT NULL");

    // Add missing columns
    if (!in_array('shipping_email', $ocols)) $pdo->exec("ALTER TABLE orders ADD COLUMN shipping_email VARCHAR(255) AFTER shipping_name");
    
    // Rename total_amount to total if total is missing and total_amount exists
    if (!in_array('total', $ocols) && in_array('total_amount', $ocols)) {
        $pdo->exec("ALTER TABLE orders CHANGE total_amount total DECIMAL(10,2) NOT NULL DEFAULT 0.00");
    } elseif (!in_array('total', $ocols)) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN total DECIMAL(10,2) NOT NULL DEFAULT 0.00");
    }
    
    // Ensure all columns are present
    if (!in_array('tracking_number', $ocols)) $pdo->exec("ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100)");
    if (!in_array('courier_status', $ocols)) $pdo->exec("ALTER TABLE orders ADD COLUMN courier_status TEXT");
    if (!in_array('status', $ocols)) $pdo->exec("ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'pending'");

    // Order Items table fix
    $pdo->exec("CREATE TABLE IF NOT EXISTS order_items (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, product_id INT DEFAULT NULL, product_name VARCHAR(255), color VARCHAR(50), size VARCHAR(50), quantity INT NOT NULL DEFAULT 1, price DECIMAL(10,2) NOT NULL DEFAULT 0.00, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE)");
    $oicols = $pdo->query("DESCRIBE order_items")->fetchAll(PDO::FETCH_COLUMN);
    
    // Ensure product_id is NULLable
    $pdo->exec("ALTER TABLE order_items MODIFY COLUMN product_id INT DEFAULT NULL");
    
    if (!in_array('color', $oicols)) $pdo->exec("ALTER TABLE order_items ADD COLUMN color VARCHAR(50)");
    if (!in_array('size', $oicols)) $pdo->exec("ALTER TABLE order_items ADD COLUMN size VARCHAR(50)");
} catch (Exception $e) {
    error_log("Database Repair Error: " . $e->getMessage());
}
// --- END REPAIR ---

// 2. Includes
require_once __DIR__ . "/middleware/auth.php";
require_once __DIR__ . "/controllers/auth/AuthController.php";
require_once __DIR__ . "/controllers/products/ProductController.php";
require_once __DIR__ . "/controllers/admin/AnalyticsController.php";
require_once __DIR__ . "/controllers/wishlist/WishlistController.php";
require_once __DIR__ . "/controllers/admin/CustomerController.php";
require_once __DIR__ . "/controllers/settings/SettingsController.php";
require_once __DIR__ . "/controllers/admin/PromotionController.php";
require_once __DIR__ . "/controllers/categories/CategoryController.php";
require_once __DIR__ . "/controllers/orders/OrderController.php";
require_once __DIR__ . "/controllers/inventory/SizeClassController.php";
require_once __DIR__ . "/controllers/ImageUploadController.php";

// 3. Routing
$requestUri = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$method = $_SERVER["REQUEST_METHOD"];

// Strip common prefixes (e.g., if hosted at /api)
$uri = str_replace("/api", "", $requestUri);
$basePath = dirname($_SERVER["SCRIPT_NAME"]);

if (strpos($uri, $basePath) === 0) {
    $uri = substr($uri, strlen($basePath));
}

$uri = ltrim($uri, "/");
if (strpos($uri, "index.php/") === 0) {
    $uri = substr($uri, 10);
} elseif ($uri === "index.php") {
    $uri = "";
}

$uri = "/" . ltrim($uri, "/"); // Ensure it starts with a slash

// Initialize Controllers
$authController = new AuthController($pdo);
$productController = new ProductController($pdo);
$analyticsController = new AnalyticsController($pdo);
$wishlistController = new WishlistController($pdo);
$customerController = new CustomerController($pdo);
$settingsController = new SettingsController($pdo);
$promotionController = new PromotionController($pdo);
$categoryController = new CategoryController($pdo);
$orderController = new OrderController($pdo);
$sizeClassController = new SizeClassController($pdo);

// Helper for dynamic route matching (e.g. /wishlist/1)
function routeMatch($pattern, $uri, &$matches) {
    return preg_match("#^" . $pattern . "$#", $uri, $matches);
}

// 4. Endpoints
switch (true) {
    // --- AUTH ROUTES ---
    case ($uri === "/auth/register" && $method === "POST"):
        $authController->register();
        break;
        
    case ($uri === "/auth/login" && $method === "POST"):
        $authController->login();
        break;

    case ($uri === "/auth/google" && $method === "POST"):
        $authController->googleLogin();
        break;
        
    case ($uri === "/auth/me" && $method === "GET"):
        authMiddleware();
        $authController->me();
        break;

    case ($uri === "/auth/forgot-password" && $method === "POST"):
        $authController->forgotPassword();
        break;

    case ($uri === "/auth/reset-password" && $method === "POST"):
        $authController->resetPassword();
        break;

    // --- UPLOAD ROUTES ---
    case ($uri === "/upload/image" && $method === "POST"):
        authMiddleware();
        echo ImageUploadController::upload($pdo);
        break;

    // --- PRODUCT ROUTES ---
    case ($uri === "/products" && $method === "GET"):
        $productController->index();
        break;
    case (routeMatch("/products/([a-zA-Z0-9-]+)", $uri, $matches) && $method === "GET"):
        $productController->show($matches[1]);
        break;
    case ($uri === "/products" && $method === "POST"):
        authMiddleware();
        $productController->create();
        break;
    case (routeMatch("/products/([0-9]+)", $uri, $matches) && $method === "PUT"):
        authMiddleware();
        $productController->update($matches[1]);
        break;
    case (routeMatch("/products/([0-9]+)", $uri, $matches) && $method === "DELETE"):
        authMiddleware();
        $productController->delete($matches[1]);
        break;

    // --- CATEGORY ROUTES ---
    case ($uri === "/categories" && $method === "GET"):
        $categoryController->index();
        break;
    case ($uri === "/categories" && $method === "POST"):
        authMiddleware();
        $categoryController->create();
        break;
    case (routeMatch("/categories/([0-9]+)", $uri, $matches) && $method === "PUT"):
        authMiddleware();
        $categoryController->update($matches[1]);
        break;
    case (routeMatch("/categories/([0-9]+)", $uri, $matches) && $method === "DELETE"):
        authMiddleware();
        $categoryController->delete($matches[1]);
        break;

    // --- WISHLIST ROUTES ---
    case ($uri === "/wishlist" && $method === "GET"):
        authMiddleware();
        $wishlistController->index();
        break;
    case (routeMatch("/wishlist/([0-9]+)", $uri, $matches) && $method === "POST"):
        authMiddleware();
        $wishlistController->add($matches[1]);
        break;
    case (routeMatch("/wishlist/([0-9]+)", $uri, $matches) && $method === "DELETE"):
        authMiddleware();
        $wishlistController->remove($matches[1]);
        break;

    // --- SETTINGS ROUTES ---
    case ($uri === "/settings" && $method === "GET"):
        $settingsController->index();
        break;
    case ($uri === "/settings" && $method === "PUT"):
        authMiddleware();
        $settingsController->update();
        break;

    // --- CHECKOUT/ORDERS ROUTES ---
    case ($uri === "/checkout" && $method === "POST"):
        $orderController->checkout();
        break;
    case ($uri === "/orders" && $method === "GET"):
        authMiddleware();
        $orderController->getUserOrders();
        break;
    case (routeMatch("/orders/([0-9]+)", $uri, $matches) && $method === "PUT"):
        authMiddleware();
        $orderController->updateOrderStatus($matches[1]);
        break;
    case (routeMatch("/orders/([0-9]+)/accept", $uri, $matches) && $method === "POST"):
        authMiddleware();
        $orderController->acceptOrder($matches[1]);
        break;
    case (routeMatch("/orders/([0-9]+)/cancel", $uri, $matches) && $method === "POST"):
        authMiddleware();
        $orderController->cancelOrder($matches[1]);
        break;
    case ($uri === "/orders/sync-postex" && $method === "POST"):
        authMiddleware();
        $orderController->syncPostExStatuses();
        break;
    case ($uri === "/checkout/validate-promo" && $method === "POST"):
        $promotionController->validatePromo();
        break;

    // --- DEBUG ROUTE ---
    case ($uri === "/debug-db" && $method === "GET"):
        $tables = ['orders', 'order_items', 'products', 'site_settings', 'categories'];
        $debug = [];
        foreach ($tables as $t) {
            try {
                $stmt = $pdo->query("SELECT * FROM $t LIMIT 10");
                $debug[$t]['data'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $debug[$t]['schema'] = $pdo->query("DESCRIBE $t")->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
                $debug[$t] = "Error: " . $e->getMessage();
            }
        }
        echo json_encode($debug);
        break;

    // --- ADMIN ROUTES ---
    case ($uri === "/admin/stats" && $method === "GET"):
        authMiddleware();
        $analyticsController->stats();
        break;
    case ($uri === "/admin/customers" && $method === "GET"):
        authMiddleware();
        $customerController->index();
        break;
    case ($uri === "/admin/promotions" && $method === "GET"):
        authMiddleware();
        $promotionController->index();
        break;
    case ($uri === "/admin/promotions" && $method === "POST"):
        authMiddleware();
        $promotionController->create();
        break;
    case (routeMatch("/admin/promotions/([0-9]+)", $uri, $matches) && $method === "PUT"):
        authMiddleware();
        $promotionController->update($matches[1]);
        break;
    case (routeMatch("/admin/promotions/([0-9]+)", $uri, $matches) && $method === "DELETE"):
        authMiddleware();
        $promotionController->delete($matches[1]);
        break;

    // --- SIZE CLASS ROUTES ---
    case ($uri === "/size-classes" && $method === "GET"):
        $sizeClassController->index();
        break;
    case ($uri === "/size-classes" && $method === "POST"):
        authMiddleware();
        $sizeClassController->create();
        break;
    case (routeMatch("/size-classes/([0-9]+)", $uri, $matches) && $method === "PUT"):
        authMiddleware();
        $sizeClassController->update($matches[1]);
        break;
    case (routeMatch("/size-classes/([0-9]+)", $uri, $matches) && $method === "DELETE"):
        authMiddleware();
        $sizeClassController->delete($matches[1]);
        break;

    // --- DEFAULT 404 ---
    default:
        http_response_code(404);
        echo json_encode(["error" => "API endpoint not found", "path" => $uri]);
        break;
}