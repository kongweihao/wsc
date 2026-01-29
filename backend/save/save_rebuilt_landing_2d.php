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
    $baseDir = dirname(__DIR__, 2) . '/seacable_data/重构的数据';
    if (!is_dir($baseDir)) {
        if (!mkdir($baseDir, 0775, true) && !is_dir($baseDir)) {
            http_response_code(500);
            echo json_encode([ 'ok' => false, 'error' => 'mkdir failed', 'engine' => 'php' ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    $apItems = [];
    if (isset($decoded['ap']) && is_array($decoded['ap'])) {
        $apItems = $decoded['ap'];
    } elseif (isset($decoded['items']) && is_array($decoded['items'])) {
        $apItems = $decoded['items'];
    } elseif (is_array($decoded)) {
        $apItems = $decoded;
    }
    $standardItems = [];
    if (isset($decoded['standard']) && is_array($decoded['standard'])) {
        $standardItems = $decoded['standard'];
    }
    if (!$standardItems) {
        $standardItems = $apItems;
    }
    $savedAt = (int) round(microtime(true) * 1000);
    $writeFile = function ($filePath, $items) use ($savedAt) {
        $payload = [ 'version' => 1, 'savedAt' => $savedAt, 'items' => array_values($items) ];
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            throw new RuntimeException('encode failed');
        }
        $ok = file_put_contents($filePath, $json);
        if ($ok === false) {
            throw new RuntimeException('write failed');
        }
    };
    $apPath = $baseDir . '/2d亚太中心登陆站数据.json';
    $stdPath = $baseDir . '/2d标准地图登陆站数据.json';
    $writeFile($apPath, $apItems);
    $writeFile($stdPath, $standardItems);
    echo json_encode([ 'ok' => true, 'paths' => [ 'ap' => $apPath, 'standard' => $stdPath ], 'engine' => 'php' ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([ 'ok' => false, 'error' => $e->getMessage(), 'engine' => 'php' ], JSON_UNESCAPED_UNICODE);
}
