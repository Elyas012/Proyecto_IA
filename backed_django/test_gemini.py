from google import genai

# Tu API KEY real
API_KEY = "AIzaSyB_66tL4aj5yJ5H4Yjbq6IeLkBfEYWWyRM" 

client = genai.Client(api_key=API_KEY)

print("--- LISTA DE MODELOS DISPONIBLES ---")

try:
    # Iteramos y solo imprimimos el nombre, sin filtros complejos
    for m in client.models.list():
        print(f"Nombre: {m.name}")
        
except Exception as e:
    print(f"❌ Error: {e}")