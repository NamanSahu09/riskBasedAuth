<?php
session_start();
session_destroy();
header("Location: test_login.html");
exit();
?>