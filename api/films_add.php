<?php
// api/films_add.php

error_reporting(E_ALL);
ini_set('display_errors', '1');

require 'db.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST' && $method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed', 'method' => $method]);
    exit;
}

$listId = 0;
$title = '';
$year = null;
$notes = '';

// --- read input ---
if ($method === 'POST') {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];

    $listId = isset($data['list_id']) ? (int)$data['list_id'] : 0;
    $title  = isset($data['title']) ? trim($data['title']) : '';
    $notes  = isset($data['notes']) ? trim($data['notes']) : '';

    if (isset($data['year']) && $data['year'] !== '' && $data['year'] !== null) {
        $y = (int)$data['year'];
        $year = $y > 0 ? $y : null;
    }

} else {
    // GET mode for quick manual testing:
    // films_add.php?list_id=1&title=Test&year=2024&notes=Something
    $listId = isset($_GET['list_id']) ? (int)$_GET['list_id'] : 0;
    $title  = isset($_GET['title']) ? trim($_GET['title']) : '';
    $notes  = isset($_GET['notes']) ? trim($_GET['notes']) : '';

    if (isset($_GET['year']) && $_GET['year'] !== '') {
        $y = (int)$_GET['year'];
        $year = $y > 0 ? $y : null;
    }
}

if ($listId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'list_id is required and must be > 0']);
    exit;
}

if ($title === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Film title is required']);
    exit;
}

// --- compute next display_order within this list ---
try {
    $stmt = $pdo->prepare('SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM films WHERE list_id = ?');
    $stmt->execute([$listId]);
    $nextOrder = (int)$stmt->fetchColumn();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error (order)', 'details' => $e->getMessage()]);
    exit;
}

// --- insert row ---
try {
    $stmt = $pdo->prepare(
        'INSERT INTO films (list_id, display_order, title, year, notes, watched_at)
         VALUES (?, ?, ?, ?, ?, NULL)'
    );
    $stmt->execute([
        $listId,
        $nextOrder,
        $title,
        $year,
        $notes !== '' ? $notes : null
    ]);
    $id = (int)$pdo->lastInsertId();

    // fetch the inserted film
    $stmt = $pdo->prepare(
        'SELECT id, list_id, title, year, notes, watched_at, display_order
         FROM films
         WHERE id = ?'
    );
    $stmt->execute([$id]);
    $film = $stmt->fetch();

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error (insert)', 'details' => $e->getMessage()]);
    exit;
}

http_response_code(201);
echo json_encode($film);
