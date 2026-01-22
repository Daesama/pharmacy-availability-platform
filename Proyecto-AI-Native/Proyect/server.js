const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'farmacia_connect'
};

let db;

// Conexión a la base de datos
async function initializeDatabase() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Conectado a la base de datos MySQL');
    
    // Crear tablas si no existen
    await createTables();
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  }
}

// Crear estructura de tablas
async function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS pharmacies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      address TEXT,
      phone VARCHAR(20),
      daily_digital_turn_limit INT DEFAULT 100,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS medications (
      code VARCHAR(50) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS inventory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pharmacy_id INT,
      medication_code VARCHAR(50),
      current_stock INT DEFAULT 0,
      min_threshold INT DEFAULT 10,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id),
      FOREIGN KEY (medication_code) REFERENCES medications(code),
      UNIQUE KEY unique_pharmacy_med (pharmacy_id, medication_code)
    )`,
    
    `CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pharmacy_id INT,
      medication_code VARCHAR(50),
      transaction_type ENUM('dispensed', 'restocked', 'adjustment'),
      quantity INT NOT NULL,
      batch_number VARCHAR(50),
      operator_id VARCHAR(50),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id),
      FOREIGN KEY (medication_code) REFERENCES medications(code)
    )`,
    
    `CREATE TABLE IF NOT EXISTS turns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pharmacy_id INT,
      user_id VARCHAR(50),
      user_name VARCHAR(100),
      user_document VARCHAR(50),
      turn_number INT,
      status ENUM('pending', 'called', 'attended', 'cancelled') DEFAULT 'pending',
      request_type ENUM('digital', 'physical') DEFAULT 'digital',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      called_at TIMESTAMP NULL,
      attended_at TIMESTAMP NULL,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS demand_metrics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pharmacy_id INT,
      medication_code VARCHAR(50),
      date DATE,
      request_count INT DEFAULT 0,
      dispensed_count INT DEFAULT 0,
      demand_score DECIMAL(3,1) DEFAULT 0.0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id),
      FOREIGN KEY (medication_code) REFERENCES medications(code),
      UNIQUE KEY unique_pharmacy_med_date (pharmacy_id, medication_code, date)
    )`
  ];

  for (const table of tables) {
    try {
      await db.execute(table);
    } catch (error) {
      console.error('Error al crear tabla:', error);
    }
  }
}

// Socket.IO para actualizaciones en tiempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('join_pharmacy', (pharmacyId) => {
    socket.join(`pharmacy_${pharmacyId}`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// API Routes

// 1. Disponibilidad de medicamentos
app.get('/api/pharmacy/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [inventory] = await db.execute(`
      SELECT 
        m.code,
        m.name,
        i.current_stock,
        i.min_threshold,
        CASE 
          WHEN i.current_stock = 0 THEN 'out_of_stock'
          WHEN i.current_stock <= i.min_threshold THEN 'low_stock'
          ELSE 'available'
        END as status,
        COALESCE(dm.demand_score, 0) as demand_score,
        i.last_updated
      FROM inventory i
      JOIN medications m ON i.medication_code = m.code
      LEFT JOIN demand_metrics dm ON i.pharmacy_id = dm.pharmacy_id 
        AND i.medication_code = dm.medication_code 
        AND dm.date = CURDATE()
      WHERE i.pharmacy_id = ?
      ORDER BY m.name
    `, [id]);

    res.json({ medications: inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualización de inventario por escaneo
app.post('/api/inventory/update', async (req, res) => {
  try {
    const { pharmacy_id, scan_code, quantity_dispensed, batch_number, operator_id } = req.body;
    
    // Iniciar transacción
    await db.beginTransaction();
    
    // Actualizar inventario
    await db.execute(`
      UPDATE inventory 
      SET current_stock = current_stock - ?,
          last_updated = CURRENT_TIMESTAMP
      WHERE pharmacy_id = ? AND medication_code = ? AND current_stock >= ?
    `, [quantity_dispensed, pharmacy_id, scan_code, quantity_dispensed]);
    
    // Registrar transacción
    await db.execute(`
      INSERT INTO inventory_transactions 
      (pharmacy_id, medication_code, transaction_type, quantity, batch_number, operator_id)
      VALUES (?, ?, 'dispensed', ?, ?, ?)
    `, [pharmacy_id, scan_code, quantity_dispensed, batch_number, operator_id]);
    
    // Actualizar métricas de demanda
    await db.execute(`
      INSERT INTO demand_metrics (pharmacy_id, medication_code, date, dispensed_count, demand_score)
      VALUES (?, ?, CURDATE(), 1, 1.0)
      ON DUPLICATE KEY UPDATE 
        dispensed_count = dispensed_count + 1,
        demand_score = LEAST(10.0, demand_score + 0.1)
    `, [pharmacy_id, scan_code]);
    
    await db.commit();
    
    // Emitir actualización en tiempo real
    io.to(`pharmacy_${pharmacy_id}`).emit('inventory_updated', {
      medication_code: scan_code,
      pharmacy_id
    });
    
    res.json({ success: true });
  } catch (error) {
    await db.rollback();
    res.status(500).json({ error: error.message });
  }
});

// 2. Sistema de turnos digitales
app.post('/api/turns/request', async (req, res) => {
  try {
    const { pharmacy_id, user_id, user_name, user_document } = req.body;
    
    // Verificar límite diario de turnos digitales
    const [turnCount] = await db.execute(`
      SELECT COUNT(*) as count
      FROM turns 
      WHERE pharmacy_id = ? 
        AND request_type = 'digital' 
        AND DATE(requested_at) = CURDATE()
    `, [pharmacy_id]);
    
    const [pharmacy] = await db.execute(`
      SELECT daily_digital_turn_limit FROM pharmacies WHERE id = ?
    `, [pharmacy_id]);
    
    if (turnCount[0].count >= pharmacy[0].daily_digital_turn_limit) {
      return res.status(400).json({ 
        error: 'Límite diario de turnos digitales alcanzado' 
      });
    }
    
    // Generar número de turno
    const [lastTurn] = await db.execute(`
      SELECT MAX(turn_number) as last_number 
      FROM turns 
      WHERE pharmacy_id = ? AND DATE(requested_at) = CURDATE()
    `, [pharmacy_id]);
    
    const turnNumber = (lastTurn[0].last_number || 0) + 1;
    
    // Crear turno
    const [result] = await db.execute(`
      INSERT INTO turns (pharmacy_id, user_id, user_name, user_document, turn_number, request_type)
      VALUES (?, ?, ?, ?, ?, 'digital')
    `, [pharmacy_id, user_id, user_name, user_document, turnNumber]);
    
    // Emitir nuevo turno en tiempo real
    io.to(`pharmacy_${pharmacy_id}`).emit('new_turn', {
      id: result.insertId,
      turn_number: turnNumber,
      user_name,
      status: 'pending'
    });
    
    res.json({ 
      success: true, 
      turn_id: result.insertId, 
      turn_number: turnNumber 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Visualización remota de turnos en tiempo real
app.get('/api/pharmacy/:id/turns', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [turns] = await db.execute(`
      SELECT 
        id,
        turn_number,
        user_name,
        status,
        requested_at,
        called_at,
        attended_at
      FROM turns 
      WHERE pharmacy_id = ? AND DATE(requested_at) = CURDATE()
      ORDER BY 
        CASE WHEN status = 'pending' THEN turn_number END ASC,
        CASE WHEN status IN ('called', 'attended', 'cancelled') THEN called_at END DESC
    `, [id]);
    
    res.json({ turns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de turno (para farmacia)
app.put('/api/turns/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updateFields = { status };
    if (status === 'called') {
      updateFields.called_at = new Date();
    } else if (status === 'attended') {
      updateFields.attended_at = new Date();
    }
    
    await db.execute(`
      UPDATE turns 
      SET status = ?, 
          called_at = COALESCE(?, called_at),
          attended_at = COALESCE(?, attended_at)
      WHERE id = ?
    `, [status, updateFields.called_at || null, updateFields.attended_at || null, id]);
    
    // Emitir actualización en tiempo real
    const [turn] = await db.execute(`
      SELECT pharmacy_id, turn_number, user_name, status 
      FROM turns WHERE id = ?
    `, [id]);
    
    if (turn.length > 0) {
      io.to(`pharmacy_${turn[0].pharmacy_id}`).emit('turn_updated', turn[0]);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicializar servidor
const PORT = process.env.PORT || 3001;

initializeDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
});
