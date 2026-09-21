<?php

function cors_emit_headers() {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? trim((string)$_SERVER['HTTP_ORIGIN']) : '';
    if ($origin === '' || $origin === 'null' || $origin === 'file://') {
        $origin = '*';
    }
    header('Access-Control-Allow-Origin: ' . $origin, true);
    header('Access-Control-Allow-Credentials: true', true);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD', true);
    header('Access-Control-Allow-Headers: Accept, X-PINGARUNER, CONTENT-TYPE, X-Requested-With, Token, Authorization, Cache-Control, Pragma, Origin, X-Forwarded-For, X-Real-IP, X-HTTP-Method-Override, Range', true);
    header('Access-Control-Expose-Headers: Content-Disposition, Content-Length, X-Request-Id', true);
    header('Access-Control-Max-Age: 86400', true);
}

if (isset($_SERVER['REQUEST_METHOD']) && strtoupper($_SERVER['REQUEST_METHOD']) === 'OPTIONS') {
    cors_emit_headers();
    if (function_exists('http_response_code')) {
        http_response_code(204);
    } else {
        header('HTTP/1.1 204 No Content', true, 204);
    }
    header('Content-Length: 0', true);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$file = __DIR__ . $path;

if ($path && $path !== '/' && is_file($file)) {
    return false;
}

require __DIR__ . '/index.php';

