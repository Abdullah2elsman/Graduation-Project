<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeleteOldBookInteractions extends Command
{
    protected $signature = 'book-interactions:cleanup';

    protected $description = 'Delete book interactions older than 4 months';

    public function handle()
    {
        $threshold = Carbon::now()->subMonths(4);

        $deleted = DB::table('book_interactions')
            ->where('interacted_at', '<', $threshold)
            ->delete();

        $this->info("Deleted $deleted old book interactions.");
    }
}
