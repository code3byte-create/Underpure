<?php
$data = ['slug' => 'test-prod', 'name' => 'test', 'price' => 10, 'colors' => [], 'user' => ['role' => 'admin']];
$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true
    ]
];
$context  = stream_context_create($options);
$result = file_get_contents('http://localhost/backend/index.php/products', false, $context);
echo "RESPONSE: " . $result;
