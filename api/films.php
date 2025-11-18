<?php
// api/films.php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed'], 405);
}

// list_id is required
$listId = isset($_GET['list_id']) ? (int)$_GET['list_id'] : 0;
if ($listId <= 0) {
    json_response(['error' => 'Invalid list_id'], 400);
}

try {
    $stmt = $pdo->prepare(
        'SELECT
             id,
             list_id,
             title,
             year,
             notes,
             watched_at,
             display_order
         FROM films
         WHERE list_id = ?
         ORDER BY
             display_order IS NULL,  -- put NULLs last
             display_order,
             title'
    );

    $stmt->execute([$listId]);
    $films = $stmt->fetchAll();

    json_response($films);
} catch (Throwable $e) {
    json_response(['error' => 'Database error', 'details' => $e->getMessage()], 500);
}
