#!/usr/bin/env python
"""
Script para verificar docentes
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'monitoring.settings')
django.setup()

from api.models import ClassSession
from django.contrib.auth.models import User

def verificar_docentes():
    print("\n" + "="*60)
    print("👨‍🏫 DOCENTES Y SUS CURSOS")
    print("="*60)
    
    # Buscar usuarios con rol teacher
    teachers = User.objects.filter(profile__role='teacher')
    
    if not teachers:
        print("\n❌ No hay docentes en el sistema")
        print("\n💡 Creando un docente de prueba...")
        
        # Crear docente
        from api.models import UserProfile
        teacher = User.objects.create_user(
            username='teacher_test',
            email='teacher@test.com',
            password='teacher123',
            first_name='Profesor',
            last_name='Test'
        )
        UserProfile.objects.create(
            user=teacher,
            role='teacher',
            user_id='TEACH001'
        )
        
        # Crear una clase para ese docente
        from api.models import Course
        course = Course.objects.get(id=2)  # Desarrollo Web Avanzado
        
        ClassSession.objects.create(
            course=course,
            teacher=teacher,
            title='Clase de prueba',
            date='2026-02-09',
            time='10:00:00',
            duration_minutes=60,
            status='scheduled'
        )
        
        print(f"✅ Docente creado: teacher_test / teacher123")
        print(f"✅ Asignado al curso: {course.name}")
        
    else:
        for teacher in teachers:
            print(f"\n👨‍🏫 {teacher.first_name} {teacher.last_name} ({teacher.username})")
            classes = ClassSession.objects.filter(teacher=teacher)
            if classes:
                courses = set([c.course.name for c in classes])
                print(f"   Enseña: {', '.join(courses)}")
            else:
                print("   No tiene clases asignadas")
    
    print("\n" + "="*60 + "\n")

if __name__ == '__main__':
    verificar_docentes()
