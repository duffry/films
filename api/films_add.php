<?php
// api/films_add.php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    json_response(['error' => 'Invalid JSON'], 400);
}

$listId = isset($input['list_id']) ? (int)$input['list_id'] : 0;
if ($listId <= 0) {
    json_response(['error' => 'Invalid list_id'], 400);
}

$title = trim($input['title'] ?? '');
if ($title === '') {
    json_response(['error' => 'Title is required'], 422);
}

$year = $input['year'] ?? null;
if ($year !== null && $year !== '') {
    $year = (int)$year;
    if ($year <= 0 || $year > 9999) {
        json_response(['error' => 'Invalid year'], 422);
    }
} else {
    $year = null;
}

$notes = trim($input['notes'] ?? '');

$serviceId = $input['service_id'] ?? null;
if ($serviceId === '' || $serviceId === null) {
    $serviceId = null;
} else {
    $serviceId = (int)$serviceId;
    if ($serviceId <= 0) {
        $serviceId = null;
    }
}

try {
    // next display_order for this list
    $stmt = $pdo->prepare(
        'SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order
         FROM films
         WHERE list_id = ?'
    );
    $stmt->execute([$listId]);
    $nextOrder = (int)$stmt->fetchColumn();

    $stmt2 = $pdo->prepare(
        'INSERT INTO films (list_id, display_order, title, year, notes, watched_at, service_id)
         VALUES (?, ?, ?, ?, ?, NULL, ?)'
    );
    $stmt2->execute([$listId, $nextOrder, $title, $year, $notes, $serviceId]);

    $newId = (int)$pdo->lastInsertId();

    $stmt3 = $pdo->prepare(
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
         WHERE f.id = ?'
    );
    $stmt3->execute([$newId]);
    $film = $stmt3->fetch();

    json_response($film, 201);
} catch (Throwable $e) {
    json_response(['error' => 'Database error', 'details' => $e->getMessage()], 500);
}
