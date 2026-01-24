# Configuración de Google OAuth

Este documento explica cómo configurar Google OAuth para la autenticación en el proyecto.

## 📋 Requisitos Previos

1. Una cuenta de Google
2. Acceso a Google Cloud Console

## 🔧 Pasos de Configuración

### 1. Crear Credenciales en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** > **Credentials**
4. Haz clic en **Create Credentials** > **OAuth 2.0 Client ID**
5. Si es la primera vez, configura la pantalla de consentimiento OAuth:
   - Tipo de usuario: **Externo**
   - Completa la información básica de la aplicación
   - Agrega los siguientes scopes:
     - `email`
     - `profile`
     - `openid`

6. Vuelve a **Credentials** y crea un **OAuth 2.0 Client ID**:
   - Tipo de aplicación: **Web application**
   - Nombre: `FocusLearn`
   - URIs de redirección autorizados:
     - `http://localhost:3000`
     - `http://localhost:3000/auth/callback`
   - Orígenes de JavaScript autorizados:
     - `http://localhost:3000`

7. Copia el **Client ID** y **Client Secret** generados

### 2. Configurar el Backend (Django)

1. Navega a la carpeta del backend:
   ```bash
   cd backed_django
   ```

2. Copia el archivo de ejemplo de variables de entorno:
   ```bash
   copy .env.example .env
   ```

3. Edita el archivo `.env` y actualiza las siguientes variables:
   ```env
   GOOGLE_OAUTH_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=tu-client-secret-aqui
   ```

4. Instala las nuevas dependencias:
   ```bash
   pip install -r requirements.txt
   ```

### 3. Configurar el Frontend (Next.js)

1. Navega a la carpeta del frontend:
   ```bash
   cd fronted_nextjs
   ```

2. Copia el archivo de ejemplo de variables de entorno:
   ```bash
   copy .env.example .env.local
   ```

3. Edita el archivo `.env.local` y actualiza la siguiente variable:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
   ```
   
   **IMPORTANTE**: Usa el MISMO Client ID que configuraste en el backend.

4. Instala las nuevas dependencias:
   ```bash
   npm install
   ```

### 4. Iniciar los Servidores

#### Backend (Django)
```bash
cd backed_django
python manage.py runserver
```

#### Frontend (Next.js)
```bash
cd fronted_nextjs
npm run dev
```

## 🎯 Uso

1. Ve a [http://localhost:3000](http://localhost:3000)
2. Haz clic en **Iniciar Sesión**
3. En la pestaña de **Iniciar Sesión**, verás un botón de **Iniciar sesión con Google**
4. Haz clic en el botón y selecciona tu cuenta de Google
5. Serás autenticado automáticamente en el sistema

## 🔐 Flujo de Autenticación

1. El usuario hace clic en el botón de Google en el frontend
2. Google autentica al usuario y devuelve un token ID
3. El frontend envía este token al endpoint `/api/auth/google/` del backend
4. El backend valida el token con Google
5. Si es válido, el backend busca o crea el usuario en la base de datos
6. El backend devuelve un token de autenticación y la información del usuario
7. El usuario es redirigido al dashboard correspondiente según su rol

## 📝 Notas Importantes

- Los usuarios autenticados con Google se crean automáticamente con el rol de **Estudiante**
- Si necesitas cambiar el rol de un usuario, hazlo desde el panel de administrador
- El token de Google es validado en cada autenticación para garantizar la seguridad
- Las variables de entorno NUNCA deben ser committeadas al repositorio

## 🐛 Solución de Problemas

### Error: "Invalid token"
- Verifica que el Client ID en el frontend y backend sean iguales
- Asegúrate de que las URIs de redirección estén configuradas correctamente en Google Cloud Console

### Error: "Authentication failed"
- Verifica que las credenciales de Google estén correctamente configuradas en los archivos `.env`
- Asegúrate de que las dependencias estén instaladas correctamente

### El botón de Google no aparece
- Verifica que hayas instalado `@react-oauth/google` con `npm install`
- Asegúrate de que `NEXT_PUBLIC_GOOGLE_CLIENT_ID` esté configurado en `.env.local`
- Reinicia el servidor de desarrollo de Next.js

## 📚 Recursos Adicionales

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth2 Google](https://www.npmjs.com/package/@react-oauth/google)
- [Django REST Framework Authentication](https://www.django-rest-framework.org/api-guide/authentication/)
