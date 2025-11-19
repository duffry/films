<?php
// api/film_update.php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    json_response(['error' => 'Invalid JSON'], 400);
}

$filmId = isset($input['film_id']) ? (int)$input['film_id'] : 0;
if ($filmId <= 0) {
    json_response(['error' => 'Invalid film_id'], 400);
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

$watchedAt = $input['watched_at'] ?? null;
if ($watchedAt === '' || $watchedAt === null) {
    $watchedAt = null;
} else {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $watchedAt)) {
        json_response(['error' => 'Invalid watched_at date'], 422);
    }
}

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
    $stmt = $pdo->prepare(
        'UPDATE films
         SET title = ?, year = ?, notes = ?, watched_at = ?, service_id = ?
         WHERE id = ?'
    );
    $stmt->execute([$title, $year, $notes, $watchedAt, $serviceId, $filmId]);

    $stmt2 = $pdo->prepare(
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
    $stmt2->execute([$filmId]);
    $film = $stmt2->fetch();

    if (!$film) {
        json_response(['error' => 'Film not found after update'], 404);
    }

    json_response($film);
} catch (Throwable $e) {
    json_response(['error' => 'Database error', 'details' => $e->getMessage()], 500);
}
