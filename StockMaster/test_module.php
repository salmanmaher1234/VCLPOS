<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::first();
if (!$user) {
    echo "No user found to test with.\n";
    exit;
}

echo "Testing complete employee module endpoints...\n\n";

$request = Illuminate\Http\Request::create('/api/employees-stats', 'GET');
$request->setUserResolver(function() use ($user) { return $user; });
$response = app()->handle($request);
echo "[GET /api/employees-stats] " . $response->getStatusCode() . "\n";

$request = Illuminate\Http\Request::create('/api/employees', 'GET');
$request->setUserResolver(function() use ($user) { return $user; });
$response = app()->handle($request);
echo "[GET /api/employees] " . $response->getStatusCode() . "\n";

$request = Illuminate\Http\Request::create('/api/employee-shifts', 'GET');
$request->setUserResolver(function() use ($user) { return $user; });
$response = app()->handle($request);
echo "[GET /api/employee-shifts] " . $response->getStatusCode() . "\n";

$request = Illuminate\Http\Request::create('/api/employees-daily-attendance', 'GET', ['date' => date('Y-m-d')]);
$request->setUserResolver(function() use ($user) { return $user; });
$response = app()->handle($request);
echo "[GET /api/employees-daily-attendance] " . $response->getStatusCode() . "\n";

$request = Illuminate\Http\Request::create('/api/employee-payrolls', 'GET', ['month' => date('Y-m')]);
$request->setUserResolver(function() use ($user) { return $user; });
$response = app()->handle($request);
echo "[GET /api/employee-payrolls] " . $response->getStatusCode() . "\n";

echo "\nAll endpoints responded successfully!\n";
