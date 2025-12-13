from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from api.models import Course, ClassSession, StudentCourse


class Command(BaseCommand):
    help = 'Create a demo course, a class session (active) and enroll a student (dev)'

    def add_arguments(self, parser):
        parser.add_argument('--code', type=str, default='CS101', help='Course code')
        parser.add_argument('--name', type=str, default='Introducción a AI', help='Course name')
        parser.add_argument('--teacher', type=str, default='dev', help='Teacher username')
        parser.add_argument('--student', type=str, default='dev', help='Student username to enroll')
        parser.add_argument('--duration', type=int, default=60, help='Duration minutes')
        parser.add_argument('--create-users', dest='create_users', action='store_true', help='Create teacher and student users if they do not exist')
        parser.set_defaults(create_users=False)

    def handle(self, *args, **options):
        User = get_user_model()
        code = options['code']
        name = options['name']
        teacher_username = options['teacher']
        student_username = options['student']
        duration = options['duration']

        # By default do not create users; require existing accounts. Use --create-users to force creation.
        create_users = options.get('create_users', False)
        if create_users:
            teacher, _ = User.objects.get_or_create(username=teacher_username, defaults={'email': f'{teacher_username}@example.com'})
            student, _ = User.objects.get_or_create(username=student_username, defaults={'email': f'{student_username}@example.com'})
        else:
            teacher = User.objects.filter(username=teacher_username).first()
            student = User.objects.filter(username=student_username).first()
            if not teacher:
                self.stdout.write(self.style.WARNING(f'Teacher user "{teacher_username}" not found; not creating. Use --create-users to create users.'))
            if not student:
                self.stdout.write(self.style.WARNING(f'Student user "{student_username}" not found; not creating. Use --create-users to create users.'))

        course, created = Course.objects.get_or_create(code=code, defaults={'name': name, 'description': 'Demo course created for local testing'})
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created course {course.code}'))
        else:
            self.stdout.write(self.style.WARNING(f'Course {course.code} already exists'))

        today = timezone.localdate()
        now = timezone.localtime().time()
        session, screated = ClassSession.objects.get_or_create(course=course, teacher=teacher, date=today, time=now, defaults={'title': f'{course.code} - Sesión Demo', 'duration_minutes': duration, 'status': 'active'})
        if screated:
            self.stdout.write(self.style.SUCCESS(f'Created class session {session.id} for course {course.code}'))
        else:
            session.status = 'active'
            session.save()
            self.stdout.write(self.style.WARNING(f'Using existing session {session.id} (set to active)'))

        enrollment, ecreated = StudentCourse.objects.get_or_create(student=student, course=course)
        if ecreated:
            self.stdout.write(self.style.SUCCESS(f'Enrolled {student.username} in {course.code}'))
        else:
            self.stdout.write(self.style.WARNING(f'{student.username} already enrolled in {course.code}'))

        self.stdout.write(self.style.SUCCESS('Demo course setup complete'))