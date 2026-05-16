<?php
require 'config/db.php';

// Local XAMPP settings (Found via discovery)
$host = "localhost";
$db_name = "atta_chakki";
$username = "root";
$password = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "CREATE TABLE IF NOT EXISTS size_classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sizes JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql);
    echo "Table size_classes created successfully\n";
    
    // Seed default data
    $stmt = $pdo->query("SELECT COUNT(*) FROM size_classes");
    if ($stmt->fetchColumn() == 0) {
        $defaults = [
            ['Standard (S, M, L)', json_encode(['Small', 'Medium', 'Large', 'XL', 'XXL'])],
            ['Bra Sizes (32B, 34C)', json_encode(['32B', '32C', '34B', '34C', '36B', '36C'])]
        ];
        
        $insert = $pdo->prepare("INSERT INTO size_classes (name, sizes) VALUES (?, ?)");
        foreach ($defaults as $d) {
            $insert->execute($d);
        }
        echo "Default size classes inserted\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
