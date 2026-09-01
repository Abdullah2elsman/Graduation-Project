<?php

namespace App\Notifications;

use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InstructorInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $token,
        private readonly CarbonInterface $expiresAt,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Set up your Smart Book Instructor account')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('An administrator created a Smart Book Instructor account for you.')
            ->action('Set your password', $this->invitationUrl())
            ->line('This invitation expires on '.$this->expiresAt->toDayDateTimeString().'.')
            ->line('After setting your password, return to Smart Book and log in normally.');
    }

    public function invitationUrl(): string
    {
        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');

        return $frontendUrl.'/auth/instructor-invitations/'.$this->token;
    }
}
