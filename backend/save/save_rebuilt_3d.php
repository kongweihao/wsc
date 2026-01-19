<?php
header('Content-Type: application/json; charset=utf-8');
try {
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) === 0) {
        http_response_code(400);
        echo json_encode([ 'ok' => false, 'error' => 'empty body', 'engine' => 'php' ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $decoded = json_decode($raw, true);
    if ($decoded === null) {
        http_response_code(400);
        echo json_encode([ 'ok' => false, 'error' => 'invalid json', 'engine' => 'php' ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $baseDir = dirname(__DIR__, 2) . '/海缆数据/重构的数据';
    if (!is_dir($baseDir)) {
        if (!mkdir($baseDir, 0775, true) && !is_dir($baseDir)) {
            http_response_code(500);
            echo json_encode([ 'ok' => false, 'error' => 'mkdir failed', 'engine' => 'php' ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    $items = [];
    if (isset($decoded['items']) && is_array($decoded['items'])) {
        $items = $decoded['items'];
    } elseif (is_array($decoded)) {
        $items = $decoded;
    }
    $savedAt = (int) round(microtime(true) * 1000);
    $payload = [ 'version' => 1, 'savedAt' => $savedAt, 'items' => array_values($items) ];
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        throw new RuntimeException('encode failed');
    }
    $path = $baseDir . '/3d海缆数据.json';
    $ok = file_put_contents($path, $json);
    if ($ok === false) {
        throw new RuntimeException('write failed');
    }
    echo json_encode([ 'ok' => true, 'path' => $path, 'engine' => 'php' ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([ 'ok' => false, 'error' => $e->getMessage(), 'engine' => 'php' ], JSON_UNESCAPED_UNICODE);
}
