<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>StockMaster React</title>
    <link rel="icon" type="image/png" href="<?php echo e(asset('images/logo.png')); ?>">
    <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php echo app('Illuminate\Foundation\Vite')(['resources/css/app.css', 'resources/js/react/main.jsx']); ?>
</head>

<body class="antialiased">
    <div id="react-app"></div>
</body>

</html><?php /**PATH C:\Users\Talha\Desktop\git_repo\VCLPOS\StockMaster\resources\views/react.blade.php ENDPATH**/ ?>