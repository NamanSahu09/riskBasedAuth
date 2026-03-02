<?
// export the Login Risk Summary to csv for model training


require_once "../config/database.php";

// Set headers for download
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

// Fetch data
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

while ($row = $result->fetch_assoc()) {
    fputcsv($output, $row);
}

fclose($output);
exit();
?>


