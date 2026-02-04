# 🔧 Solución: Errores 404 y 500 en Subida de Archivos

## Problemas Identificados

### 1. **Error 404 en `/api/media/course_materials/...`** 
**Causa:** En producción con `DEBUG=False`, Django NO sirve archivos de `/media/` automáticamente.

**Logs:**
```
GET /api/media/course_materials/Manual_básico_iniciación_a_Python_3_hAZJJZG.pdf
404 - El archivo no se encuentra
```

### 2. **Error 500 en `/api/teacher/generate-quiz/`**
**Causa:** El endpoint intenta acceder a archivos que pueden no existir en producción.

## ✅ Soluciones Implementadas

### 1. Nuevo Endpoint para Descargar Archivos
**Ruta:** `GET /api/media/course-materials/<material_id>/download/`

**Características:**
- ✅ Valida permisos (estudiante inscrito, profesor del curso, o admin)
- ✅ Sirve archivos directamente desde Django
- ✅ Funciona en producción (DEBUG=False)
- ✅ Manejo correcto de MIME types

**Código agregado en `api/views.py`:**
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_course_material(request, material_id):
    """Sirve archivos con validación de permisos"""
    material = get_object_or_404(CourseMaterial, id=material_id)
    # ... validación de permisos ...
    return FileResponse(file_obj, content_type=mime_type)
```

### 2. Serializer Mejorado
**Cambios en `CourseMaterialSerializer`:**
- Nuevo campo `file_url` que apunta al endpoint seguro
- Genera URLs del tipo: `/api/media/course-materials/1/download/`
- Elimina exposición de rutas directas del sistema

### 3. Endpoint `generate_quiz_ai` Mejorado
**Mejoras:**
- ✅ Valida que el archivo existe antes de procesarlo
- ✅ Verifica permisos del profesor
- ✅ Manejo específico de excepciones (FileNotFoundError, JSONDecodeError, etc.)
- ✅ Logs detallados para debugging
- ✅ Validación de API Key de Gemini

### 4. URLs Actualizadas
**Nuevo archivo en `api/urls.py`:**
```python
path('media/course-materials/<int:material_id>/download/', 
     download_course_material, name='download-course-material'),
```

## 📋 Cambios Realizados

| Archivo | Cambio |
|---------|--------|
| `backed_django/api/views.py` | Agregado endpoint `download_course_material()` |
| `backed_django/api/urls.py` | Agregada ruta para descargar archivos |
| `backed_django/api/serializers.py` | Actualizado `CourseMaterialSerializer` con `file_url` |

## 🚀 Pasos Siguientes

### 1. **Frontend - Actualizar URLs de Archivos**
En `fronted_nextjs/`, cambiar cualquier referencia de archivos de:
```typescript
// ❌ ANTIGUO (no funciona en producción)
const fileUrl = `/api${material.file}`;  // /api/media/course_materials/...

// ✅ NUEVO (funciona en producción)
const fileUrl = material.file_url;  // /api/media/course-materials/1/download/
```

### 2. **Desplegar Cambios**
```bash
git add .
git commit -m "Fix: Agregar endpoint seguro para descargar archivos de materiales"
git push origin Updates
```

### 3. **Verificar en Producción**
1. Sube un archivo como docente
2. Verifica que la respuesta incluya `file_url`:
```json
{
  "id": 1,
  "title": "Manual de Python",
  "file_url": "/api/media/course-materials/1/download/",
  "has_quiz": false
}
```

3. Accede al archivo: `GET /api/media/course-materials/1/download/`
   - Debe retornar el archivo (200 OK)
   - NO debe retornar 404

## 🔍 Testing

### Test 1: Obtener lista de materiales
```bash
curl -H "Authorization: Token <TOKEN>" \
  https://proyectoia-production.up.railway.app/api/course-materials/by-course/1/
```

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "title": "Manual Python",
    "file_url": "/api/media/course-materials/1/download/",
    "has_quiz": false
  }
]
```

### Test 2: Descargar archivo
```bash
curl -H "Authorization: Token <TOKEN>" \
  https://proyectoia-production.up.railway.app/api/media/course-materials/1/download/ \
  -o archivo.pdf
```

**Respuesta esperada:** 200 OK + archivo descargado

### Test 3: Generar quiz (mejorado)
```bash
curl -X POST -H "Authorization: Token <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"material_id": 1}' \
  https://proyectoia-production.up.railway.app/api/teacher/generate-quiz/
```

**Respuesta esperada:** 201 Created (antes retornaba 500)

## 📝 Notas Importantes

1. **Los archivos se siguen guardando en `/media/`** en el servidor
   - Django los valida y sirve a través de la API

2. **La seguridad está garantizada:**
   - Solo usuarios autenticados pueden acceder
   - Solo pueden ver materiales de cursos donde están inscritos
   - Profesores y admins pueden ver todos

3. **Compatibilidad:**
   - Funciona en desarrollo (DEBUG=True) y producción (DEBUG=False)
   - No requiere cambios en `settings.py`

## ❓ Troubleshooting

### Si aún ves 404 en `/api/media/...`:
1. Verifica que el token es válido: `GET /api/auth/me/`
2. Comprueba que el material_id existe: `GET /api/course-materials/`
3. Asegúrate de tener permisos al curso

### Si ves 500 en `/api/teacher/generate-quiz/`:
1. Verifica que el material_id existe
2. Comprueba que el archivo está en el servidor (revisar logs)
3. Valida que la API Key de Gemini está configurada

### Si los archivos no se descargan:
1. Verifica que `MEDIA_ROOT` en `settings.py` es correcto
2. Comprueba permisos de carpeta: `chmod 755 /app/media/`
3. Revisa los logs del servidor: `railway logs`
