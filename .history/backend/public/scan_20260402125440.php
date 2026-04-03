<?php

$data = json_decode(file_get_contents("php://input"), true);

$https_status = $data["https_status"] ?? 1;

$url = "https://risk-ml.onrender.com/predict";

$options = [
  "http" => [
    "header"  => "Content-Type: application/json\r\n",
    "method"  => "POST",
    "content" => json_encode([
      "new_device" => 0,
      "new_location" => 0,
      "odd_time" => 0,
      "https_status" => $https_status
    ]),
    "timeout" => 5
  ]
];

$context = stream_context_create($options);

$result = @file_get_contents($url, false, $context);

if ($result === FALSE) {
    echo json_encode(["error" => "ML service unavailable"]);
    exit();
}

echo $result;