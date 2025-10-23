<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(0);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Brak danych']);
    exit;
}

try {
    $host = 'localhost';
    $dbname = 'library';
    $username = 'root';
    $password = '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Utwórz folder dla zdjęć jeśli nie istnieje
    $uploadDir = __DIR__ . '/book_covers/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Obsługa zdjęcia
    $coverImagePath = '';
    if (!empty($input['cover_image']) && strpos($input['cover_image'], 'data:image') === 0) {
        $imageData = $input['cover_image'];
        
        // Wyodrębnij typ MIME i dane base64
        list($type, $data) = explode(';', $imageData);
        list(, $data) = explode(',', $data);
        $data = base64_decode($data);
        
        // Określ rozszerzenie pliku
        $extension = 'jpg';
        if (strpos($type, 'png') !== false) $extension = 'png';
        elseif (strpos($type, 'gif') !== false) $extension = 'gif';
        elseif (strpos($type, 'webp') !== false) $extension = 'webp';
        elseif (strpos($type, 'jpeg') !== false) $extension = 'jpg';
        
        // Zapisz plik
        $filename = 'book_' . time() . '_' . uniqid() . '.' . $extension;
        $filepath = $uploadDir . $filename;
        
        if (file_put_contents($filepath, $data)) {
            $coverImagePath = 'book_covers/' . $filename;
        }
    }
    
    // 1. Dodaj książkę
    $stmt = $pdo->prepare('INSERT INTO books (title, author, description, cover_image) VALUES (?, ?, ?, ?)');
    $stmt->execute([
        $input['title'],
        $input['author'],
        $input['description'] ?? '',
        $coverImagePath
    ]);
    
    $bookId = $pdo->lastInsertId();

    // 2. Dodaj tagi
    if (!empty($input['tags'])) {
        foreach ($input['tags'] as $tag) {
            if (!empty(trim($tag))) {
                $checkTag = $pdo->prepare('SELECT id FROM tags WHERE name = ?');
                $checkTag->execute([trim($tag)]);
                $tagId = $checkTag->fetchColumn();
                
                if (!$tagId) {
                    $insertTag = $pdo->prepare('INSERT INTO tags (name) VALUES (?)');
                    $insertTag->execute([trim($tag)]);
                    $tagId = $pdo->lastInsertId();
                }
                
                $bookTag = $pdo->prepare('INSERT INTO book_tags (book_id, tag_id) VALUES (?, ?)');
                $bookTag->execute([$bookId, $tagId]);
            }
        }
    }

    // 3. Dodaj rozdziały
    if (!empty($input['chapters'])) {
        foreach ($input['chapters'] as $index => $chapter) {
            if (!empty($chapter['title']) && !empty($chapter['content'])) {
                $chapterStmt = $pdo->prepare('INSERT INTO book_chapters (book_id, title, chapter_order) VALUES (?, ?, ?)');
                $chapterStmt->execute([$bookId, $chapter['title'], $index + 1]);
                $chapterId = $pdo->lastInsertId();
                
                $contentStmt = $pdo->prepare('INSERT INTO chapter_content (chapter_id, content) VALUES (?, ?)');
                $contentStmt->execute([$chapterId, $chapter['content']]);
            }
        }
    }

    echo json_encode(['success' => true, 'book_id' => $bookId, 'cover_path' => $coverImagePath]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Błąd: ' . $e->getMessage()]);
}
?>