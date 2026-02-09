#!/usr/bin/env python
"""
Script para verificar qué cursos devuelve la API para matonato
"""
import os
import sys
import django
import requests

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'monitoring.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from api.models import StudentCourse
import json

def verificar_cursos_api():
    print("\n" + "="*60)
    print("🔍 VERIFICANDO CURSOS DEL ESTUDIANTE")
    print("="*60)
    
    try:
        # Obtener el estudiante y su token
        estudiante = User.objects.get(username='matonato')
        token = Token.objects.get(user=estudiante)
        
        print(f"\n👤 Usuario: {estudiante.username}")
        print(f"🔑 Token: {token.key}")
        
        # Verificar inscripciones en la BD
        print(f"\n📚 Cursos en la BD (StudentCourse):")
        inscripciones = StudentCourse.objects.filter(student=estudiante)
        for insc in inscripciones:
            print(f"   • ID: {insc.course.id} | {insc.course.name} ({insc.course.code})")
        
        # Hacer request a la API
        url = 'http://127.0.0.1:8000/api/student/courses/'
        headers = {'Authorization': f'Token {token.key}'}
        
        print(f"\n📡 Haciendo request a: {url}")
        response = requests.get(url, headers=headers)
        
        print(f"\n🔢 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Respuesta de la API:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            print(f"\n📊 Total de cursos devueltos: {len(data)}")
            for curso in data:
                print(f"   • ID: {curso.get('id')} | {curso.get('name')}")
        else:
            print(f"\n❌ Error en la API:")
            print(response.text)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "="*60 + "\n")

if __name__ == '__main__':
    verificar_cursos_api()
