<?php

namespace App\Http\Controllers;

use App\Providers\GoogleSheetsService;
use Illuminate\Http\Request;

class GoogleSheetsController extends Controller
{
    protected $googleSheetsService;

    public function __construct(GoogleSheetsService $googleSheetsService)
    {
        $this->googleSheetsService = $googleSheetsService;
    }

    public function readSheet()
    {
        $range = 'Sheet1!A1:B10';
        try {
            $data = $this->googleSheetsService->readSheet($range);
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function writeSheet(Request $request)
    {
        $range = 'Sheet2!A1'; // Write Location
        $values = $request->input('values'); // Data Come From Request

        try {
            $this->googleSheetsService->writeSheet($range, $values);
            return response()->json(['message' => 'Data written successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
