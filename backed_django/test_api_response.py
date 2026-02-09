#!/usr/bin/env python
"""
Script para verificar qué devuelve la API para el material ID 6
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
import json

def test_api():
    # Obtener token
    user = User.objects.first()
    token, _ = Token.objects.get_or_create(user=user)
    
    print("\n" + "="*60)
    print("PROBANDO API - Material ID 6")
    print("="*60)
    
    # Hacer request
    url = 'http://127.0.0.1:8000/api/course-materials/6/'
    headers = {'Authorization': f'Token {token.key}'}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"\nEstado: {response.status_code}")
        print(f"\nRespuesta JSON:")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "="*60)

if __name__ == '__main__':
    test_api()
