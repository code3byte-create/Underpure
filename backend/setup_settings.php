<?php
require_once __DIR__ . '/config/db.php';

try {
    // Drop existing tables just to be safe
    $pdo->exec("DROP TABLE IF EXISTS site_settings");
    
    // Recreate the correct schema
    $pdo->exec("CREATE TABLE site_settings (
        key_name VARCHAR(100) PRIMARY KEY,
        string_value VARCHAR(255) NULL,
        text_value TEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    echo "Settings table created successfully!\n";
} catch (\PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
