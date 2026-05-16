<?php
require 'config/db.php';
$db = new Database();
$pdo = $db->getConnection();
$pdo->exec('ALTER TABLE orders MODIFY user_id INT(11) NULL;');
$pdo->exec('ALTER TABLE orders ADD COLUMN shipping_email VARCHAR(255) NULL AFTER shipping_name;');
echo 'Altered table successfully';
