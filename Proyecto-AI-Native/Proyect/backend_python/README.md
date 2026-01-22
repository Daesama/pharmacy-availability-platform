# Backend Python - FarmaciaConnect

## 🚀 Backend con Python + SQLite

Esta versión usa **Python + FastAPI + SQLite** como backend para FarmaciaConnect.

## ✅ Ventajas

- **Zero-config**: SQLite no requiere instalación de base de datos
- **Archivo único**: Toda la base de datos está en un archivo `farmacia.db`
- **Python moderno**: FastAPI es más rápido y fácil que Express
- **Documentación automática**: Swagger UI incluido
- **Type hints**: Mejor autocompletado y menos errores

## 🛠️ Instalación y Ejecución

```bash
# Entrar al directorio
cd backend_python

# Crear entorno virtual
python -m venv venv

# Activar (Windows)
venv\Scripts\activate

# Activar (Linux/Mac)
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
python main.py
```

El servidor iniciará en: **http://localhost:8000**

## 📖 Documentación API

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔗 Endpoints Disponibles

### Inventario
- `GET /api/pharmacy/{id}/inventory` - Consultar inventario
- `POST /api/inventory/update` - Actualizar inventario

### Turnos
- `POST /api/turns/request` - Solicitar turno
- `GET /api/pharmacy/{id}/turns` - Ver turnos del día
- `PUT /api/turns/{id}/status` - Actualizar estado

## 🔄 Configurar Frontend React

Para conectar el frontend con este backend:

1. **Actualizar proxy en client/package.json**:
```json
{
  "proxy": "http://localhost:8000"
}
```

2. **Iniciar backend Python** en puerto 8000
3. **Iniciar frontend React** normalmente

## 🎯 Características

- ✅ Base de datos SQLite (zero-config)
- ✅ API RESTful completa
- ✅ Validación automática con Pydantic
- ✅ Documentación Swagger integrada
- ✅ CORS configurado
- ✅ Manejo de errores
- ✅ Datos de ejemplo incluidos

## 📁 Estructura

```
backend_python/
├── main.py              # API principal
├── requirements.txt     # Dependencias Python
├── README.md           # Este archivo
└── farmacia.db         # Base de datos SQLite (se crea automáticamente)
```

## 🚀 Listo para usar

Sin necesidad de instalar MySQL. La base de datos SQLite se crea automáticamente con datos de ejemplo.
