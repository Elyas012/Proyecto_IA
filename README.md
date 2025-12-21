# 🎓 Plataforma de Monitoreo de Estudiantes Impulsada por IA

Plataforma de **e-learning inteligente** orientada a mejorar la experiencia de aprendizaje en línea mediante **monitoreo de atención en tiempo real**, analíticas avanzadas y gestión académica integral.

El sistema combina **visión por computadora**, **aprendizaje profundo** y una arquitectura moderna **backend–frontend**, permitiendo detectar niveles de distracción de los estudiantes durante sus sesiones de estudio y generar reportes útiles para docentes y administradores.

---

## 🚀 Características Principales

### 👨‍🎓 Para Estudiantes
- **Dashboard Personalizado**
  - Visualización de cursos inscritos.
  - Seguimiento de progreso académico.
- **Visualizador de Contenidos**
  - Lectura de PDFs.
  - Reproducción de videos directamente en la plataforma.
- **Técnica Pomodoro Integrada**
  - Gestión del tiempo para mejorar la concentración.
- **Monitoreo de Atención con IA**
  - Uso de la cámara web para analizar:
    - Movimientos oculares.
    - Apertura/cierre de ojos.
    - Apertura de la boca.
  - Extracción de métricas faciales mediante **MediaPipe**.
  - Evaluación de distracción usando un **modelo LSTM**.
  - Feedback en tiempo casi real sobre el nivel de atención.

---

### 👩‍🏫 Para Profesores
- **Gestión de Cursos**
  - Creación, edición y administración de cursos.
- **Subida de Material Académico**
  - PDFs y videos organizados por curso.
- **Reportes de Atención y Rendimiento**
  - Visualización de métricas de atención.
  - Análisis del comportamiento de los estudiantes durante las sesiones.

---

### 🛠️ Para Administradores
- **Gestión de Usuarios**
  - Control de roles (estudiante, profesor, administrador).
  - Administración de accesos y permisos del sistema.

---

## 🧠 Inteligencia Artificial y Monitoreo

El sistema de monitoreo funciona de la siguiente manera:

1. **Captura de video** desde la cámara del estudiante.
2. **MediaPipe Face Mesh** extrae coordenadas numéricas de:
   - Ojos
   - Boca
3. Estas métricas se convierten en **series temporales**.
4. Un **modelo LSTM** procesa los datos para clasificar estados como:
   - Atención
   - Distracción
5. Las métricas se almacenan en **MongoDB** para análisis posterior.

---

## 🧰 Tech Stack

### 🔙 Backend
- **Framework:** Django, Django REST Framework
- **Lenguaje:** Python
- **Base de Datos:**
  - MySQL → almacenamiento general (usuarios, cursos, materiales)
  - MongoDB → métricas de atención y datos temporales
- **IA & ML:**
  - TensorFlow / Keras (modelo LSTM)
  - Scikit-learn
  - MediaPipe

---

### 🔜 Frontend
- **Framework:** Next.js, React
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS + shadcn/ui
- **Componentes:**
  - Dashboards interactivos
  - Gráficos de métricas
  - Reproductor de video
  - Visor de PDF

---

## 📁 Estructura del Proyecto

\
├───.git\
├───backed_django\
│   ├───.venv\
│   │   ├───Lib\
│   │   └───Scripts\
│   ├───api\
│   │   ├───management\
│   │   │   └───commands\
│   │   └───migrations\
│   ├───media\
│   │   └───course_materials\
│   └───monitoring\
└───fronted_nextjs\
    ├───.next\
    ├───components\
    │   ├───Figma\
    │   └───ui\
    ├───lib\
    ├───models\
    ├───node_modules\
    ├───pages\
    │   └───api\
    │       └───auth\
    ├───public\
    │   └───models\
    │       └───attention_model\
    ├───scripts\
    └───styles\


- **`/backed_django`**  
  Contiene la API REST, lógica de negocio, modelos de base de datos y procesamiento de IA.

- **`/fronted_nextjs`**  
  Aplicación web moderna para interacción con estudiantes, docentes y administradores.

---

## ⚙️ Puesta en Marcha (Getting Started)

### 📌 Prerrequisitos
- Python **3.9+**
- Node.js **18+**
- npm o yarn
- MySQL
- MongoDB

---

### 🔧 Backend (Django)

# Navegar al backend
cd backed_django

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# Windows
.\.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones
python manage.py migrate

# Iniciar servidor
python manage.py runserver


Servidor disponible en:
👉 http://127.0.0.1:8000

### 🎨 Frontend (Next.js)
# Navegar al frontend
cd fronted_nextjs

# Instalar dependencias
npm install

# Iniciar servidor
npm run dev

Aplicación disponible en:
👉 http://localhost:3000

### 📄 Licencia

Este proyecto se distribuye bajo la Licencia MIT.
Eres libre de usar, modificar y distribuir el software citando al autor.

