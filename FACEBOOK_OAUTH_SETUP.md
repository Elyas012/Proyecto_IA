# Configuración de Facebook OAuth

Este documento explica cómo configurar Facebook OAuth para la autenticación en el proyecto.

## 📋 Requisitos Previos

1. Una cuenta de Facebook
2. Acceso a Facebook for Developers

## 🔧 Pasos de Configuración

### 1. Crear App en Facebook for Developers

1. Ve a [Facebook for Developers](https://developers.facebook.com/)
2. Haz clic en **Mis Aplicaciones** > **Crear Aplicación**
3. Selecciona **Consumidor** como tipo de aplicación
4. Completa los detalles:
   - **Nombre de la aplicación**: `FocusLearn`
   - **Correo electrónico de contacto**: Tu correo
   - Haz clic en **Crear aplicación**

### 2. Configurar Facebook Login

1. En el panel de tu aplicación, ve a **Agregar un producto**
2. Busca **Inicio de sesión con Facebook** y haz clic en **Configurar**
3. Selecciona **Web** como plataforma
4. Ingresa la URL del sitio: `http://localhost:3000`
5. Guarda los cambios

### 3. Configurar Dominios y URLs

1. En el menú lateral, ve a **Inicio de sesión con Facebook** > **Configuración**
2. Agrega las siguientes URLs en **URI de redirección de OAuth válidos**:
   - `http://localhost:3000`
   - `http://localhost:3000/auth/callback`
3. Guarda los cambios

### 4. Obtener Credenciales

1. Ve a **Configuración** > **Básica**
2. Copia el **ID de la aplicación** (App ID)
3. Haz clic en **Mostrar** junto a **Clave secreta de la aplicación** (App Secret)
4. Copia la clave secreta

### 5. Configurar el Backend (Django)

1. Abre el archivo `.env` en la carpeta `backed_django`:
   ```bash
   cd backed_django
   ```

2. Agrega las siguientes variables:
   ```env
   FACEBOOK_APP_ID=tu-facebook-app-id-aqui
   FACEBOOK_APP_SECRET=tu-facebook-app-secret-aqui
   ```

3. Las dependencias ya están instaladas (requests)

### 6. Configurar el Frontend (Next.js)

1. Abre el archivo `.env.local` en la carpeta `fronted_nextjs`

2. Agrega la siguiente variable:
   ```env
   NEXT_PUBLIC_FACEBOOK_APP_ID=tu-facebook-app-id-aqui
   ```
   
   **IMPORTANTE**: Usa el MISMO App ID que configuraste en el backend.

3. Instala las nuevas dependencias:
   ```bash
   cd fronted_nextjs
   npm install
   ```

### 7. Modo de Desarrollo vs Producción

**Importante**: Por defecto, tu app de Facebook está en **Modo de desarrollo**, lo que significa que solo tú y los usuarios que agregues como testers pueden iniciar sesión.

#### Para agregar testers:
1. Ve a **Roles** > **Roles de prueba** en el panel de tu app
2. Haz clic en **Agregar testers**
3. Ingresa los correos de Facebook de los usuarios que quieres que prueben

#### Para modo producción:
1. Completa todos los campos requeridos en **Configuración** > **Básica**
2. Agrega una **Política de privacidad** y **Términos de servicio**
3. Cambia el modo a **Activo** en la parte superior del panel

### 8. Iniciar los Servidores

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
3. En la pestaña de **Iniciar Sesión**, verás:
   - Botón de **Iniciar sesión con Google**
   - Botón de **Continuar con Facebook** (azul)
4. Haz clic en el botón de Facebook y autoriza la aplicación
5. Serás autenticado automáticamente en el sistema

## 🔐 Flujo de Autenticación

1. El usuario hace clic en el botón de Facebook en el frontend
2. Facebook autentica al usuario y devuelve un access token
3. El frontend envía este token al endpoint `/api/auth/facebook/` del backend
4. El backend valida el token con Facebook Graph API
5. Si es válido, el backend obtiene la información del usuario (email, nombre)
6. El backend busca o crea el usuario en la base de datos
7. El backend devuelve un token de autenticación y la información del usuario
8. El usuario es redirigido al dashboard correspondiente según su rol

## 📝 Notas Importantes

- Los usuarios autenticados con Facebook se crean automáticamente con el rol de **Estudiante**
- Facebook requiere que los usuarios autoricen el acceso a su email
- Si un usuario no tiene email público en Facebook, la autenticación fallará
- En modo desarrollo, solo usuarios testers pueden iniciar sesión
- El token de Facebook se valida en cada autenticación para garantizar la seguridad

## 🐛 Solución de Problemas

### Error: "Invalid Facebook token"
- Verifica que el App ID en el frontend y backend sean iguales
- Asegúrate de que las URIs de redirección estén configuradas correctamente
- Verifica que la app de Facebook esté en modo desarrollo o que el usuario sea tester

### Error: "Email not provided by Facebook"
- El usuario debe autorizar el permiso de email en Facebook
- Verifica que tu app de Facebook tenga los permisos correctos

### El botón de Facebook no aparece
- Verifica que hayas instalado `react-facebook-login` con `npm install`
- Asegúrate de que `NEXT_PUBLIC_FACEBOOK_APP_ID` esté configurado en `.env.local`
- Reinicia el servidor de desarrollo de Next.js

### Error: "App Not Setup"
- Asegúrate de haber agregado el dominio `localhost` en la configuración de Facebook Login
- Verifica que las URIs de redirección estén configuradas

## 📚 Recursos Adicionales

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Graph API Documentation](https://developers.facebook.com/docs/graph-api/)
- [react-facebook-login](https://www.npmjs.com/package/react-facebook-login)
- [Facebook App Development](https://developers.facebook.com/docs/development)
