<?php
require_once "../config/database.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    die("Only POST method allowed");
}

$username = $_POST["username"];
$password = $_POST["password"];

// Get user
$stmt = $conn->prepare("SELECT id, password_hash FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    die("User not found");
}

$user = $result->fetch_assoc();

// Verify password first
if (password_verify($password, $user["password_hash"])) {

    $user_id = $user["id"];
    $ip = $_SERVER['REMOTE_ADDR'];
    $user_agent = $_SERVER['HTTP_USER_AGENT'];
    $login_time = date("Y-m-d H:i:s");
    $https_status = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 1 : 0;

    // Detect device type
    $device_type = (preg_match("/mobile/i", $user_agent)) ? "Mobile" : "Desktop";

    // Check if this device was used before
    $stmt_check = $conn->prepare("SELECT COUNT(*) as count FROM login_history WHERE user_id = ? AND user_agent = ?");
    $stmt_check->bind_param("is", $user_id, $user_agent);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();
    $row_check = $result_check->fetch_assoc();

    $new_device = ($row_check["count"] > 0) ? 0 : 1;

    // Odd time detection
    $hour = date("H");
    $odd_time = ($hour >= 0 && $hour <= 5) ? 1 : 0;

    // Insert into DB
    $stmt2 = $conn->prepare("INSERT INTO login_history (user_id, ip_address, user_agent, login_time, https_status, new_device, odd_time) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt2->bind_param("isssiii", $user_id, $ip, $user_agent, $login_time, $https_status, $new_device, $odd_time);
    $stmt2->execute();

    echo "Login successful + behaviour captured!";
} else {
    echo "Invalid password!";
}
?>