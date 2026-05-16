<?php
require_once __DIR__ . "/config/db.php";

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    echo "<h1>Database Auto-Repair</h1>";

    // 1. Create size_classes table
    $pdo->exec("CREATE TABLE IF NOT EXISTS size_classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sizes TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "✅ Table 'size_classes' checked/created.<br>";

    // 2. Fix users table
    $columns = $pdo->query("DESCRIBE users")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('google_id', $columns)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL");
        echo "✅ Column 'google_id' added to 'users'.<br>";
    }
    if (!in_array('is_admin', $columns)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE");
        echo "✅ Column 'is_admin' added to 'users'.<br>";
    }

    // 3. Fix products table
    $prodColumns = $pdo->query("DESCRIBE products")->fetchAll(PDO::FETCH_COLUMN);
    $requiredProd = [
        'stock_count' => "INT DEFAULT 0",
        'low_stock_threshold' => "INT DEFAULT 5",
        'badge' => "VARCHAR(50) DEFAULT NULL",
        'sizes' => "TEXT DEFAULT NULL",
        'colors' => "TEXT DEFAULT NULL",
        'original_price' => "DECIMAL(10,2) DEFAULT NULL"
    ];
    foreach ($requiredProd as $col => $def) {
        if (!in_array($col, $prodColumns)) {
            $pdo->exec("ALTER TABLE products ADD COLUMN $col $def");
            echo "✅ Column '$col' added to 'products'.<br>";
        }
    }

    // 4. Create orders and items if missing
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_name VARCHAR(255),
        shipping_email VARCHAR(255),
        shipping_phone VARCHAR(50),
        shipping_address TEXT,
        shipping_city VARCHAR(100),
        shipping_zip VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "✅ Table 'orders' checked/created.<br>";

    $pdo->exec("CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255),
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )");
    echo "✅ Table 'order_items' checked/created.<br>";

    echo "<h2>All Repairs Completed!</h2>";
    echo "<p>Ab aap apni app refresh karein, saare errors khatam ho gaye honge.</p>";

} catch (Exception $e) {
    echo "<h2 style='color:red;'>Error during repair:</h2> " . $e->getMessage();
}
?>
