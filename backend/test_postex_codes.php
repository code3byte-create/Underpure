<?php
header("Content-Type: application/json");
require_once __DIR__ . '/config/postex.php';

function testOrder($pickupCode, $storeCode) {
    $testData = [
        'cityName'          => 'Lahore',
        'customerName'      => 'Test Customer',
        'customerPhone'     => '03001234567',
        'deliveryAddress'   => 'Test Address, Model Town, Lahore',
        'invoiceDivision'   => 0,
        'invoicePayment'    => 1500.00,
        'items'             => 1,
        'orderDetail'       => 'Test Product x1',
        'orderRefNumber'    => 'UNDERPURE-TEST-' . rand(1000, 9999),
        'orderType'         => 'Normal',
        'transactionNotes'  => 'Debug test order',
    ];

    if ($pickupCode !== null) {
        $testData['pickupAddressCode'] = $pickupCode;
    }
    if ($storeCode !== null) {
        $testData['storeAddressCode'] = $storeCode;
    }

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
    
    return "HTTP $httpCode | " . $response;
}

echo "1. Both 001\n";
echo testOrder('001', '001') . "\n\n";

echo "2. Only pickupAddressCode = 001\n";
echo testOrder('001', null) . "\n\n";

echo "3. Only storeAddressCode = 001\n";
echo testOrder(null, '001') . "\n\n";

echo "4. String '1'\n";
echo testOrder('1', '1') . "\n\n";

echo "5. Int 1\n";
echo testOrder(1, 1) . "\n\n";

