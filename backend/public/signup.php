<?php
require_once "../config/database.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    die("Only POST method allowed");
}

$username = trim($_POST["username"]);
$password = trim($_POST["password"]);

if (empty($username) || empty($password)) {
    die("Username and password required");
}

// Check if username already exists
$stmt_check = $conn->prepare("SELECT id FROM users WHERE username = ?");
$stmt_check->bind_param("s", $username);
$stmt_check->execute();
$result_check = $stmt_check->get_result();

if ($result_check->num_rows > 0) {
    die("Username already taken");
}

// Hash password securely
$hashed_password = password_hash($password, PASSWORD_BCRYPT);

// Insert user
$stmt = $conn->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
$stmt->bind_param("ss", $username, $hashed_password);

if ($stmt->execute()) {
    echo "Account created successfully! <a href='test_login.html'>Login now</a>";
} else {
    echo "Error: " . $stmt->error;
}
?>