#!/usr/bin/env python
"""
Script de diagnóstico completo del sistema de materiales
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'monitoring.settings')
django.setup()

from api.models import CourseMaterial, Course, StudentCourse, ClassSession
from api.serializers import CourseMaterialSerializer
from django.contrib.auth.models import User
import json

def diagnostico():
    print("\n" + "="*80)
    print("🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA DE MATERIALES")
    print("="*80)
    
    # 1. Verificar cursos
    print("\n📚 CURSOS EN LA BASE DE DATOS:")
    courses = Course.objects.all()
    for course in courses:
        print(f"  • ID: {course.id} | Nombre: {course.name} | Código: {course.code}")
    
    # 2. Verificar materiales
    print("\n📄 MATERIALES EN LA BASE DE DATOS:")
    materials = CourseMaterial.objects.all().order_by('-uploaded_at')
    for material in materials:
        print(f"\n  Material ID: {material.id}")
        print(f"    Curso: {material.course.name} (ID: {material.course.id})")
        print(f"    Título: {material.title}")
        print(f"    Tipo: {material.file_type}")
        print(f"    Activo: {material.is_active}")
        print(f"    Archivo: {material.file.name if material.file else 'N/A'}")
        print(f"    Video URL: {material.video_url or 'N/A'}")
        
        # Serializar
        serializer = CourseMaterialSerializer(material)
        print(f"    📡 API devuelve:")
        print(f"       {json.dumps(serializer.data, indent=10, ensure_ascii=False)}")
    
    # 3. Verificar usuarios y permisos
    print("\n👥 USUARIOS Y RELACIONES:")
    users = User.objects.all()[:5]
    for user in users:
        profile = getattr(user, 'profile', None)
        role = profile.role if profile else 'sin perfil'
        print(f"  • {user.username} ({user.email}) - Rol: {role}")
        
        # Ver cursos del estudiante
        if profile and profile.role == 'student':
            enrolled = StudentCourse.objects.filter(student=user)
            if enrolled:
                print(f"    Inscrito en: {', '.join([str(sc.course.name) for sc in enrolled])}")
        
        # Ver cursos del docente
        if profile and profile.role == 'teacher':
            classes = ClassSession.objects.filter(teacher=user).values_list('course__name', flat=True).distinct()
            if classes:
                print(f"    Enseña: {', '.join(classes)}")
    
    print("\n" + "="*80)
    print("✅ DIAGNÓSTICO COMPLETO")
    print("="*80 + "\n")
    
    # Recomendaciones
    print("📋 RECOMENDACIONES:")
    print("  1. Verifica que el servidor Django esté corriendo (python manage.py runserver)")
    print("  2. Verifica que el servidor Next.js esté corriendo (npm run dev)")
    print("  3. Recarga la página del navegador con Ctrl+F5")
    print("  4. Abre la consola del navegador (F12) y busca los logs que empiezan con 📦 o 👁️")
    print("  5. Si no aparecen materiales, verifica que el usuario esté inscrito en el curso correcto")
    print("")

if __name__ == '__main__':
    diagnostico()
