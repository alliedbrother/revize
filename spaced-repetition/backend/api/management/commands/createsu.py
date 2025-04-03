from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates a superuser on deployment'

    def handle(self, *args, **options):
        if not User.objects.filter(username='admin').exists():
            # Get username and password from environment variables or use defaults
            username = os.environ.get('DJANGO_SU_NAME', 'admin')
            email = os.environ.get('DJANGO_SU_EMAIL', 'admin@example.com')
            password = os.environ.get('DJANGO_SU_PASSWORD', 'admin@123')
            
            self.stdout.write(self.style.SUCCESS(f'Creating superuser {username}'))
            
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            
            self.stdout.write(self.style.SUCCESS('Superuser created successfully'))
        else:
            self.stdout.write(self.style.SUCCESS('Superuser already exists')) 