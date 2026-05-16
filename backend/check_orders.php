<?php
require 'config/db.php';
$db = new Database();
$pdo = $db->getConnection();
$stmt = $pdo->query("SHOW COLUMNS FROM orders");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
