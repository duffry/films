<?php
// api/film.php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed'], 405);
}

$filmId = isset($_GET['film_id']) ? (int)$_GET['film_id'] : 0;
if ($filmId <= 0) {
    json_response(['error' => 'Invalid film_id'], 400);
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
             s.code AS service_code,
             l.name AS list_name,
             l.description AS list_description
         FROM films f
         JOIN lists l        ON f.list_id = l.id
         LEFT JOIN services s ON f.service_id = s.id
         WHERE f.id = ?'
    );
    $stmt->execute([$filmId]);
    $film = $stmt->fetch();

    if (!$film) {
        json_response(['error' => 'Film not found'], 404);
    }

    json_response($film);
} catch (Throwable $e) {
    json_response(
        ['error' => 'Database error', 'details' => $e->getMessage()],
        500
    );
}
