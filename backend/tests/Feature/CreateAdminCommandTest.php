<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_is_registered(): void
    {
        $this->assertTrue(
            array_key_exists('app:create-admin', Artisan::all()),
        );

        $this->assertCommandSignatureHasNoPasswordArgumentOrOption();
    }

    public function test_valid_input_creates_exactly_one_admin(): void
    {
        $this->artisan('app:create-admin')
            ->expectsQuestion('Name', 'Root Admin')
            ->expectsQuestion('Email', '  Root@Example.COM ')
            ->expectsQuestion('Password', 'secretPass1')
            ->expectsQuestion('Confirm password', 'secretPass1')
            ->expectsOutputToContain('root@example.com')
            ->assertSuccessful();

        $this->assertDatabaseCount('users', 1);

        $user = User::firstOrFail();

        $this->assertSame('ADMIN', $user->role);
        $this->assertSame('ACTIVE', $user->status);
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame('root@example.com', $user->email);
        $this->assertTrue(Hash::check('secretPass1', $user->password));
        $this->assertArchivedProvenanceIsNull($user);
    }

    public function test_confirmation_mismatch_fails_and_creates_nothing(): void
    {
        $this->artisan('app:create-admin')
            ->expectsQuestion('Name', 'Root Admin')
            ->expectsQuestion('Email', 'root@example.com')
            ->expectsQuestion('Password', 'secretPass1')
            ->expectsQuestion('Confirm password', 'secretPass2')
            ->assertFailed();

        $this->assertDatabaseCount('users', 0);
    }

    public function test_short_password_fails_and_creates_nothing(): void
    {
        $this->artisan('app:create-admin')
            ->expectsQuestion('Name', 'Root Admin')
            ->expectsQuestion('Email', 'root@example.com')
            ->expectsQuestion('Password', 'abc123')
            ->expectsQuestion('Confirm password', 'abc123')
            ->assertFailed();

        $this->assertDatabaseCount('users', 0);
    }

    public function test_password_without_letter_fails_and_creates_nothing(): void
    {
        $this->artisan('app:create-admin')
            ->expectsQuestion('Name', 'Root Admin')
            ->expectsQuestion('Email', 'root@example.com')
            ->expectsQuestion('Password', '123456789')
            ->expectsQuestion('Confirm password', '123456789')
            ->assertFailed();

        $this->assertDatabaseCount('users', 0);
    }

    public function test_password_without_number_fails_and_creates_nothing(): void
    {
        $this->artisan('app:create-admin')
            ->expectsQuestion('Name', 'Root Admin')
            ->expectsQuestion('Email', 'root@example.com')
            ->expectsQuestion('Password', 'abcdefghi')
            ->expectsQuestion('Confirm password', 'abcdefghi')
            ->assertFailed();

        $this->assertDatabaseCount('users', 0);
    }

    public function test_invalid_email_fails_and_creates_nothing(): void
    {
        $this->artisan('app:create-admin')
            ->expectsQuestion('Name', 'Root Admin')
            ->expectsQuestion('Email', 'not-an-email')
            ->expectsQuestion('Password', 'secretPass1')
            ->expectsQuestion('Confirm password', 'secretPass1')
            ->assertFailed();

        $this->assertDatabaseCount('users', 0);
    }

    public function test_existing_email_fails_safely_and_leaves_user_unchanged(): void
    {
        $existing = $this->createExistingUser('admin@example.com', 'ACTIVE', now());

        $this->artisan('app:create-admin')
            ->expectsQuestion('Name', 'Root Admin')
            ->expectsQuestion('Email', 'admin@example.com')
            ->expectsQuestion('Password', 'secretPass1')
            ->expectsQuestion('Confirm password', 'secretPass1')
            ->assertFailed();

        $this->assertDatabaseCount('users', 1);
        $this->assertUnchangedRow($existing);
    }

    public function test_normalized_variant_of_existing_email_fails_safely(): void
    {
        $this->createExistingUser('Admin@Example.COM', 'ACTIVE', now());

        $this->artisan('app:create-admin')
            ->expectsQuestion('Name', 'Root Admin')
            ->expectsQuestion('Email', '  admin@example.com ')
            ->expectsQuestion('Password', 'secretPass1')
            ->expectsQuestion('Confirm password', 'secretPass1')
            ->assertFailed();

        $this->assertDatabaseCount('users', 1);
    }

    public function test_rejected_existing_email_remains_reserved_and_uncreated(): void
    {
        $this->createExistingUser('rejected@example.com', 'REJECTED', null);

        $this->artisan('app:create-admin')
            ->expectsQuestion('Name', 'Root Admin')
            ->expectsQuestion('Email', 'rejected@example.com')
            ->expectsQuestion('Password', 'secretPass1')
            ->expectsQuestion('Confirm password', 'secretPass1')
            ->assertFailed();

        $this->assertDatabaseCount('users', 1);
        $this->assertSame('REJECTED', User::firstOrFail()->status);
    }

    public function test_output_never_contains_plaintext_password(): void
    {
        $password = 'hunter2Secret999';

        $this->artisan('app:create-admin')
            ->expectsQuestion('Name', 'Root Admin')
            ->expectsQuestion('Email', 'root@example.com')
            ->expectsQuestion('Password', $password)
            ->expectsQuestion('Confirm password', $password)
            ->doesntExpectOutputToContain($password)
            ->assertSuccessful();

        $this->assertDatabaseCount('users', 1);
    }

    private function createExistingUser(string $email, string $status, mixed $verifiedAt): User
    {
        return User::factory()->create([
            'role' => 'STUDENT',
            'status' => $status,
            'email' => $email,
            'email_verified_at' => $verifiedAt,
        ]);
    }

    private function assertArchivedProvenanceIsNull(User $user): void
    {
        $this->assertNull($user->approved_at);
        $this->assertNull($user->approved_by_user_id);
        $this->assertNull($user->status_changed_at);
        $this->assertNull($user->status_changed_by_user_id);
        $this->assertNull($user->status_reason);
        $this->assertNull($user->created_by_user_id);
    }

    private function assertUnchangedRow(User $existing): void
    {
        $fresh = User::firstOrFail();
        $this->assertSame($existing->getKey(), $fresh->getKey());
        $this->assertSame($existing->status, $fresh->status);
        $this->assertSame($existing->role, $fresh->role);
        $this->assertSame($existing->password, $fresh->getRawOriginal('password'));
    }

    private function assertCommandSignatureHasNoPasswordArgumentOrOption(): void
    {
        $command = Artisan::all()['app:create-admin'];
        $definition = $command->getDefinition();

        $arguments = array_keys($definition->getArguments());
        $options = array_keys($definition->getOptions());

        foreach (array_merge($arguments, $options) as $name) {
            $this->assertStringNotContainsStringIgnoringCase('password', $name);
            $this->assertStringNotContainsStringIgnoringCase('pass', $name);
        }
    }
}
