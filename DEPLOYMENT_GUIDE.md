# Guía de Despliegue: Vercel (Frontend) + Railway (Backend)

## 📋 Requisitos Previos

1. Cuenta en [Vercel](https://vercel.com)
2. Cuenta en [Railway](https://railway.app)
3. Repositorio GitHub con acceso
4. Variables de entorno configuradas

---

## 🚀 PARTE 1: DESPLIEGUE DEL BACKEND EN RAILWAY

### Paso 1: Crear Proyecto en Railway

1. Ve a https://railway.app
2. Haz click en **New Project**
3. Selecciona **Deploy from GitHub**
4. Autoriza Railway en GitHub
5. Selecciona el repositorio `Proyecto_IA`
6. Elige la rama `Updates` (o `master`)

### Paso 2: Crear Base de Datos MySQL en Railway

1. En el dashboard de Railway, haz click en **Add Service** (+ button)
2. Busca y selecciona **MySQL**
3. Railway creará automáticamente la base de datos
4. Copia las credenciales que se muestran:
   - Host
   - Port
   - Username
   - Password
   - Database name

### Paso 3: Configurar Variables de Entorno en Railway

En el proyecto de Railway, ve a **Variables** y agrega:

```env
# Django Configuration
SECRET_KEY=generate-a-new-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-railway-domain.railway.app,localhost

# Database (Railway MySQL credentials)
DB_ENGINE=django.db.backends.mysql
DB_NAME=railway  # o el nombre que te asignó Railway
DB_USER=root
DB_PASSWORD=your-railway-password
DB_HOST=containers-us-west-208.railway.app  # Tu host de Railway
DB_PORT=3306

# CORS (actualizar con tu dominio de Vercel)
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_REDIRECT_URI=https://your-vercel-app.vercel.app/auth/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

### Paso 4: Configurar Build y Deploy

1. En Railway, ve a la sección **Settings**
2. En **Build Command**, asegúrate de que esté configurado:
   ```bash
   pip install -r backed_django/requirements.txt
   ```

3. En **Start Command**, verifica que esté:
   ```bash
   cd backed_django && gunicorn monitoring.wsgi
   ```

4. O Railway puede automáticamente detectar `Procfile`

### Paso 5: Generar Nueva Secret Key

En tu terminal local:
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

Copia el resultado y actualiza `SECRET_KEY` en Railway.

### Paso 6: Ejecutar Migraciones

Una vez que Railway está deployando, en el dashboard:

1. Ve a **Deployments**
2. Abre la consola del último deployment (CLI icon)
3. Ejecuta:
   ```bash
   python backed_django/manage.py migrate
   ```

4. Crea un superusuario (opcional):
   ```bash
   python backed_django/manage.py createsuperuser
   ```

### Paso 7: Obtener URL del Backend

Tu backend estará disponible en:
```
https://your-railway-project.railway.app
```

Copia esta URL para usarla en el frontend.

---

## 🚀 PARTE 2: DESPLIEGUE DEL FRONTEND EN VERCEL

### Paso 1: Crear Proyecto en Vercel

1. Ve a https://vercel.com/dashboard
2. Haz click en **Add New > Project**
3. Selecciona **Import Git Repository**
4. Busca `Proyecto_IA` y selecciona
5. En **Root Directory**, selecciona `fronted_nextjs`

### Paso 2: Configurar Variables de Entorno en Vercel

En la sección de **Environment Variables**, agrega:

```env
# Backend API
NEXT_PUBLIC_API_URL=https://your-railway-project.railway.app/api

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Facebook OAuth
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id

# Dev Token (opcional, solo para testing)
NEXT_PUBLIC_DEV_TOKEN=your-dev-token
```

### Paso 3: Configurar Build

Vercel debería detectar automáticamente que es un proyecto Next.js.

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
.next
```

### Paso 4: Deploy

Haz click en **Deploy**. Vercel automáticamente:
- Instala dependencias
- Construye la aplicación
- Publica en su CDN global

Tu frontend estará disponible en:
```
https://your-app.vercel.app
```

### Paso 5: Actualizar CORS en Railway

Vuelve a Railway y actualiza `CORS_ALLOWED_ORIGINS`:

```env
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

También actualiza los URLs de OAuth:

```env
GOOGLE_OAUTH_REDIRECT_URI=https://your-app.vercel.app/auth/callback
```

---

## ✅ Verificación Post-Despliegue

### 1. Probar la API del Backend

```bash
curl https://your-railway-project.railway.app/api/auth/me/
```

Deberías recibir un error 401 (no autenticado), lo que significa que la API está funcionando.

### 2. Probar Login en Frontend

1. Ve a `https://your-app.vercel.app`
2. Intenta hacer login
3. Verifica que se conecte correctamente al backend

### 3. Verificar Migraciones

En la consola de Railway:
```bash
python backed_django/manage.py migrate --check
```

### 4. Revisar Logs

- **Railway:** Dashboard > Deployments > Logs
- **Vercel:** Dashboard > Deployments > Logs

---

## 🔧 Troubleshooting Común

### Error: "CORS not allowed"
- Verifica que `CORS_ALLOWED_ORIGINS` en Railway incluya tu dominio de Vercel
- Reinicia el deployment en Railway

### Error: "Database connection refused"
- Verifica credenciales de MySQL en Railway
- Asegúrate de que `DB_HOST`, `DB_USER`, `DB_PASSWORD` sean correctos

### Error: "Module not found"
- Verifica que `requirements.txt` esté en `backed_django/`
- Asegúrate de que `Procfile` esté en `backed_django/`

### Error: "Static files not found"
- WhiteNoise está configurado automáticamente
- Ejecuta: `python backed_django/manage.py collectstatic --noinput`

### Next.js Build Fails
- Verifica que el **Root Directory** en Vercel sea `fronted_nextjs`
- Compila localmente: `cd fronted_nextjs && npm run build`

---

## 🔐 Variables de Entorno Necesarias

### Backend (Railway)
```env
SECRET_KEY                    # Django secret key
DEBUG                         # False en producción
ALLOWED_HOSTS                 # Tu dominio de Railway
DB_ENGINE                     # django.db.backends.mysql
DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
CORS_ALLOWED_ORIGINS          # Tu dominio de Vercel
GOOGLE_OAUTH_CLIENT_ID        # Google Console
GOOGLE_OAUTH_CLIENT_SECRET    # Google Console
GOOGLE_OAUTH_REDIRECT_URI     # Tu URL de Vercel + /auth/callback
FACEBOOK_APP_ID               # Facebook Developers
FACEBOOK_APP_SECRET           # Facebook Developers
GEMINI_API_KEY                # Google AI Studio
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL           # Tu URL de Railway/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID  # Google Console
NEXT_PUBLIC_FACEBOOK_APP_ID   # Facebook Developers
```

---

## 📝 Checklist de Despliegue

- [ ] Backend deployado en Railway
- [ ] Base de datos MySQL creada en Railway
- [ ] Migraciones ejecutadas en Railway
- [ ] Variables de entorno configuradas en Railway
- [ ] Frontend deployado en Vercel
- [ ] Variables de entorno configuradas en Vercel
- [ ] CORS actualizado con dominio de Vercel
- [ ] OAuth URLs actualizadas (Google, Facebook)
- [ ] Prueba de login exitosa
- [ ] API respondiendo correctamente
- [ ] Sin errores en logs

---

## 🚀 Próximas Acciones (Opcional)

- Configurar dominio personalizado
- Activar SSL automático (ambas plataformas lo hacen por defecto)
- Configurar monitoreo y alertas
- Automatizar backups de base de datos
- Agregar CI/CD workflows

¡Listo para producción! 🎉
