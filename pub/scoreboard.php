<?php
// Connect to MySQL database
$servername = "localhost";
$username = "root";
$password = "root";
$dbname = "hacktricksNew";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Fetch teams and points from database
$sql = "SELECT team_name, points FROM teams ORDER BY points DESC";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $teams = array();
    while($row = $result->fetch_assoc()) {
        $teams[] = $row;
    }
    echo json_encode($teams);
} else {
    echo json_encode(array());
}

$conn->close();
?>
