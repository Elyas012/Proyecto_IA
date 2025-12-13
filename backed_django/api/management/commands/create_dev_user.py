from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = 'Create a development test user and print an API token (idempotent).'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, default='dev', help='Username for dev user')
        parser.add_argument('--email', type=str, default='dev@example.com', help='Email for dev user')
        parser.add_argument('--password', type=str, default='devpass', help='Password for dev user')

    def handle(self, *args, **options):
        User = get_user_model()
        username = options['username']
        email = options['email']
        password = options['password']

        user, created = User.objects.get_or_create(username=username, defaults={'email': email})
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created user {username}'))
        else:
            self.stdout.write(self.style.WARNING(f'User {username} already exists'))

        token, _ = Token.objects.get_or_create(user=user)
        self.stdout.write(self.style.SUCCESS(f'API token for {username}: {token.key}'))
        self.stdout.write('Use this token by setting header: Authorization: Token <token>')