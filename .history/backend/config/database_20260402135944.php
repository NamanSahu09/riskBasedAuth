<?php

$host = "sql100.byetcluster.com";   // ✅ exact host from panel
$user = "if0_41559408";          
$password = "NamanSahu2003";
$dbname = "if0_41559408_risk_auth";

$conn = new mysqli($host, $user, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "DB Connected "; // test ke liye
