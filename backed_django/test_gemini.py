import google.generativeai as genai

# Pega tu clave aquí
API_KEY = "AIzaSyAYoq5DXWe1xGd-u080wVXjZUrlVSnH1D0"

genai.configure(api_key=API_KEY)

print("🔍 Buscando modelos disponibles...")
try:
    available_models = []
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ Encontrado: {m.name}")
            available_models.append(m.name)
            
    if not available_models:
        print("❌ No se encontraron modelos compatibles con generateContent.")
    else:
        print("\n💡 PRUEBA ESTO: Copia uno de los nombres de arriba (ej: 'models/gemini-1.5-flash')")
        print("y pégalo en tu archivo views.py")

except Exception as e:
    print(f"❌ Error de conexión: {e}")