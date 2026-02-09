#!/usr/bin/env python
"""
Script para verificar autenticación del usuario logueado
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'monitoring.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

def verificar_tokens():
    print("\n" + "="*60)
    print("🔑 TOKENS DE AUTENTICACIÓN")
    print("="*60)
    
    users = User.objects.all()
    
    for user in users:
        try:
            token = Token.objects.get(user=user)
            profile = getattr(user, 'profile', None)
            role = profile.role if profile else 'sin perfil'
            
            print(f"\n👤 Usuario: {user.username}")
            print(f"   Email: {user.email}")
            print(f"   Rol: {role}")
            print(f"   Token: {token.key}")
            
            # Si es docente, mostrar prominentemente
            if profile and profile.role == 'teacher':
                print(f"   🎯 DOCENTE - Token para usar en frontend:")
                print(f"      {token.key}")
        except Token.DoesNotExist:
            print(f"\n👤 Usuario: {user.username} - ❌ Sin token")
    
    print("\n" + "="*60)
    print("\n💡 INSTRUCCIONES:")
    print("   1. Copia el token del docente")
    print("   2. En el navegador, abre DevTools (F12)")
    print("   3. Ve a Application > Local Storage")
    print("   4. Verifica que 'authToken' tenga el valor correcto")
    print("   5. Si no coincide, inicia sesión nuevamente")
    print("")

if __name__ == '__main__':
    verificar_tokens()
