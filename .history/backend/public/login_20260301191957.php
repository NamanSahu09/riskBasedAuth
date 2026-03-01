<?php
require_once "../config/database.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    die("Only POST method allowed");
}

$username = trim($_POST["username"]);
$password = trim($_POST["password"]);

// Fetch user
$stmt = $conn->prepare("SELECT id, password_hash FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    die("User not found");
}

$user = $result->fetch_assoc();

// Verify password
if (!password_verify($password, $user["password_hash"])) {
    die("Invalid password!");
}

$user_id = $user["id"];

/* =========================
   BEHAVIOUR CAPTURE
========================= */

$ip = $_SERVER['REMOTE_ADDR'];

// FOR TESTING ONLY (remove later)
// $ip = "8.8.8.8";

$user_agent = $_SERVER['HTTP_USER_AGENT'];
$login_time = date("Y-m-d H:i:s");
$https_status = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 1 : 0;

/* =========================
   DEVICE DETECTION
========================= */

$device_type = (preg_match("/mobile/i", $user_agent)) ? "Mobile" : "Desktop";

$stmt_check = $conn->prepare("SELECT COUNT(*) as count FROM login_history WHERE user_id = ? AND user_agent = ?");
$stmt_check->bind_param("is", $user_id, $user_agent);
$stmt_check->execute();
$result_check = $stmt_check->get_result();
$row_check = $result_check->fetch_assoc();

$new_device = ($row_check["count"] > 0) ? 0 : 1;

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

// Check if this country was used before
$stmt_loc = $conn->prepare("SELECT COUNT(*) as count FROM login_history WHERE user_id = ? AND country = ?");
$stmt_loc->bind_param("is", $user_id, $country);
$stmt_loc->execute();
$result_loc = $stmt_loc->get_result();
$row_loc = $result_loc->fetch_assoc();

$new_location = ($row_loc["count"] > 0) ? 0 : 1;

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
   STORE IN DATABASE
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

$stmt_insert->execute();

echo "<h3>Login successful!</h3>";
echo "Risk Score: $risk_score <br>";
echo "Risk Level: $risk_level <br>";
echo "Country: $country <br>";
?>