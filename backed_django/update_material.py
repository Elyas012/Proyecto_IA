#!/usr/bin/env python
"""
Script para actualizar el material con ID 6 con una URL de ejemplo
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'monitoring.settings')
django.setup()

from api.models import CourseMaterial

def update_material():
    try:
        material = CourseMaterial.objects.get(id=6)
        # Actualizar con una URL de ejemplo
        material.video_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        material.file_type = 'link'
        material.save()
        
        print(f"✅ Material actualizado:")
        print(f"   ID: {material.id}")
        print(f"   Título: {material.title}")
        print(f"   Video URL: {material.video_url}")
        print(f"   Tipo: {material.file_type}")
        
    except CourseMaterial.DoesNotExist:
        print("❌ Material con ID 6 no encontrado")

if __name__ == '__main__':
    update_material()
