<?php
// PostEx API Debug/Test Script
// Yeh script PostEx API ko directly test karega

header("Content-Type: application/json");

require_once __DIR__ . '/config/postex.php';
require_once __DIR__ . '/config/db.php';

$database = new Database();
$pdo = $database->getConnection();

// Site settings se address fetch karo
$stmtAddr = $pdo->prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'contact_address'");
$stmtAddr->execute();
$pickupAddress = $stmtAddr->fetchColumn();

echo "=== PostEx API Debug ===\n\n";
echo "1. API Token (first 20 chars): " . substr(POSTEX_API_TOKEN, 0, 20) . "...\n";
echo "2. Base URL: " . POSTEX_BASE_URL . "\n";
echo "3. Pickup Address from DB: " . ($pickupAddress ?: 'NOT SET') . "\n";
echo "4. Full Create Order URL: " . POSTEX_BASE_URL . "/create-order\n\n";

// Test data - dummy order
$testData = [
    'cityName'          => 'Lahore',
    'customerName'      => 'Test Customer',
    'customerPhone'     => '03001234567',
    'deliveryAddress'   => 'Test Address, Model Town, Lahore',
    'invoiceDivision'   => 0,
    'invoicePayment'    => 1500.00,
    'items'             => 1,
    'orderDetail'       => 'Test Product x1',
    'orderRefNumber'    => 'UNDERPURE-TEST-' . time(),
    'orderType'         => 'Normal',
    'pickupAddressCode' => $pickupAddress ?: 'Default',
    'storeAddressCode'  => $pickupAddress ?: 'Default',
    'transactionNotes'  => 'Debug test order',
];

echo "5. Payload being sent:\n";
echo json_encode($testData, JSON_PRETTY_PRINT) . "\n\n";

// PostEx ko call karo
$url = POSTEX_BASE_URL . '/create-order';
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL            => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($testData),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'token: ' . POSTEX_API_TOKEN,
    ],
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_SSL_VERIFYPEER => false,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
$curlInfo = curl_getinfo($ch);
curl_close($ch);

echo "6. HTTP Status Code: " . $httpCode . "\n";
echo "7. cURL Error: " . ($curlError ?: 'None') . "\n";
echo "8. Effective URL: " . $curlInfo['url'] . "\n";
echo "9. Total Time: " . $curlInfo['total_time'] . "s\n\n";

echo "10. PostEx Raw Response:\n";
echo $response . "\n\n";

$decoded = json_decode($response, true);
echo "11. Decoded Response:\n";
echo json_encode($decoded, JSON_PRETTY_PRINT) . "\n";
