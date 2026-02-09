#!/usr/bin/env python
"""
Script para verificar los materiales del curso en la base de datos
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'monitoring.settings')
django.setup()

from api.models import CourseMaterial, Course
from api.serializers import CourseMaterialSerializer

def test_materials():
    print("\n" + "="*60)
    print("VERIFICANDO MATERIALES EN LA BASE DE DATOS")
    print("="*60)
    
    # Obtener todos los cursos
    courses = Course.objects.all()
    print(f"\n📚 Total de cursos: {courses.count()}")
    
    for course in courses:
        print(f"\n  → Curso: {course.name} (ID: {course.id})")
        materials = CourseMaterial.objects.filter(course=course)
        print(f"    Materiales: {materials.count()}")
        
        for material in materials:
            print(f"\n    📄 Material ID: {material.id}")
            print(f"       Título: {material.title}")
            print(f"       Tipo: {material.file_type}")
            print(f"       Activo: {material.is_active}")
            print(f"       Archivo: {material.file.name if material.file else 'N/A'}")
            print(f"       Video URL: {material.video_url or 'N/A'}")
            
            # Serializar para ver qué devuelve la API
            serializer = CourseMaterialSerializer(material)
            print(f"       Serializado:")
            for key, value in serializer.data.items():
                print(f"         - {key}: {value}")
    
    print("\n" + "="*60)
    print("FIN DE LA VERIFICACIÓN")
    print("="*60 + "\n")

if __name__ == '__main__':
    test_materials()
