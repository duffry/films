<?php
// api/lists.php
require 'db.php';

$sql = '
    SELECT
        l.id,
        l.name,
        l.description,
        COUNT(f.id) AS total_films,
        SUM(CASE WHEN f.watched_at IS NOT NULL THEN 1 ELSE 0 END) AS watched_films
    FROM lists l
    LEFT JOIN films f ON f.list_id = l.id
    GROUP BY l.id, l.name, l.description
    ORDER BY l.name
';

$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll();

json_response($rows);
