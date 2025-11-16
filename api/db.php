<?php
// api/db.php

$dsn  = 'mysql:host=db5019017679.hosting-data.io;dbname=dbs14970045;charset=utf8mb4';
$user = 'dbu2835808';
$pass = '1X6J1EG9Z3Vx8yx7cVdsxC';

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

$pdo = new PDO($dsn, $user, $pass, $options);

function json_response($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
