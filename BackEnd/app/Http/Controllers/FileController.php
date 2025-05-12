<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FileController extends Controller
{
    function upload(Request $request)
    {
        $fileExtension = $request-> image -> getClientOriginalName();

        $year = date('Y'); // Current year
        $month = date('m'); // Current month
        $day = date('d'); // Current day

        $fileName = $year . '_' . $month .'_' . $day . "_" . $fileExtension;

        // Store the file in the public/uploads folder
        $path = 'images/offers';

        $request -> image -> move($path, $fileName);

        // Store only the file name in the session
        return back()->with("success", "File Uploaded Successfully")->with("image", $fileName);
    }
}
