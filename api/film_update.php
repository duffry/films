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

$title = isset($input['title']) ? trim($input['title']) : '';
if ($title === '') {
    json_response(['error' => 'Title is required'], 400);
}

$year = null;
if (array_key_exists('year', $input) && $input['year'] !== null) {
    $year = (int)$input['year'];
    if ($year <= 0 || $year > 9999) {
        json_response(['error' => 'Invalid year'], 400);
    }
}

$notes = isset($input['notes']) ? trim($input['notes']) : null;
if ($notes === '') {
    $notes = null;
}

$watchedAt = null;
if (array_key_exists('watched_at', $input) && $input['watched_at'] !== null) {
    $watchedAt = trim($input['watched_at']);
    if ($watchedAt === '') {
        $watchedAt = null;
    }
    // Basic sanity check – format YYYY-MM-DD (no deep validation)
    if ($watchedAt !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $watchedAt)) {
        json_response(['error' => 'Invalid watched_at date format'], 400);
    }
}

$serviceId = null;
if (array_key_exists('service_id', $input) && $input['service_id'] !== null) {
    $serviceId = (int)$input['service_id'];
    if ($serviceId <= 0) {
        $serviceId = null; // treat non-positive as unset
    }
}

$listId = isset($input['list_id']) ? (int)$input['list_id'] : 0;
if ($listId <= 0) {
    json_response(['error' => 'Invalid list_id'], 400);
}

try {
    // Update the film
    $stmt = $pdo->prepare(
        'UPDATE films
            SET list_id = :list_id,
                title = :title,
                year = :year,
                notes = :notes,
                watched_at = :watched_at,
                service_id = :service_id
          WHERE id = :film_id'
    );

    $stmt->execute([
        ':list_id'    => $listId,
        ':title'      => $title,
        ':year'       => $year,
        ':notes'      => $notes,
        ':watched_at' => $watchedAt,
        ':service_id' => $serviceId,
        ':film_id'    => $filmId,
    ]);

    if ($stmt->rowCount() === 0) {
        // Could be no change or missing film – check existence explicitly
        $check = $pdo->prepare('SELECT id FROM films WHERE id = ?');
        $check->execute([$filmId]);
        if (!$check->fetch()) {
            json_response(['error' => 'Film not found'], 404);
        }
    }

    // Return the updated row with list + service info
    $stmt2 = $pdo->prepare(
        'SELECT
            f.id,
            f.list_id,
            l.name AS list_name,
            l.description AS list_description,
            f.display_order,
            f.title,
            f.year,
            f.notes,
            f.watched_at,
            f.service_id,
            s.name AS service_name,
            s.code AS service_code
         FROM films f
         JOIN lists l ON f.list_id = l.id
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
    json_response(
        ['error' => 'Database error', 'details' => $e->getMessage()],
        500
    );
}
