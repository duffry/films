<?php
// api/lists_add.php

// Turn on error reporting for this script (handy while developing)
error_reporting(E_ALL);
ini_set('display_errors', '1');

require 'db.php';

// Always send JSON
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST' && $method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed', 'method' => $method]);
    exit;
}

// ----- read input -----
$name = '';
$description = '';

if ($method === 'POST') {
    // Expect JSON body from the JS fetch
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];

    $name        = isset($data['name']) ? trim($data['name']) : '';
    $description = isset($data['description']) ? trim($data['description']) : '';
} else {
    // GET mode for manual testing: ?name=Test&description=Something
    $name        = isset($_GET['name']) ? trim($_GET['name']) : '';
    $description = isset($_GET['description']) ? trim($_GET['description']) : '';
}

if ($name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'List name is required']);
    exit;
}

// ----- insert into DB -----
try {
    $stmt = $pdo->prepare('INSERT INTO lists (name, description) VALUES (?, ?)');
    $stmt->execute([
        $name,
        $description !== '' ? $description : null
    ]);
    $id = (int)$pdo->lastInsertId();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error'   => 'Database error',
        'details' => $e->getMessage()
    ]);
    exit;
}

// ----- success -----
http_response_code(201);
echo json_encode([
    'id'             => $id,
    'name'           => $name,
    'description'    => $description !== '' ? $description : null,
    'total_films'    => 0,
    'watched_films'  => 0,
    'last_watched_at'=> null
]);
