<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$conn = new mysqli("localhost", "root", "", "library");

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'error' => 'Connection failed: ' . $conn->connect_error]));
}

// Pobierz metodę żądania
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Obsługa preflight request (CORS)
if ($method == 'OPTIONS') {
    exit(0);
}

if ($method == 'GET') {
    switch($action) {
        case 'get_all_books':
            get_all_books($conn);
            break;
        case 'get_book_details':
            get_book_details($conn);
            break;
            case 'update_book_title':
    update_book_title($conn, $input);
    break;
    case 'update_book_description':
    update_book_description($conn, $input);
    break;
    
        default:
            echo json_encode(['success' => false, 'error' => 'Unknown action']);
    }
} else if ($method == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch($action) {
        case 'delete_chapters':
            delete_chapters($conn, $input);
            break;
        case 'update_chapter':
            update_chapter($conn, $input);
            break;
        case 'delete_book':
            delete_book($conn, $input);
            break;
            case 'update_book_title':
    update_book_title($conn, $input);
    break;
    
        default:
            echo json_encode(['success' => false, 'error' => 'Unknown action']);
    }
}

function get_all_books($conn) {
    $sql = "SELECT 
                b.id, 
                b.title, 
                b.description, 
                b.cover_image,
                COUNT(bc.id) as chapter_count
            FROM books b 
            LEFT JOIN book_chapters bc ON b.id = bc.book_id 
            GROUP BY b.id 
            ORDER BY b.title";

    $result = $conn->query($sql);

    $books = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $books[] = [
                'id' => (int)$row['id'],
                'title' => $row['title'],
                'description' => $row['description'],
                'cover_image' => $row['cover_image'],
                'chapters' => []
            ];
        }
    }

    echo json_encode($books);
}

function get_book_details($conn) {
    $bookId = $_GET['id'] ?? 0;
    
    if (!$bookId) {
        echo json_encode(['success' => false, 'error' => 'Book ID required']);
        return;
    }

    // Pobierz książkę
    $bookSql = "SELECT * FROM books WHERE id = ?";
    $stmt = $conn->prepare($bookSql);
    $stmt->bind_param("i", $bookId);
    $stmt->execute();
    $bookResult = $stmt->get_result();
    $book = $bookResult->fetch_assoc();

    if (!$book) {
        echo json_encode(['success' => false, 'error' => 'Book not found']);
        return;
    }

    // Pobierz rozdziały z treścią
    $chaptersSql = "SELECT 
                        bc.id,
                        bc.book_id,
                        bc.chapter_order,
                        bc.title,
                        cc.content
                    FROM book_chapters bc
                    LEFT JOIN chapter_content cc ON bc.id = cc.chapter_id
                    WHERE bc.book_id = ?
                    ORDER BY bc.chapter_order";

    $stmt = $conn->prepare($chaptersSql);
    $stmt->bind_param("i", $bookId);
    $stmt->execute();
    $chaptersResult = $stmt->get_result();

    $chapters = [];
    while($chapter = $chaptersResult->fetch_assoc()) {
        $chapters[] = [
            'id' => (int)$chapter['id'],
            'book_id' => (int)$chapter['book_id'],
            'chapter_order' => (int)$chapter['chapter_order'],
            'title' => $chapter['title'],
            'content' => $chapter['content']
        ];
    }

    $book['id'] = (int)$book['id'];
    $book['chapters'] = $chapters;

    echo json_encode($book);
}

function delete_chapters($conn, $data) {
    if (!isset($data['chapterIds']) || !is_array($data['chapterIds']) || empty($data['chapterIds'])) {
        echo json_encode(['success' => false, 'error' => 'No chapters selected']);
        return;
    }

    $chapterIds = array_map('intval', $data['chapterIds']);
    $placeholders = str_repeat('?,', count($chapterIds) - 1) . '?';
    
    // Rozpocznij transakcję
    $conn->begin_transaction();
    
    try {
        // Usuń treść rozdziałów
        $deleteContentSql = "DELETE FROM chapter_content WHERE chapter_id IN ($placeholders)";
        $stmt = $conn->prepare($deleteContentSql);
        $stmt->bind_param(str_repeat('i', count($chapterIds)), ...$chapterIds);
        $stmt->execute();
        
        // Usuń rozdziały
        $deleteChaptersSql = "DELETE FROM book_chapters WHERE id IN ($placeholders)";
        $stmt = $conn->prepare($deleteChaptersSql);
        $stmt->bind_param(str_repeat('i', count($chapterIds)), ...$chapterIds);
        $stmt->execute();
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Chapters deleted successfully']);
        
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'error' => 'Failed to delete chapters: ' . $e->getMessage()]);
    }
}

function update_chapter($conn, $data) {
    if (!isset($data['chapterId']) || !isset($data['field']) || !isset($data['value'])) {
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        return;
    }
    
    $chapterId = (int)$data['chapterId'];
    $field = $data['field'];
    $value = $data['value'];
    
    // Sprawdź czy pole jest dozwolone
    $allowedFields = ['title', 'content'];
    if (!in_array($field, $allowedFields)) {
        echo json_encode(['success' => false, 'error' => 'Invalid field']);
        return;
    }
    
    if ($field === 'title') {
        // Aktualizuj tytuł w book_chapters
        $sql = "UPDATE book_chapters SET title = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $value, $chapterId);
    } else if ($field === 'content') {
        // Aktualizuj treść w chapter_content
        $sql = "UPDATE chapter_content SET content = ? WHERE chapter_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $value, $chapterId);
    }
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update chapter']);
    }
}
function update_book_title($conn, $data) {
    if (!isset($data['bookId']) || !isset($data['title'])) {
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        return;
    }
    
    $bookId = (int)$data['bookId'];
    $title = $conn->real_escape_string($data['title']);
    
    $sql = "UPDATE books SET title = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $title, $bookId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update book title']);
    }
}
function delete_book($conn, $data) {
    if (!isset($data['bookId'])) {
        echo json_encode(['success' => false, 'error' => 'Book ID required']);
        return;
    }
    
    $bookId = (int)$data['bookId'];
    
    // Rozpocznij transakcję
    $conn->begin_transaction();
    
    try {
        // 1. Pobierz ID rozdziałów tej książki
        $getChaptersSql = "SELECT id FROM book_chapters WHERE book_id = ?";
        $stmt = $conn->prepare($getChaptersSql);
        $stmt->bind_param("i", $bookId);
        $stmt->execute();
        $chaptersResult = $stmt->get_result();
        
        $chapterIds = [];
        while($row = $chaptersResult->fetch_assoc()) {
            $chapterIds[] = $row['id'];
        }
        
        // 2. Usuń treść rozdziałów
        if (!empty($chapterIds)) {
            $placeholders = str_repeat('?,', count($chapterIds) - 1) . '?';
            $deleteContentSql = "DELETE FROM chapter_content WHERE chapter_id IN ($placeholders)";
            $stmt = $conn->prepare($deleteContentSql);
            $stmt->bind_param(str_repeat('i', count($chapterIds)), ...$chapterIds);
            $stmt->execute();
        }
        
        // 3. Usuń rozdziały
        $deleteChaptersSql = "DELETE FROM book_chapters WHERE book_id = ?";
        $stmt = $conn->prepare($deleteChaptersSql);
        $stmt->bind_param("i", $bookId);
        $stmt->execute();
        
        // 4. Usuń książkę
        $deleteBookSql = "DELETE FROM books WHERE id = ?";
        $stmt = $conn->prepare($deleteBookSql);
        $stmt->bind_param("i", $bookId);
        $stmt->execute();
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Book deleted successfully']);
        
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'error' => 'Failed to delete book: ' . $e->getMessage()]);
    }
}

$conn->close();
?>