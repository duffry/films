<?php
// api/films.php
require 'db.php';

$listId = filter_input(INPUT_GET, 'list_id', FILTER_VALIDATE_INT);

if (!$listId) {
    json_response(['error' => 'Missing or invalid list_id'], 400);
}

$stmt = $pdo->prepare(
    'SELECT id, title, year, notes, watched_at
     FROM films
     WHERE list_id = ?
     ORDER BY title'
);
$stmt->execute([$listId]);
$rows = $stmt->fetchAll();

json_response($rows);
