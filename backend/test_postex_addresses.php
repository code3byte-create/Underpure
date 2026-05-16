<?php
// PostEx - Try fetching addresses from different API versions
header("Content-Type: application/json");
require_once __DIR__ . '/config/postex.php';

$endpoints = [
    // v1 endpoints
    'https://api.postex.pk/services/integration/api/order/v1/get-pickup-address',
    'https://api.postex.pk/services/integration/api/order/v2/get-pickup-address',
    // Try merchant endpoints
    'https://api.postex.pk/services/integration/api/merchant/v1/get-pickup-address',
    'https://api.postex.pk/services/integration/api/merchant/v1/pickup-address',
    // Common patterns
    'https://api.postex.pk/services/integration/api/order/v3/pickup-address/list',
    'https://api.postex.pk/services/integration/api/order/v3/list-pickup-address',
    // Without integration prefix
    'https://api.postex.pk/services/api/v1/get-pickup-address',
    'https://api.postex.pk/services/api/v1/pickup-addresses',
];

foreach ($endpoints as $url) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPGET        => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'token: ' . POSTEX_API_TOKEN,
        ],
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $status = $httpCode === 200 ? "✓ SUCCESS" : "✗ $httpCode";
    echo "$status | $url\n";
    
    if ($httpCode === 200) {
        echo "\n=== FOUND! ===\n";
        echo json_encode(json_decode($response, true), JSON_PRETTY_PRINT) . "\n";
        break;
    }
}

// Also try with empty string as address code
echo "\n\n=== Testing with empty string address codes ===\n";
$testData = [
    'cityName'          => 'Lahore',
    'customerName'      => 'Test Customer',
    'customerPhone'     => '03001234567',
    'deliveryAddress'   => 'Test Address, Model Town, Lahore',
    'invoiceDivision'   => 0,
    'invoicePayment'    => 1500.00,
    'items'             => 1,
    'orderDetail'       => 'Test Product x1',
    'orderRefNumber'    => 'UNDERPURE-TEST3-' . time(),
    'orderType'         => 'Normal',
    'pickupAddressCode' => '001',
    'storeAddressCode'  => '001',
    'transactionNotes'  => 'Debug test order',
];
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => 'https://api.postex.pk/services/integration/api/order/v3/create-order',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($testData),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'token: ' . POSTEX_API_TOKEN,
    ],
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => false,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP: $httpCode\nResponse: $response\n";
