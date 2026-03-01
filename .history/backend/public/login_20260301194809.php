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
// For testing location manually:
// $ip = "8.8.8.8";

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
$result_device = $stmt_device->get_result();
$row_device = $result_device->fetch_assoc();

$new_device = ($row_device["count"] > 0) ? 0 : 1;

/* =========================
   ODD TIME DETECTION
========================= */

$hour = date("H");
$odd_time = ($hour >= 0 && $hour <= 5) ? 1 : 0;

/* =========================
   LOCATION DETECTION
========================= */

$country = "Unknown";

$geo_data = @file_get_contents("http://ip-api.com/json/" . $ip);

if ($geo_data !== false) {
    $geo_json = json_decode($geo_data, true);
    if (isset($geo_json["country"])) {
        $country = $geo_json["country"];
    }
}

$stmt_location = $conn->prepare("SELECT COUNT(*) as count FROM login_history WHERE user_id = ? AND country = ?");
$stmt_location->bind_param("is", $user_id, $country);
$stmt_location->execute();
$result_location = $stmt_location->get_result();
$row_location = $result_location->fetch_assoc();

$new_location = ($row_location["count"] > 0) ? 0 : 1;

/* =========================
   RISK SCORE CALCULATION
========================= */

$risk_score = 0;

if ($new_device)     $risk_score += 30;
if ($new_location)   $risk_score += 30;
if ($odd_time)       $risk_score += 20;
if (!$https_status)  $risk_score += 20;

if ($risk_score >= 70) {
    $risk_level = "HIGH";
} elseif ($risk_score >= 40) {
    $risk_level = "MEDIUM";
} else {
    $risk_level = "LOW";
}

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

} 
elseif ($risk_level === "MEDIUM") 
{

    // Generate OTP
    $_SESSION["temp_user_id"] = $user_id;
    $_SESSION["temp_username"] = $username;
    $_SESSION["temp_risk_level"] = $risk_level;

    $otp = rand(100000, 999999);
    $_SESSION["otp"] = $otp;
    $_SESSION["otp_expiry"] = time() + 300; // 5 min expiry 
    header("Location: otp_verify.php");
    exit();
    //echo "<h3>Medium Risk Login</h3>";
    //echo "OTP Generated (Simulation): <b>$otp</b><br>";
    //echo "<a href='otp_verify.php'>Verify OTP</a>";
    //exit();

} 
  else 
  {

    // LOW RISK → direct login
    $_SESSION["user_id"] = $user_id;
    $_SESSION["username"] = $username;
    $_SESSION["risk_level"] = $risk_level;

    header("Location: dashboard.php");
    exit();
}

?>