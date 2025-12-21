
# Plataforma de Monitoreo de Estudiantes Impulsada por IA

Este proyecto es una plataforma de e-learning diseñada para mejorar la experiencia de aprendizaje en línea a través de herramientas inteligentes de monitoreo y gestión de cursos. La aplicación consta de un backend robusto desarrollado con Django y un frontend moderno e interactivo construido con Next.js.

## Características Principales

### Para Estudiantes
- **Dashboard Personalizado:** Visualiza cursos inscritos y progreso.
- **Visualizador de Materiales:** Accede a PDFs y videos del curso directamente en la plataforma.
- **Técnica Pomodoro:** Herramienta de gestión del tiempo integrada para mejorar la concentración.
- **Monitoreo de Atención:** Utiliza la cámara web para analizar y proveer feedback sobre los niveles de atención durante las sesiones de estudio, empleando un modelo de IA.

### Para Profesores
- **Gestión de Cursos:** Crea, actualiza y gestiona cursos.
- **Subida de Materiales:** Sube archivos (PDFs, videos) para cada curso.
- **Reportes de Estudiantes:** Visualiza analíticas detalladas sobre el rendimiento y los niveles de atención de los estudiantes.

### Para Administradores
- **Gestión de Usuarios:** Administra los roles y accesos de usuarios en el sistema.

## Tech Stack

- **Backend:**
  - **Framework:** Django & Django REST Framework
  - **Lenguaje:** Python
  - **Base de Datos:** MySQL(Almacenamiento general) y MongoDB(Metricas)
  - **Inteligencia Artificial:** TensorFlow/Keras (para el modelo LSTM de detección de distracciones), Scikit-learn.

- **Frontend:**
  - **Framework:** Next.js & React
  - **Lenguaje:** TypeScript
  - **Estilos:** Tailwind CSS (con shadcn/ui)
  - **Componentes:** Gráficos, reproductores de video, visores de PDF.

## Estructura del Proyecto

El repositorio está organizado en dos directorios principales:

- **`/backed_django`**: Contiene todo el código del servidor, la API REST, los modelos de base de datos y la lógica de IA.
- **`/fronted_nextjs`**: Contiene la aplicación de Next.js, las páginas, componentes de UI y la lógica de interacción con el usuario.

## Puesta en Marcha (Getting Started)

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos
- Python 3.9+
- Node.js 18+
- npm/yarn

### 1. Configuración del Backend (Django)

```bash
# 1. Navega al directorio del backend
cd backed_django

# 2. Crea y activa un entorno virtual
python -m venv .venv
# En Windows
.\.venv\Scripts\activate
# En macOS/Linux
source .venv/bin/activate

# 3. Instala las dependencias
pip install -r requirements.txt

# 4. Aplica las migraciones de la base de datos
python manage.py migrate

# 5. Inicia el servidor de desarrollo (en http://127.0.0.1:8000)
python manage.py runserver
```

### 2. Configuración del Frontend (Next.js)

```bash
# 1. Abre una nueva terminal y navega al directorio del frontend
cd fronted_nextjs

# 2. Instala las dependencias
npm install

# 3. Inicia el servidor de desarrollo (en http://localhost:3000)
npm run dev
```

### 3. Acceder a la Aplicación

Una vez que ambos servidores estén en ejecución:
- Abre tu navegador y ve a `http://localhost:3000`.
- Para interactuar con la API, las rutas están disponibles en `http://127.0.0.1:8000/api/`.

## Licencia

Este proyecto se distribuye bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
