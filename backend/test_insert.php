<?php
require_once __DIR__ . '/config/db.php';
$db = new Database();
$pdo = $db->getConnection();

try {
    $pdo->beginTransaction();
    $sql = "INSERT INTO products (slug, name, description, long_description, price, original_price, stock_count, low_stock_threshold, category_id, badge, sizes, colors, inventory, featured) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        "test-slug-" . time(),
        "Test Product",
        "Test Desc",
        null,
        99.99,
        null,
        10,
        5,
        null,
        null,
        null,
        null,
        null,
        0
    ]);
    echo "INSERT SUCCESS!\n";
    $pdo->rollBack();
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
