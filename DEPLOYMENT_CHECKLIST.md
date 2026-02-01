# ⚡ Checklist Rápido de Despliegue

## 📦 Archivos Agregados/Modificados

✅ `backed_django/requirements.txt` - Actualizado con dependencias de producción
✅ `backed_django/Procfile` - Configuración para Railway
✅ `backed_django/runtime.txt` - Python 3.11.7
✅ `backed_django/.env.example` - Template de variables
✅ `backed_django/.env.production.example` - Ejemplo para producción
✅ `backed_django/monitoring/settings.py` - Actualizado para producción
✅ `fronted_nextjs/.env.local.example` - Template de frontend
✅ `fronted_nextjs/.vercelignore` - Archivos a ignorar en Vercel
✅ `DEPLOYMENT_GUIDE.md` - Guía completa
✅ `generate_secret_key.sh` - Script para generar SECRET_KEY

---

## 🚀 Pasos Rápidos

### Backend (Railway)
1. Push a GitHub
2. Crear nuevo proyecto en Railway
3. Conectar repositorio GitHub
4. Agregar servicio MySQL
5. Copiar credenciales de BD
6. Agregar variables de entorno en Railway
7. Ejecutar migraciones
8. Obtener URL del backend

### Frontend (Vercel)
1. Crear proyecto en Vercel
2. Seleccionar repositorio y rama
3. Root directory: `fronted_nextjs`
4. Agregar variables de entorno
5. Deploy automático

---

## 📍 URLs Finales

```
Backend:  https://your-railway-project.railway.app
Frontend: https://your-vercel-app.vercel.app
API:      https://your-railway-project.railway.app/api
```

---

## 🔐 Variables Críticas

**Backend (Railway):**
- `SECRET_KEY` - Generar con: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
- `DEBUG=False`
- `DB_*` - Credenciales de MySQL
- `CORS_ALLOWED_ORIGINS` - Tu dominio de Vercel
- OAuth credentials - Google, Facebook

**Frontend (Vercel):**
- `NEXT_PUBLIC_API_URL` - Tu URL de Railway
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google
- `NEXT_PUBLIC_FACEBOOK_APP_ID` - Facebook

---

## ⚠️ Importante

1. **NO subas archivos `.env` a GitHub** - Usa los paneles de variables de entorno
2. **Genera una nueva SECRET_KEY** para producción
3. **Actualiza CORS_ALLOWED_ORIGINS** después de obtener tu dominio de Vercel
4. **Ejecuta migraciones** después de conectar la BD
5. **Verifica los logs** en Railway y Vercel si algo falla

---

## 📚 Recursos

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Django Deployment](https://docs.djangoproject.com/en/4.2/howto/deployment/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

¡Lee `DEPLOYMENT_GUIDE.md` para instrucciones detalladas! 📖
