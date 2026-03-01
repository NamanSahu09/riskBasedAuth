<?php
session_start();

if (!isset($_SESSION["temp_user_id"])) {
    header("Location: test_login.html");
    exit();
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $entered_otp = $_POST["otp"];

    if (time() > $_SESSION["otp_expiry"]) {
        die("OTP Expired!");
    }

    if ($entered_otp == $_SESSION["otp"]) {

        // Move temp session to real session
        $_SESSION["user_id"] = $_SESSION["temp_user_id"];
        $_SESSION["username"] = $_SESSION["temp_username"];
        $_SESSION["risk_level"] = $_SESSION["temp_risk_level"];

        // Cleanup
        unset($_SESSION["otp"]);
        unset($_SESSION["otp_expiry"]);
        unset($_SESSION["temp_user_id"]);
        unset($_SESSION["temp_username"]);
        unset($_SESSION["temp_risk_level"]);

        header("Location: dashboard.php");
        exit();

    } else {
        echo "Invalid OTP!";
    }
}
?>

<h3>Enter OTP</h3>
<p><b>Simulation OTP:</b> <?php echo $_SESSION["otp"]; ?></p>

<form method="POST">
    <input type="text" name="otp" placeholder="Enter OTP" required>
    <button type="submit">Verify</button>
</form>

