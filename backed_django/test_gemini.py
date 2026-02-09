

import os
from google import genai

# Lee la API KEY desde la variable de entorno
API_KEY = os.environ.get("GOOGLE_API_KEY")
client = genai.Client(api_key=API_KEY)

print("--- LISTA DE MODELOS DISPONIBLES ---")

try:
    # Iteramos y solo imprimimos el nombre, sin filtros complejos
    for m in client.models.list():
        print(f"Nombre: {m.name}")
        
except Exception as e:
    print(f"❌ Error: {e}")