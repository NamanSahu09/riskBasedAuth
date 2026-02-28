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
    echo "Login successful!";
} else {
    echo "Invalid password!";
}
?>