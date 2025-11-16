<?php
// api/film_watch.php
require 'db.php';

// Helper to extract film_id from JSON body OR query string (for testing)
function get_film_id() {
    // First try JSON body
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (is_array($data) && isset($data['film_id'])) {
        return (int)$data['film_id'];
    }

    // Fallback: allow GET ?film_id=... for simple manual testing
    $fromGet = filter_input(INPUT_GET, 'film_id', FILTER_VALIDATE_INT);
    if ($fromGet !== null && $fromGet !== false) {
        return (int)$fromGet;
    }

    return 0;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed'], 405);
}

$filmId = get_film_id();

if ($filmId <= 0) {
    json_response(['error' => 'Invalid or missing film_id'], 400);
}

// Update watched_at to today
$stmt = $pdo->prepare('UPDATE films SET watched_at = CURDATE() WHERE id = ?');
$stmt->execute([$filmId]);

// Fetch the updated row
$stmt = $pdo->prepare(
    'SELECT id, list_id, title, year, notes, watched_at, display_order
     FROM films
     WHERE id = ?'
);
$stmt->execute([$filmId]);
$film = $stmt->fetch();

if (!$film) {
    json_response(['error' => 'Film not found'], 404);
}

json_response($film);
