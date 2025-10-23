<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$chapterId = $_GET['chapterId'] ?? null;

if (!$chapterId) {
    http_response_code(400);
    echo json_encode(['error' => 'Brak chapterId']);
    exit;
}

// Połącz z bazą danych i wykonaj zapytanie
 $host = 'localhost';
    $dbname = 'library'; // nazwa twojej bazy danych
    $username = 'root';     // domyślnie w XAMPP to 'root'
    $password = '';         // domyślnie w XAMPP puste
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$stmt = $pdo->prepare('SELECT * FROM chapter_content WHERE chapter_id = ?');
$stmt->execute([$chapterId]);
$result = $stmt->fetch(PDO::FETCH_ASSOC);

if ($result) {
    echo json_encode($result);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Chapter nie znaleziony']);
}