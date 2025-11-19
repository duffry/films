<?php
// api/films.php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed'], 405);
}

$listId = isset($_GET['list_id']) ? (int)$_GET['list_id'] : 0;
if ($listId <= 0) {
    json_response(['error' => 'Invalid list_id'], 400);
}

try {
    $stmt = $pdo->prepare(
        'SELECT
             f.id,
             f.list_id,
             f.title,
             f.year,
             f.notes,
             f.watched_at,
             f.display_order,
             f.service_id,
             s.name AS service_name,
             s.code AS service_code
         FROM films f
         LEFT JOIN services s ON f.service_id = s.id
         WHERE f.list_id = ?
         ORDER BY f.display_order, f.title'
    );
    $stmt->execute([$listId]);
    $films = $stmt->fetchAll();

    json_response($films);
} catch (Throwable $e) {
    json_response(['error' => 'Database error', 'details' => $e->getMessage()], 500);
}
