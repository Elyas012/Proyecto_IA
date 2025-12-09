from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from api.models import Course, ClassSession, StudentCourse, UserProfile
from datetime import datetime, timedelta
import random


class Command(BaseCommand):
    help = 'Seed the database with test data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database seed...'))

        # Create Courses
        courses_data = [
            {'name': 'Algoritmos y Estructuras de Datos', 'code': 'AED101'},
            {'name': 'Bases de Datos', 'code': 'BDD102'},
            {'name': 'Inteligencia Artificial', 'code': 'IA103'},
            {'name': 'Redes de Computadoras', 'code': 'RED104'},
        ]

        courses = []
        for course_data in courses_data:
            course, created = Course.objects.get_or_create(
                code=course_data['code'],
                defaults={'name': course_data['name'], 'description': f'Curso de {course_data["name"]}'}
            )
            courses.append(course)
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Created course: {course.name}'))

        # Create Teacher user
        teacher_user, created = User.objects.get_or_create(
            username='maria.garcia',
            defaults={
                'email': 'maria.garcia@espe.edu.ec',
                'first_name': 'María',
                'last_name': 'García'
            }
        )
        if created:
            teacher_user.set_password('password123')
            teacher_user.save()
            self.stdout.write(self.style.SUCCESS(f'✓ Created teacher: {teacher_user.username}'))

        # Create teacher profile
        teacher_profile, _ = UserProfile.objects.get_or_create(
            user=teacher_user,
            defaults={'role': 'teacher', 'user_code': 'DOC001'}
        )

        # Create Token for teacher
        Token.objects.get_or_create(user=teacher_user)

        # Create Student users
        students_data = [
            {'username': 'juan.perez', 'email': 'juan.perez@espe.edu.ec', 'first_name': 'Juan', 'last_name': 'Pérez', 'code': 'EST001'},
            {'username': 'maria.lopez', 'email': 'maria.lopez@espe.edu.ec', 'first_name': 'María', 'last_name': 'López', 'code': 'EST002'},
            {'username': 'carlos.ruiz', 'email': 'carlos.ruiz@espe.edu.ec', 'first_name': 'Carlos', 'last_name': 'Ruiz', 'code': 'EST003'},
            {'username': 'ana.martinez', 'email': 'ana.martinez@espe.edu.ec', 'first_name': 'Ana', 'last_name': 'Martínez', 'code': 'EST004'},
            {'username': 'laura.sanchez', 'email': 'laura.sanchez@espe.edu.ec', 'first_name': 'Laura', 'last_name': 'Sánchez', 'code': 'EST005'},
        ]

        students = []
        for student_data in students_data:
            student_user, created = User.objects.get_or_create(
                username=student_data['username'],
                defaults={
                    'email': student_data['email'],
                    'first_name': student_data['first_name'],
                    'last_name': student_data['last_name']
                }
            )
            if created:
                student_user.set_password('password123')
                student_user.save()
                self.stdout.write(self.style.SUCCESS(f'✓ Created student: {student_user.username}'))

            # Create student profile
            student_profile, _ = UserProfile.objects.get_or_create(
                user=student_user,
                defaults={'role': 'student', 'user_code': student_data['code']}
            )

            # Create Token for student
            Token.objects.get_or_create(user=student_user)

            students.append(student_user)

            # Enroll student in all courses
            for course in courses:
                StudentCourse.objects.get_or_create(student=student_user, course=course)

        # Create Class Sessions
        now = datetime.now()
        session_times = ['10:00', '14:00', '16:00']
        
        for i, course in enumerate(courses):
            for day_offset in range(5):
                session_date = (now + timedelta(days=day_offset)).date()
                time_str = session_times[day_offset % len(session_times)]
                time_obj = datetime.strptime(time_str, '%H:%M').time()

                session, created = ClassSession.objects.get_or_create(
                    course=course,
                    teacher=teacher_user,
                    date=session_date,
                    time=time_obj,
                    defaults={
                        'title': f'{course.name} - Session {day_offset + 1}',
                        'duration_minutes': 60,
                        'status': 'active' if day_offset == 0 else ('upcoming' if day_offset > 0 else 'completed')
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f'✓ Created session: {course.code} on {session_date}'))

        self.stdout.write(self.style.SUCCESS('✓ Database seed completed successfully!'))
        self.stdout.write(self.style.WARNING('\nTest credentials:'))
        self.stdout.write('Teacher: maria.garcia / password123')
        self.stdout.write('Student: juan.perez / password123')
