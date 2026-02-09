#!/usr/bin/env python
"""
Script para verificar y crear cursos faltantes
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'monitoring.settings')
django.setup()

from api.models import Course, ClassSession, CourseMaterial
from django.contrib.auth.models import User

def verificar_cursos():
    print("\n" + "="*60)
    print("📚 VERIFICANDO CURSOS")
    print("="*60)
    
    # Ver todos los cursos
    cursos = Course.objects.all()
    print(f"\n🎓 Cursos existentes:")
    for curso in cursos:
        print(f"   ID: {curso.id} | {curso.name} ({curso.code})")
        materiales = CourseMaterial.objects.filter(course=curso).count()
        print(f"      └─ Materiales: {materiales}")
    
    # Verificar si existe el curso 3
    try:
        curso3 = Course.objects.get(id=3)
        print(f"\n✅ Curso ID 3 existe: {curso3.name}")
    except Course.DoesNotExist:
        print(f"\n❌ Curso ID 3 NO existe")
        print(f"\n💡 ¿Quieres que cree un curso ID 3?")
        print(f"   Creando curso de prueba...")
        
        curso3 = Course.objects.create(
            name="Curso de Prueba",
            code="TEST001",
            description="Curso de prueba para materiales"
        )
        print(f"   ✅ Curso creado: ID {curso3.id} - {curso3.name}")
        
        # Asignar al docente madoc
        try:
            docente = User.objects.get(username='madoc')
            ClassSession.objects.create(
                course=curso3,
                teacher=docente,
                title='Clase de prueba',
                date='2026-02-10',
                time='10:00:00',
                duration_minutes=60,
                status='scheduled'
            )
            print(f"   ✅ Clase asignada al docente madoc")
        except Exception as e:
            print(f"   ⚠️ Error asignando clase: {e}")
    
    print("\n" + "="*60 + "\n")

if __name__ == '__main__':
    verificar_cursos()
