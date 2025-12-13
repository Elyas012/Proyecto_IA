from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Delete a user by username (use with caution).'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to delete')
        parser.add_argument('--yes', action='store_true', help='Confirm deletion without prompt')

    def handle(self, *args, **options):
        User = get_user_model()
        username = options['username']
        confirm = options.get('yes', False)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING(f'User "{username}" not found.'))
            return

        if not confirm:
            answer = input(f'Are you sure you want to delete user "{username}"? [y/N]: ')
            if answer.lower() != 'y':
                self.stdout.write(self.style.WARNING('Aborted.'))
                return

        user.delete()
        self.stdout.write(self.style.SUCCESS(f'User "{username}" deleted.'))