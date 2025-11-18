<?php
// api/films.php
require 'db.php';

$listId = filter_input(INPUT_GET, 'list_id', FILTER_VALIDATE_INT);

if (!$listId) {
    json_response(['error' => 'Missing or invalid list_id'], 400);
}

$sql = '
    SELECT
        id,
        title,
        year,
        notes,
        watched_at,
        display_order
    FROM films
    WHERE list_id = ?
    ORDER BY
        display_order IS NULL,   -- rows with an explicit order first
        display_order,
        id
';

$stmt = $pdo->prepare($sql);
$stmt->execute([$listId]);
$rows = $stmt->fetchAll();

json_response($rows);
