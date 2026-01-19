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
            return [ $path, trim(implode("\n", $verOut)) ];
        }
    }
    return [ null, null ];
}

try {
    list($py, $ver) = pick_python3();
    if ($py) {
        echo json_encode([ 'ok' => true, 'engine' => 'py3', 'version' => $ver ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(404);
        echo json_encode([ 'ok' => false, 'error' => 'python3 not available' ], JSON_UNESCAPED_UNICODE);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([ 'ok' => false, 'error' => $e->getMessage() ], JSON_UNESCAPED_UNICODE);
}
