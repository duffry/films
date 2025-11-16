<?php
// api/lists.php
require 'db.php';

$stmt = $pdo->query('SELECT id, name, description FROM lists ORDER BY name');
$rows = $stmt->fetchAll();

json_response($rows);
