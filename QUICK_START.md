# 🎯 Guía Rápida: Desplegar en Railway + Vercel

## 📊 Diagrama de la Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      TU APLICACIÓN                           │
├────────────────────┬──────────────────────────────────────┤
│   FRONTEND (Next.js) │      BACKEND (Django REST)          │
│  🚀 Vercel          │      🚀 Railway                      │
│                     │                                       │
│  • Pages            │      • API Endpoints                 │
│  • Components       │      • Auth (Google, Facebook)       │
│  • MediaPipe (ML)   │      • LSTM Model (IA)              │
│  • TensorFlow.js    │      • MySQL Database               │
│                     │      • Gunicorn Server              │
└─────────────────────┴──────────────────────────────────────┘
         │                              │
         │ fetch()                      │ 
         └──────────────────────────────┘
```

---

## ⚡ Quick Start (5 minutos)

### 1️⃣ Backend en Railway (5 min)

```bash
# 1. Ve a https://railway.app
# 2. "New Project" → "Deploy from GitHub"
# 3. Selecciona Proyecto_IA
# 4. Agrega servicio MySQL
# 5. Copia credenciales:
#    - Host: xxx.railway.app
#    - User: root
#    - Password: xxxxxx
#    - Database: railway
```

**Variables en Railway:**
```
SECRET_KEY=django-insecure-xxxxx
DEBUG=False
ALLOWED_HOSTS=xxx.railway.app
DB_ENGINE=django.db.backends.mysql
DB_NAME=railway
DB_USER=root
DB_PASSWORD=xxxxx
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=3306
CORS_ALLOWED_ORIGINS=https://your-vercel.vercel.app
GOOGLE_OAUTH_CLIENT_ID=xxxxx
GOOGLE_OAUTH_CLIENT_SECRET=xxxxx
FACEBOOK_APP_ID=xxxxx
FACEBOOK_APP_SECRET=xxxxx
GEMINI_API_KEY=xxxxx
```

✅ Backend URL: `https://your-project.railway.app`

---

### 2️⃣ Frontend en Vercel (3 min)

```bash
# 1. Ve a https://vercel.com/dashboard
# 2. "Add New" → "Project"
# 3. Importa Proyecto_IA
# 4. Root Directory: fronted_nextjs
# 5. Deploy automático
```

**Variables en Vercel:**
```
NEXT_PUBLIC_API_URL=https://your-project.railway.app/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxx
NEXT_PUBLIC_FACEBOOK_APP_ID=xxxxx
```

✅ Frontend URL: `https://your-app.vercel.app`

---

## 🔑 Variables de Entorno

| Variable | Dónde | Valor |
|----------|-------|-------|
| `SECRET_KEY` | Railway | Generar nuevo (ver abajo) |
| `DEBUG` | Railway | `False` |
| `ALLOWED_HOSTS` | Railway | Tu dominio Railway |
| `DB_*` | Railway | Credenciales de Railway MySQL |
| `CORS_ALLOWED_ORIGINS` | Railway | Tu dominio Vercel |
| `NEXT_PUBLIC_API_URL` | Vercel | Tu URL Railway/api |
| OAuth IDs | Ambos | De Google & Facebook |
| `GEMINI_API_KEY` | Railway | De Google AI Studio |

---

## 🔐 Generar SECRET_KEY

Ejecuta en tu terminal local:

```bash
cd backed_django
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

O usa el script:
```bash
bash generate_secret_key.sh
```

Copia el resultado a Railway.

---

## ✅ Checklist de Verificación

### Backend (Railway)

- [ ] Proyecto creado en Railway
- [ ] Servicio MySQL agregado
- [ ] Credenciales de BD copiadas
- [ ] Variables de entorno configuradas
- [ ] Deployment completado
- [ ] Puedo acceder a: `https://your-railway.railway.app/api/auth/me/`
  - Debería devolver error 401 (eso significa que funciona)

### Frontend (Vercel)

- [ ] Proyecto creado en Vercel
- [ ] Root directory = `fronted_nextjs`
- [ ] Variables de entorno configuradas
- [ ] Build completado
- [ ] Puedo acceder a: `https://your-app.vercel.app`
- [ ] Login redirecciona correctamente

### Conectividad

- [ ] Frontend conecta con Backend
- [ ] OAuth (Google, Facebook) funciona
- [ ] Migraciones ejecutadas en Railway
- [ ] Sin errores en logs de Railway
- [ ] Sin errores en logs de Vercel

---

## 🆘 Troubleshooting

### "CORS error"
```
✓ Verifica CORS_ALLOWED_ORIGINS en Railway
✓ Incluye tu dominio Vercel exactamente
✓ Reinicia el deployment
```

### "Cannot connect to database"
```
✓ Verifica DB_HOST, DB_USER, DB_PASSWORD
✓ Asegúrate de que MySQL está disponible en Railway
✓ Revisa los logs de Railway
```

### "Module not found"
```
✓ Compila localmente: cd fronted_nextjs && npm run build
✓ Verifica que node_modules esté en .gitignore
✓ Root directory debe ser fronted_nextjs
```

### "Static files 404"
```
✓ WhiteNoise ya está configurado en settings.py
✓ Ejecuta: python backed_django/manage.py collectstatic
✓ Revisa los logs
```

---

## 📁 Archivos Importantes

```
backed_django/
├── Procfile              ← Railway lo lee automáticamente
├── runtime.txt           ← Versión de Python
├── requirements.txt      ← Dependencias (ACTUALIZADO)
├── .env.example          ← Plantilla local
├── .env.production.example ← Plantilla producción
└── monitoring/settings.py ← ACTUALIZADO para producción

fronted_nextjs/
├── .env.local.example    ← Plantilla local
├── .vercelignore         ← Archivos a ignorar
└── package.json          ← Dependencias

Raíz/
├── DEPLOYMENT_GUIDE.md   ← Guía completa
├── DEPLOYMENT_CHECKLIST.md
└── generate_secret_key.sh ← Script para generar SECRET_KEY
```

---

## 🚀 URLs Finales

Una vez deployado, tendrás:

```
🔗 Backend:  https://your-railway-project.railway.app
🔗 Frontend: https://your-vercel-app.vercel.app
🔗 API:      https://your-railway-project.railway.app/api
🔗 Admin:    https://your-railway-project.railway.app/admin
```

---

## 📖 Próximos Pasos

1. **Monitoreo:** Configura alertas en Railway y Vercel
2. **Dominio:** Agrega dominio personalizado en ambas plataformas
3. **SSL:** Ambas lo hacen automático
4. **Backups:** Railway tiene backups automáticos
5. **CI/CD:** Configura workflows de GitHub Actions (opcional)

---

## 💡 Tips Útiles

- **Ver logs en Railway:** Dashboard → Deployments → Logs
- **Ver logs en Vercel:** Dashboard → Deployments → Logs
- **Reiniciar backend:** Railway → Restart Deployment
- **Trigger redeploy:** Push a GitHub automáticamente redeploya
- **Ejecutar comandos en Railway:** Railway CLI → Connect Shell

---

## 📚 Documentación Completa

Lee `DEPLOYMENT_GUIDE.md` para instrucciones paso a paso con pantallas.

---

**¿Listo para desplegar? 🚀 ¡Comienza con el Backend en Railway!**
