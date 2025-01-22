<?php

namespace App\Providers;

use Google\Client;
use Google\Service\Sheets;

class GoogleSheetsService
{
  protected $client;
  protected $service;

  public function __construct()
  {
    // Initialize the Google Client
    $this->client = new Client();
    $this->client->setAuthConfig(storage_path(config('services.google.credentials_path')));
    $this->client->addScope(Sheets::SPREADSHEETS);

    // Initialize the Google Sheets Service
    $this->service = new Sheets($this->client);
  }

  public function readSheet($range)
  {
    $spreadsheetId = config('services.google.spreadsheet_id');
    $response = $this->service->spreadsheets_values->get($spreadsheetId, $range);
    return $response->getValues();
  }

  public function writeSheet($range, $values)
  {
    $spreadsheetId = config('services.google.spreadsheet_id');
    $body = new Sheets\ValueRange(['values' => $values]);

    $params = ['valueInputOption' => 'RAW'];
    $this->service->spreadsheets_values->update($spreadsheetId, $range, $body, $params);

    return true;
  }
}
