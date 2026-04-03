<?php

$host = "sqlXXX.infinityfree.com"; // ⚠️ exact host panel se copy kar
$user = "if0_41559408";            // same prefix user
$password = "your_password";       // jo set kiya tha
$dbname = "if0_41559408_risk_auth";

$conn = new mysqli($host, $user, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

?>