<?php

declare(strict_types=1);

header('Content-Type: application/json');

$secret = 'nuers-db-20260603';

if (($_GET['key'] ?? '') !== $secret) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'message' => 'Not found']);
    exit;
}

$root = dirname(__DIR__);
$envPath = $root.'/.env';

function read_env_file(string $path): array
{
    if (! is_file($path)) {
        return [];
    }

    $values = [];

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);

        if ($line === '' || str_starts_with($line, '#') || ! str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $value = trim($value);
        $values[trim($key)] = trim($value, "\"'");
    }

    return $values;
}

function sqlite_path_hint(string $path): string
{
    if ($path === '') {
        return 'default';
    }

    if (str_contains($path, '/Applications/XAMPP/')) {
        return 'local_mac_path';
    }

    if (str_starts_with($path, '/')) {
        return 'absolute_server_path';
    }

    return 'relative_path';
}

$env = read_env_file($envPath);
$connection = $env['DB_CONNECTION'] ?? 'sqlite';
$result = [
    'ok' => false,
    'php_version' => PHP_VERSION,
    'env_file_exists' => is_file($envPath),
    'config_cache_exists' => is_file($root.'/bootstrap/cache/config.php'),
    'db_connection' => $connection,
];

try {
    if ($connection === 'sqlite') {
        $configuredPath = $env['DB_DATABASE'] ?? '';
        $databasePath = $configuredPath !== ''
            ? $configuredPath
            : $root.'/database/database.sqlite';

        $result['sqlite'] = [
            'db_database_hint' => sqlite_path_hint($configuredPath),
            'using_default_database_path' => $configuredPath === '',
            'file_exists' => is_file($databasePath),
            'file_readable' => is_readable($databasePath),
            'file_writable' => is_writable($databasePath),
            'file_size_bytes' => is_file($databasePath) ? filesize($databasePath) : null,
        ];

        $pdo = new PDO('sqlite:'.$databasePath);
    } elseif ($connection === 'mysql' || $connection === 'mariadb') {
        $host = $env['DB_HOST'] ?? '127.0.0.1';
        $port = $env['DB_PORT'] ?? '3306';
        $database = $env['DB_DATABASE'] ?? '';
        $username = $env['DB_USERNAME'] ?? '';
        $password = $env['DB_PASSWORD'] ?? '';
        $charset = $env['DB_CHARSET'] ?? 'utf8mb4';

        $result['mysql'] = [
            'host' => $host,
            'port' => $port,
            'database_set' => $database !== '',
            'username_set' => $username !== '',
        ];

        $pdo = new PDO(
            "mysql:host={$host};port={$port};dbname={$database};charset={$charset}",
            $username,
            $password,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
        );
    } else {
        throw new RuntimeException("Unsupported DB_CONNECTION {$connection}");
    }

    foreach (['users', 'profiles'] as $table) {
        $result['tables'][$table] = (int) $pdo->query("SELECT COUNT(*) FROM {$table}")->fetchColumn();
    }

    $result['ok'] = true;
} catch (Throwable $error) {
    $result['error'] = [
        'class' => get_class($error),
        'message' => $error->getMessage(),
    ];
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
