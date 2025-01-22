<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link rel="stylesheet" href="{{ url('css/app.css') }}">
    <link rel="stylesheet" href="{{ url('css/bootstrap.min.css') }}">

    <title>Document</title>
</head>

<body>
    <div class="container">

        @if (session('image'))
            <div class="alert alert-primary" role="alert">
                {{ session()->get('success') }}
            </div>
        @endif

        <form action="{{ route('photo.upload') }}" method="POST" enctype="multipart/form-data">
            @csrf
            <div class="mb-3">
                <label for="formFile" class="form-label"> file input </label>
                <input class="form-control" type="file" name="image" id="formFile">
            </div>

            <button type="submit" class="btn btn-primary">upload</button>

        </form>
    </div>
    <script src="js/app.js"></script>
</body>

</html>
