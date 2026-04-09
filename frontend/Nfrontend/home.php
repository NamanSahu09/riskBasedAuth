<?php
session_start();

if(!isset($_SESSION['username']))
{
    header("Location: login.php");
    exit();
}

?>

<!DOCTYPE html>
<html>
<head>
<title>Home Page</title>
<link rel="stylesheet" href="style.css">
</head>

<body>

<nav>
<ul>
<li><a href="home.php">Home</a></li>
<li><a href="about.php">About</a></li>
<li><a href="contact.php">Contact</a></li>
<li><a href="logout.php">Logout</a></li>
</ul>
</nav>

<div class="container">

<h1>Welcome <?php echo $_SESSION['username']; ?> 👋</h1>

<p>This is your Home Page</p>

</div>

<footer>
<p>My Website © 2026</p>
</footer>

</body>
</html>