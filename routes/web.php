<?php

use Illuminate\Support\Facades\Route;

Route::get('/clear-cache', function () {
    Artisan::call('optimize:clear');
    return 'Cache cleared';
});

Route::view('/{path?}', 'app')->where('path', '^(?!api).*$');


