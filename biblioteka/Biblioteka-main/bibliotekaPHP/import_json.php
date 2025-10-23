<?php
$conn = new mysqli("localhost", "root", "", "library");
if ($conn->connect_error) {
    die("Błąd połączenia: " . $conn->connect_error);
}

$folder = __DIR__ . '/mojprojekt';
$files = glob($folder . "/*.json");

if (!$files) die("Brak plików JSON w folderze mojprojekt.");

foreach ($files as $file) {
    echo "<h3>📘 Przetwarzanie pliku: " . basename($file) . "</h3>";

    $json = file_get_contents($file);
    $data = json_decode($json, true);

    if (!isset($data['chapters']) || !is_array($data['chapters'])) {
        echo "⚠️ Plik " . basename($file) . " nie zawiera poprawnych danych.<br>";
        continue;
    }

    foreach ($data['chapters'] as $chapter) {
        $bookId = $data['bookId'] ?? 0;
        $title = $conn->real_escape_string($chapter['title']);
        $chapterOrder = $chapter['chapter_order'];
        $content = $conn->real_escape_string($chapter['content']);

        // 🔍 Sprawdź, czy rozdział już istnieje
        $check = $conn->query("SELECT id FROM book_chapters WHERE book_id = '$bookId' AND chapter_order = '$chapterOrder' LIMIT 1");

        if ($check->num_rows === 0) {
            // 1️⃣ Dodaj rozdział
            $sql = "INSERT INTO book_chapters (book_id, title, chapter_order)
                    VALUES ('$bookId', '$title', '$chapterOrder')";
            if ($conn->query($sql)) {
                $chapterId = $conn->insert_id;

                // 2️⃣ Dodaj treść
                $sql2 = "INSERT INTO chapter_content (chapter_id, content)
                         VALUES ('$chapterId', '$content')";
                $conn->query($sql2);

                echo "✅ Dodano rozdział: $title<br>";
            } else {
                echo "❌ Błąd przy dodawaniu rozdziału: " . $conn->error . "<br>";
            }
        } else {
            echo "⏭️ Pominięto istniejący rozdział: $title<br>";
        }
    }
}

echo "<br>✅ Import zakończony dla wszystkich plików JSON.";
$conn->close();
?>
// http://localhost/biblioteka/import_json.php
