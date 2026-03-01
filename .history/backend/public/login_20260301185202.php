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

// Verify password
if (password_verify($password, $user["password_hash"])) {

    $user_id = $user["id"];
    $ip = $_SERVER['REMOTE_ADDR'];
    $user_agent = $_SERVER['HTTP_USER_AGENT'];
    $login_time = date("Y-m-d H:i:s");
    $https_status = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 1 : 0;

    $stmt2 = $conn->prepare("INSERT INTO login_history (user_id, ip_address, user_agent, login_time, https_status) VALUES (?, ?, ?, ?, ?)");
    $stmt2->bind_param("isssi", $user_id, $ip, $user_agent, $login_time, $https_status);
    //int string string string int
    $stmt2->execute();

    echo "Login successful + behaviour captured!";
}
?>
//Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36