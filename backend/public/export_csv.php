<?php
require_once "../config/database.php";

// Force CSV download
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="login_history_dataset.csv"');

// Open output stream
$output = fopen("php://output", "w");

// CSV column headers
fputcsv($output, [
    "new_device",
    "new_location",
    "odd_time",
    "https_status",
    "risk_score",
    "risk_level"
    
]);

// Fetch dataset
$query = "
SELECT 
    new_device,
    new_location,
    odd_time,
    https_status,
    risk_score,
    risk_level
FROM login_history
";

$result = $conn->query($query);

// Write rows
while ($row = $result->fetch_assoc()) {
    fputcsv($output, $row);
}

fclose($output);
exit();
?>