<?php
session_start();
require_once "../config/database.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    die("Only POST method allowed");
}

$username = trim($_POST["username"]);
$password = trim($_POST["password"]);

/* =========================
   FETCH USER
========================= */

$stmt = $conn->prepare("SELECT id, password_hash FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    die("User not found");
}

$user = $result->fetch_assoc();

/* =========================
   VERIFY PASSWORD
========================= */

if (!password_verify($password, $user["password_hash"])) {
    die("Invalid password!");
}

$user_id = $user["id"];

/* =========================
   BEHAVIOUR CAPTURE
========================= */

$ip = $_SERVER['REMOTE_ADDR'];
$user_agent = $_SERVER['HTTP_USER_AGENT'];
$login_time = date("Y-m-d H:i:s");

$https_status = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 1 : 0;

/* =========================
   DEVICE DETECTION
========================= */

$device_type = (preg_match("/mobile/i", $user_agent)) ? "Mobile" : "Desktop";

$stmt_device = $conn->prepare("SELECT COUNT(*) as count FROM login_history WHERE user_id = ? AND user_agent = ?");
$stmt_device->bind_param("is", $user_id, $user_agent);
$stmt_device->execute();
$row_device = $stmt_device->get_result()->fetch_assoc();

$new_device = ($row_device["count"] > 0) ? 0 : 1;

/* =========================
   ODD TIME DETECTION
========================= */

$hour = date("H");
$odd_time = ($hour >= 0 && $hour <= 6) ? 1 : 0;

/* =========================
   LOCATION DETECTION
========================= */

$country = "Unknown";

$geo = @file_get_contents("http://ip-api.com/json/" . $ip);
if ($geo !== false) {
    $geo_data = json_decode($geo, true);
    if (isset($geo_data["country"])) {
        $country = $geo_data["country"];
    }
}

$stmt_location = $conn->prepare("SELECT COUNT(*) as count FROM login_history WHERE user_id = ? AND country = ?");
$stmt_location->bind_param("is", $user_id, $country);
$stmt_location->execute();
$row_location = $stmt_location->get_result()->fetch_assoc();

$new_location = ($row_location["count"] > 0) ? 0 : 1;

/* =========================
   ML RISK PREDICTION (cURL FIX)
========================= */

$data = [
    "new_device" => (int)$new_device,
    "new_location" => (int)$new_location,
    "odd_time" => (int)$odd_time,
    "https_status" => (int)$https_status
];

$ch = curl_init("https://risk-ml.onrender.com/predict");

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json"
]);

// 🔥 IMPORTANT FIX for InfinityFree
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);

if ($response === false) {
    die("ML Service Unavailable");
}

curl_close($ch);

$result = json_decode($response, true);

if (!isset($result["risk_level"])) {
    die("Invalid ML Response");
}

$risk_level = $result["risk_level"];
$risk_score = $result["risk_score"];

/* =========================
   STORE LOGIN RECORD
========================= */

$stmt_insert = $conn->prepare("
INSERT INTO login_history 
(user_id, ip_address, user_agent, device_type, login_time, https_status, new_device, odd_time, country, new_location, risk_score, risk_level) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt_insert->bind_param(
    "issssiiisiis",
    $user_id,
    $ip,
    $user_agent,
    $device_type,
    $login_time,
    $https_status,
    $new_device,
    $odd_time,
    $country,
    $new_location,
    $risk_score,
    $risk_level
);

if (!$stmt_insert->execute()) {
    die("Insert failed: " . $stmt_insert->error);
}

/* =========================
   ADAPTIVE RESPONSE
========================= */

if ($risk_level === "HIGH") {

    echo "<h3 style='color:red;'>⚠ High Risk Login Detected!</h3>";
    echo "Access temporarily restricted.";
    exit();

} elseif ($risk_level === "MEDIUM") {

    $_SESSION["temp_user_id"] = $user_id;
    $_SESSION["temp_username"] = $username;
    $_SESSION["temp_risk_level"] = $risk_level;

    $otp = rand(100000, 999999);
    $_SESSION["otp"] = $otp;
    $_SESSION["otp_expiry"] = time() + 300;

    header("Location: otp_verify.php");
    exit();

} else {

    $_SESSION["user_id"] = $user_id;
    $_SESSION["username"] = $username;
    $_SESSION["risk_level"] = $risk_level;

    header("Location: dashboard.php");
    exit();
}
?>