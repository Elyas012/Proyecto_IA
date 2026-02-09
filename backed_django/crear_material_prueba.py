#!/usr/bin/env python
"""
Script para crear material de prueba en el curso 3
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'monitoring.settings')
django.setup()

from api.models import Course, CourseMaterial

def crear_material():
    print("\n" + "="*60)
    print("📹 CREANDO MATERIAL DE PRUEBA EN CURSO 3")
    print("="*60)
    
    try:
        curso = Course.objects.get(id=3)
        
        # Crear material de video con URL
        material = CourseMaterial.objects.create(
            course=curso,
            title="Tutorial de Python - Introducción",
            description="Video de ejemplo de YouTube",
            video_url="https://www.youtube.com/watch?v=rfscVS0vtbw",
            file_type="link",
            is_active=True
        )
        
        print(f"\n✅ Material creado exitosamente:")
        print(f"   ID: {material.id}")
        print(f"   Título: {material.title}")
        print(f"   URL: {material.video_url}")
        print(f"   Curso: {curso.name}")
        
        # Mostrar todos los materiales del curso
        print(f"\n📦 Todos los materiales del curso {curso.name}:")
        materiales = CourseMaterial.objects.filter(course=curso)
        for mat in materiales:
            print(f"   • ID: {mat.id} | {mat.title} | Tipo: {mat.file_type}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "="*60 + "\n")

if __name__ == '__main__':
    crear_material()
