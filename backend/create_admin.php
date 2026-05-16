<?php
require_once __DIR__ . '/config/db.php';

$email = 'admin@underpure.com';
$password = 'admin123';
$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
    // Check if exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        // Update to make sure it's admin & has correct hash
        $update = $pdo->prepare("UPDATE users SET password = ?, role = 'admin' WHERE email = ?");
        $update->execute([$password_hash, $email]);
        echo "Admin account updated!\n";
    } else {
        // Insert
        $insert = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES ('Admin', ?, ?, 'admin')");
        $insert->execute([$email, $password_hash]);
        echo "Admin account created!\n";
    }
    
    echo "Email: $email\n";
    echo "Password: $password\n";
    echo "Hash saved: $password_hash\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
