<?php
header('Content-Type: application/json; charset=utf-8');

function pick_python3() {
    $candidates = [
        __DIR__ . '/../.venv/bin/python3',
        '/usr/bin/python3',
        'python3'
    ];
    foreach ($candidates as $cmd) {
        if (!$cmd) continue;
        $path = null;
        if (is_file($cmd) && is_executable($cmd)) {
            $path = $cmd;
        } else {
            $out = [];
            $ret = 0;
            exec('command -v ' . $cmd . ' 2>/dev/null', $out, $ret);
            if ($ret === 0 && !empty($out)) $path = trim($out[0]);
        }
        if (!$path) continue;
        $verOut = [];
        $verRet = 0;
        exec(escapeshellarg($path) . ' --version 2>&1', $verOut, $verRet);
        if ($verRet === 0 && !empty($verOut) && strpos($verOut[0], 'Python 3') === 0) {
            return $path;
        }
    }
    return null;
}

try {
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) === 0) {
        http_response_code(400);
        echo json_encode([ 'ok' => false, 'error' => 'empty body', 'engine' => 'py3' ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $py = pick_python3();
    if (!$py) {
        http_response_code(500);
        echo json_encode([ 'ok' => false, 'error' => 'python3 not available', 'engine' => 'py3' ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $desc = [ 0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w'] ];
    $cmd = escapeshellarg($py) . ' ' . escapeshellarg(__DIR__ . '/save_rebuilt_3d.py');
    $proc = proc_open($cmd, $desc, $pipes, __DIR__);
    if (!is_resource($proc)) {
        http_response_code(500);
        echo json_encode([ 'ok' => false, 'error' => 'proc_open failed', 'engine' => 'py3' ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    fwrite($pipes[0], $raw);
    fclose($pipes[0]);
    $out = stream_get_contents($pipes[1]);
    $err = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = proc_close($proc);
    if ($code === 0 && $out) {
        $json = json_decode($out, true);
        if (is_array($json) && isset($json['ok'])) {
            $json['engine'] = 'py3';
            echo json_encode($json, JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    http_response_code(500);
    echo json_encode([ 'ok' => false, 'error' => $err ?: 'python3 failed', 'engine' => 'py3' ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([ 'ok' => false, 'error' => $e->getMessage(), 'engine' => 'py3' ], JSON_UNESCAPED_UNICODE);
}
