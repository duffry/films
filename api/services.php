<?php
// api/services.php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed'], 405);
}

try {
    $stmt = $pdo->query('SELECT id, name, code FROM services ORDER BY name');
    $services = $stmt->fetchAll();
    json_response($services);
} catch (Throwable $e) {
    json_response(['error' => 'Database error', 'details' => $e->getMessage()], 500);
}
