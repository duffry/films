<?php
// api/imdb_lookup.php
//
// Look up basic film details from IMDb via OMDb.
// Returns JSON with: imdb_id, title, year, runtime_minutes, plot.

require 'db.php'; // for json_response(), PDO not actually used here.

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed'], 405);
}

$url = isset($_GET['url']) ? trim($_GET['url']) : '';
$id  = isset($_GET['id'])  ? trim($_GET['id'])  : '';

if ($url === '' && $id === '') {
    json_response(['error' => 'Missing url or id parameter'], 400);
}

// If only a URL is provided, try to extract ttNNNNNNN from it.
if ($id === '' && $url !== '') {
    if (!preg_match('~imdb\.com/title/(tt[0-9]+)~i', $url, $m)) {
        json_response(['error' => 'Could not extract IMDb ID from URL'], 400);
    }
    $id = $m[1];
}

// Basic sanity check on ID
if (!preg_match('~^tt[0-9]+$~i', $id)) {
    json_response(['error' => 'Invalid IMDb ID'], 400);
}

// --- Call OMDb (or similar) ---

// TODO: put your real key somewhere NOT committed to git
// e.g. require 'omdb_key.local.php'; where it defines OMDB_API_KEY.
$apiKey = '80777d17';

$endpoint = 'https://www.omdbapi.com/?i=' . urlencode($id)
          . '&apikey=' . urlencode($apiKey);

$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'FilmsToWatch/1.0 (+your-site)');
$responseBody = curl_exec($ch);

if ($responseBody === false) {
    $err = curl_error($ch);
    curl_close($ch);
    json_response(['error' => 'Lookup request failed', 'details' => $err], 502);
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode < 200 || $httpCode >= 300) {
    json_response(['error' => 'Lookup returned HTTP ' . $httpCode], 502);
}

$data = json_decode($responseBody, true);
if (!is_array($data)) {
    json_response(['error' => 'Could not parse lookup response'], 502);
}

if (($data['Response'] ?? '') !== 'True') {
    json_response(
        ['error' => 'Title not found', 'details' => $data['Error'] ?? null],
        404
    );
}

// Normalise Year into an int where possible
$year = null;
if (!empty($data['Year']) && preg_match('/^\d{4}/', $data['Year'], $mYear)) {
    $year = (int) $mYear[0];
}

// Normalise Runtime ("113 min" -> 113)
$runtimeMinutes = null;
if (!empty($data['Runtime']) && preg_match('/^(\d+)/', $data['Runtime'], $mRun)) {
    $runtimeMinutes = (int) $mRun[1];
}

$result = [
    'imdb_id'         => $data['imdbID'] ?? $id,
    'title'           => $data['Title'] ?? '',
    'year'            => $year,
    'runtime_minutes' => $runtimeMinutes,
    'plot'            => $data['Plot'] ?? '',
];

json_response($result);
