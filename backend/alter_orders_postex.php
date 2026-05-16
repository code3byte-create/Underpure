<?php
// Migration: orders table me tracking_number aur courier_status columns add karna
require 'config/db.php';
$db = new Database();
$pdo = $db->getConnection();

try {
    // tracking_number column add karna
    $pdo->exec("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255) NULL AFTER status;");
    echo "tracking_number column added.\n";
} catch (PDOException $e) {
    // Column already exists
    echo "tracking_number: " . $e->getMessage() . "\n";
}

try {
    // courier_status column add karna
    $pdo->exec("ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_status VARCHAR(50) NULL DEFAULT NULL AFTER tracking_number;");
    echo "courier_status column added.\n";
} catch (PDOException $e) {
    echo "courier_status: " . $e->getMessage() . "\n";
}

echo "\nMigration complete!";
