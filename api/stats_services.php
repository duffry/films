<?php
// api/stats_services.php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed'], 405);
}

try {
    $stmt = $pdo->query(
        'SELECT
             COALESCE(s.id, 0) AS service_id,
             COALESCE(s.name, "Unknown / not set") AS service_name,
             COALESCE(s.code, "unknown") AS service_code,
             COUNT(f.id) AS total_count,
             SUM(CASE WHEN f.watched_at IS NOT NULL THEN 1 ELSE 0 END) AS watched_count,
             SUM(CASE WHEN f.watched_at IS NULL THEN 1 ELSE 0 END) AS unwatched_count
         FROM films f
         LEFT JOIN services s ON f.service_id = s.id
         GROUP BY service_id, service_name, service_code
         ORDER BY service_name'
    );

    $rows = $stmt->fetchAll();
    json_response($rows);
} catch (Throwable $e) {
    json_response(
        ['error' => 'Database error', 'details' => $e->getMessage()],
        500
    );
}
