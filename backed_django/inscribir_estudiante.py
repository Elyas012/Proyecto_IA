#!/usr/bin/env python
"""
Script para inscribir a matonato en el curso 3
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'monitoring.settings')
django.setup()

from api.models import Course, StudentCourse
from django.contrib.auth.models import User

def inscribir_estudiante():
    print("\n" + "="*60)
    print("📝 INSCRIBIENDO ESTUDIANTE EN CURSO 3")
    print("="*60)
    
    try:
        estudiante = User.objects.get(username='matonato')
        curso = Course.objects.get(id=3)
        
        # Verificar si ya está inscrito
        ya_inscrito = StudentCourse.objects.filter(
            student=estudiante, 
            course=curso
        ).exists()
        
        if ya_inscrito:
            print(f"\n✅ {estudiante.username} ya está inscrito en {curso.name}")
        else:
            StudentCourse.objects.create(
                student=estudiante,
                course=curso
            )
            print(f"\n✅ {estudiante.username} inscrito exitosamente en {curso.name}")
        
        # Mostrar todos los cursos del estudiante
        print(f"\n📚 Cursos de {estudiante.username}:")
        inscripciones = StudentCourse.objects.filter(student=estudiante)
        for insc in inscripciones:
            print(f"   • ID: {insc.course.id} | {insc.course.name}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "="*60 + "\n")

if __name__ == '__main__':
    inscribir_estudiante()
