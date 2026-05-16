<?php
header("Content-Type: application/json");
require_once __DIR__ . '/config/postex.php';

$trackingNumber = "22535470000218";

$endpoints = [
    'https://api.postex.pk/services/api/v1/order/track/' . $trackingNumber,
    'https://api.postex.pk/services/api/v1/track-order/' . $trackingNumber,
    'https://api.postex.pk/services/integration/api/order/v1/track-order/' . $trackingNumber,
    'https://api.postex.pk/services/integration/api/order/v2/track-order/' . $trackingNumber,
    'https://api.postex.pk/services/integration/api/order/v3/track/' . $trackingNumber,
    'https://api.postex.pk/services/integration/api/order/v3/tracking/' . $trackingNumber,
    'https://api.postex.pk/services/integration/api/merchant/v1/track-order/' . $trackingNumber,
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
        CURLOPT_TIMEOUT        => 10,
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
