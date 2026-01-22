# FarmaciaConnect

Sistema inteligente de gestión de espera para farmacias de salud pública en Latinoamérica.

## 🎯 Problema Resuelto

Reduce el tiempo perdido, incertidumbre y congestión en la entrega de medicamentos en sistemas públicos de salud (EPS Colombia, IMSS México) utilizando inteligencia artificial sin violar normativas de salud ni requerir acceso directo a sistemas gubernamentales.

## ✨ Funcionalidades Principales

### 1. 📊 Disponibilidad de Medicamentos en Tiempo Real
- Consulta de inventario actualizado por farmacia
- Visualización de unidades disponibles
- Sistema de actualización automática por escaneo
- Métricas de demanda por medicamento

### 2. 🎫 Sistema de Turnos Digitales
- Solicita turnos desde cualquier lugar
- Límite diario para garantizar equidad con usuarios presenciales
- Notificaciones en tiempo real
- Seguimiento del estado del turno

### 3. 📺 Visualización Remota de Turnos
- Monitorea el avance de turnos desde tu celular
- Tiempos de espera estimados
- Información en tiempo real sin estar físicamente en la farmacia

## 🏗️ Arquitectura

### Backend (Node.js + Express)
- **API RESTful** para gestión de inventario y turnos
- **Socket.IO** para actualizaciones en tiempo real
- **MySQL** para persistencia de datos
- **WebSocket** para comunicación bidireccional

### Frontend (React + Material-UI)
- Interfaz moderna y responsiva
- Actualizaciones en tiempo real
- Dashboard interactivo
- Experiencia de usuario optimizada

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 16+
- MySQL 8.0+
- npm o yarn

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd farmacia-connect
```

2. **Configurar base de datos**
```bash
mysql -u root -p < database/schema.sql
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales de base de datos
```

4. **Instalar dependencias**
```bash
# Backend
npm install

# Frontend
cd client
npm install
cd ..
```

5. **Iniciar aplicación**
```bash
# Modo desarrollo
npm run dev

# O iniciar por separado
npm start  # Backend en puerto 3001
npm run client  # Frontend en puerto 3000
```

## 📁 Estructura del Proyecto

```
farmacia-connect/
├── server.js                 # Servidor principal
├── package.json              # Dependencias backend
├── database/
│   └── schema.sql           # Esquema de base de datos
├── client/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   │   ├── Inventory.js
│   │   │   ├── TurnRequest.js
│   │   │   ├── TurnDisplay.js
│   │   │   ├── PharmacyList.js
│   │   │   └── Navbar.js
│   │   ├── contexts/        # Contextos React
│   │   │   └── SocketContext.js
│   │   ├── App.js          # Componente principal
│   │   └── index.js        # Punto de entrada
│   └── package.json        # Dependencias frontend
└── README.md
```

## 🔧 Configuración

### Variables de Entorno
```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=farmacia_connect

# Servidor
PORT=3001

# JWT
JWT_SECRET=tu_secreto_jwt
```

## 📊 API Endpoints

### Inventario
- `GET /api/pharmacy/:id/inventory` - Consultar inventario
- `POST /api/inventory/update` - Actualizar inventario por escaneo

### Turnos
- `POST /api/turns/request` - Solicitar turno digital
- `GET /api/pharmacy/:id/turns` - Ver turnos en tiempo real
- `PUT /api/turns/:id/status` - Actualizar estado de turno

## 🔄 WebSocket Events

### Cliente → Servidor
- `join_pharmacy` - Unirse a canal de farmacia

### Servidor → Cliente
- `inventory_updated` - Actualización de inventario
- `new_turn` - Nuevo turno creado
- `turn_updated` - Estado de turno actualizado

## 🎨 Características Técnicas

### Base de Datos
- **Transacciones ACID** para integridad de datos
- **Índices optimizados** para consultas rápidas
- **Vistas predefinidas** para estadísticas
- **Auditoría completa** de transacciones

### Seguridad
- **Validación de inputs** en todos los endpoints
- **Sanitización de datos** para prevenir SQL injection
- **CORS configurado** para producción
- **Rate limiting** para prevenir abusos

### Performance
- **Conexión persistente** con WebSocket
- **Caching inteligente** de consultas frecuentes
- **Lazy loading** de componentes React
- **Optimización de queries** SQL

## 🌐 Despliegue

### Producción
```bash
# Construir frontend
cd client && npm run build

# Iniciar servidor en producción
NODE_ENV=production npm start
```

### Docker (Opcional)
```bash
docker build -t farmacia-connect .
docker run -p 3001:3001 farmacia-connect
```

## 📱 Funcionalidades Futuras

- [ ] Autenticación de usuarios
- [ ] Notificaciones push
- [ ] Predicción de demanda con IA
- [ ] Integración con sistemas de facturación
- [ ] Reportes analíticos avanzados
- [ ] App móvil nativa

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/amazing-feature`)
3. Commit de cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Contacto

- **Email**: info@farmaciaconnect.com
- **Web**: www.farmaciaconnect.com
- **Soporte**: soporte@farmaciaconnect.com

---

**FarmaciaConnect** - Transformando la experiencia en farmacias de salud pública 🏥💊
