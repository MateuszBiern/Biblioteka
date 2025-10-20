<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$bookId = $_GET['bookId'] ?? null;
$chapterId = $_GET['id'] ?? null;

try {
    // DOSTOSUJ TE DANE DO SWOJEJ BAZY DANYCH
    $host = 'localhost';
    $dbname = 'library'; // nazwa twojej bazy danych
    $username = 'root';     // domyślnie w XAMPP to 'root'
    $password = '';         // domyślnie w XAMPP puste
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($bookId) {
        // Pobierz wszystkie rozdziały książki
        $stmt = $pdo->prepare('SELECT * FROM book_chapters WHERE book_id = ? ORDER BY chapter_order');
        $stmt->execute([$bookId]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($results);
    } elseif ($chapterId) {
        // Pobierz pojedynczy rozdział
        $stmt = $pdo->prepare('SELECT * FROM book_chapters WHERE id = ?');
        $stmt->execute([$chapterId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Brak parametrów']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Błąd bazy danych: ' . $e->getMessage()]);
}
?>