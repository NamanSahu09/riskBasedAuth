<?php
session_start();
require_once "../config/database.php";

// OPTIONAL: restrict only admin later

$result = $conn->query("
SELECT u.username, l.risk_score, l.risk_level, 
       l.country, l.device_type, l.login_time
FROM login_history l
JOIN users u ON l.user_id = u.id
ORDER BY l.login_time DESC
");
?>

<h2>Admin Risk Dashboard</h2>

<table border="1" cellpadding="8">
<tr>
    <th>User</th>
    <th>Risk Score</th>
    <th>Risk Level</th>
    <th>Country</th>
    <th>Device</th>
    <th>Login Time</th>
</tr>

<?php while($row = $result->fetch_assoc()): ?>
<tr>
    <td><?= $row["username"] ?></td>
    <td><?= $row["risk_score"] ?></td>
    <td style="
        color:
        <?= $row["risk_level"] === 'HIGH' ? 'red' :
           ($row["risk_level"] === 'MEDIUM' ? 'orange' : 'green') ?>">
        <?= $row["risk_level"] ?>
    </td>
    <td><?= $row["country"] ?></td>
    <td><?= $row["device_type"] ?></td>
    <td><?= $row["login_time"] ?></td>
</tr>
<?php endwhile; ?>

</table>