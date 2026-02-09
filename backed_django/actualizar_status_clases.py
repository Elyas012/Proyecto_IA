#!/usr/bin/env python
"""
Script para verificar y actualizar el status de las clases
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'monitoring.settings')
django.setup()

from api.models import ClassSession, Course

def verificar_clases():
    print("\n" + "="*60)
    print("📅 VERIFICANDO CLASES Y SUS STATUS")
    print("="*60)
    
    cursos = Course.objects.all()
    
    for curso in cursos:
        print(f"\n📚 Curso: {curso.name} (ID: {curso.id})")
        clases = ClassSession.objects.filter(course=curso)
        
        if clases.exists():
            for clase in clases:
                print(f"   • Clase ID: {clase.id}")
                print(f"     Título: {clase.title}")
                print(f"     Status: {clase.status}")
                print(f"     Fecha: {clase.date}")
                print(f"     Docente: {clase.teacher.username}")
                
                # Si el status es 'scheduled', cambiarlo a 'upcoming'
                if clase.status == 'scheduled':
                    clase.status = 'upcoming'
                    clase.save()
                    print(f"     ✅ Status actualizado a: upcoming")
        else:
            print(f"   ⚠️ No hay clases para este curso")
    
    print("\n" + "="*60 + "\n")

if __name__ == '__main__':
    verificar_clases()
