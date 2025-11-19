<?php
// api/stats_service_items.php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed'], 405);
}

$serviceId = isset($_GET['service_id']) ? (int)$_GET['service_id'] : 0;
if ($serviceId < 0) {
    json_response(['error' => 'Invalid service_id'], 400);
}

try {
    if ($serviceId === 0) {
        // "Unknown": films where service_id IS NULL
        $sql = '
            SELECT
                f.id,
                f.title,
                f.watched_at,
                l.id   AS list_id,
                l.name AS list_name,
                NULL   AS service_id,
                "Unknown" AS service_name,
                "unknown" AS service_code
            FROM films f
            JOIN lists l ON f.list_id = l.id
            WHERE f.service_id IS NULL
            ORDER BY l.name, f.display_order, f.title, f.title
        ';
        $stmt = $pdo->query($sql);
    } else {
        $sql = '
            SELECT
                f.id,
                f.title,
                f.watched_at,
                l.id   AS list_id,
                l.name AS list_name,
                s.id   AS service_id,
                s.name AS service_name,
                s.code AS service_code
            FROM films f
            JOIN lists l ON f.list_id = l.id
            LEFT JOIN services s ON f.service_id = s.id
            WHERE f.service_id = ?
            ORDER BY l.name, f.display_order, f.title
        ';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$serviceId]);
    }

    $items = $stmt->fetchAll();
    json_response($items);
} catch (Throwable $e) {
    json_response(
        ['error' => 'Database error', 'details' => $e->getMessage()],
        500
    );
}
