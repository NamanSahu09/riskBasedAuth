<?php
session_start();

if (!isset($_SESSION["user_id"])) {
    header("Location: test_login.html");
    exit();
}
?>

<h2>Welcome, <?php echo $_SESSION["username"]; ?></h2>
<p>Risk Level: <?php echo $_SESSION["risk_level"]; ?></p>

<a href="logout.php">Logout</a>
