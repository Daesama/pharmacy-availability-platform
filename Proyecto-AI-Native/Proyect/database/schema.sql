-- Base de datos FarmaciaConnect
-- Sistema inteligente de gestión de espera para farmacias de salud pública

CREATE DATABASE IF NOT EXISTS farmacia_connect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE farmacia_connect;

-- Tabla de farmacias
CREATE TABLE IF NOT EXISTS pharmacies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  daily_digital_turn_limit INT DEFAULT 100,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
);

-- Tabla de medicamentos
CREATE TABLE IF NOT EXISTS medications (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_category (category)
);

-- Tabla de inventario en tiempo real
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pharmacy_id INT NOT NULL,
  medication_code VARCHAR(50) NOT NULL,
  current_stock INT DEFAULT 0,
  min_threshold INT DEFAULT 10,
  max_stock INT DEFAULT 1000,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
  FOREIGN KEY (medication_code) REFERENCES medications(code) ON DELETE CASCADE,
  UNIQUE KEY unique_pharmacy_med (pharmacy_id, medication_code),
  INDEX idx_pharmacy_stock (pharmacy_id, current_stock),
  INDEX idx_medication_stock (medication_code, current_stock)
);

-- Tabla de transacciones de inventario (para auditoría)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pharmacy_id INT NOT NULL,
  medication_code VARCHAR(50) NOT NULL,
  transaction_type ENUM('dispensed', 'restocked', 'adjustment', 'expired') NOT NULL,
  quantity INT NOT NULL,
  batch_number VARCHAR(50),
  operator_id VARCHAR(50),
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
  FOREIGN KEY (medication_code) REFERENCES medications(code) ON DELETE CASCADE,
  INDEX idx_pharmacy_date (pharmacy_id, timestamp),
  INDEX idx_medication_date (medication_code, timestamp),
  INDEX idx_transaction_type (transaction_type)
);

-- Tabla de turnos
CREATE TABLE IF NOT EXISTS turns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pharmacy_id INT NOT NULL,
  user_id VARCHAR(50),
  user_name VARCHAR(100) NOT NULL,
  user_document VARCHAR(50) NOT NULL,
  turn_number INT NOT NULL,
  status ENUM('pending', 'called', 'attended', 'cancelled') DEFAULT 'pending',
  request_type ENUM('digital', 'physical') DEFAULT 'digital',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  called_at TIMESTAMP NULL,
  attended_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  notes TEXT,
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_pharmacy_date_turn (pharmacy_id, DATE(requested_at), turn_number),
  INDEX idx_pharmacy_status (pharmacy_id, status),
  INDEX idx_user_document (user_document),
  INDEX idx_turn_number (turn_number),
  INDEX idx_requested_at (requested_at)
);

-- Tabla de métricas de demanda
CREATE TABLE IF NOT EXISTS demand_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pharmacy_id INT NOT NULL,
  medication_code VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  request_count INT DEFAULT 0,
  dispensed_count INT DEFAULT 0,
  demand_score DECIMAL(3,1) DEFAULT 0.0,
  peak_hour INT,
  total_requests INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
  FOREIGN KEY (medication_code) REFERENCES medications(code) ON DELETE CASCADE,
  UNIQUE KEY unique_pharmacy_med_date (pharmacy_id, medication_code, date),
  INDEX idx_demand_score (demand_score),
  INDEX idx_date (date)
);

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS system_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de usuarios (opcional, para futuras funcionalidades)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  document VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_document (document),
  INDEX idx_email (email)
);

-- Insertar datos de ejemplo
INSERT IGNORE INTO pharmacies (id, name, address, phone, daily_digital_turn_limit) VALUES
(1, 'Farmacia Central EPS', 'Calle 50 #45-67, Bogotá, Colombia', '+57 1 2345678', 100),
(2, 'Farmacia IMSS Unidad 1', 'Av. Principal #123, Ciudad de México, México', '+52 55 87654321', 150),
(3, 'Farmacia Sur EPS', 'Carrera 30 #15-89, Medellín, Colombia', '+57 4 1234567', 80);

INSERT IGNORE INTO medications (code, name, description, category) VALUES
('MED001', 'Ibuprofeno 400mg', 'Analgésico y antiinflamatorio', 'Analgésicos'),
('MED002', 'Paracetamol 500mg', 'Analgésico y antipirético', 'Analgésicos'),
('MED003', 'Amoxicilina 500mg', 'Antibiótico de amplio espectro', 'Antibióticos'),
('MED004', 'Loratadina 10mg', 'Antihistamínico', 'Antialérgicos'),
('MED005', 'Omeprazol 20mg', 'Inhibidor de bomba de protones', 'Gastroenterología'),
('MED006', 'Enalapril 10mg', 'Antihipertensivo IECA', 'Cardiovascular'),
('MED007', 'Metformina 850mg', 'Antidiabético oral', 'Diabetes'),
('MED008', 'Salbutamol 100mcg', 'Broncodilatador', 'Respiratorio'),
('MED009', 'Dexametasona 4mg', 'Corticosteroide', 'Corticosteroides'),
('MED010', 'Vitamina D3 1000UI', 'Suplemento vitamínico', 'Vitaminas');

-- Insertar inventario inicial
INSERT IGNORE INTO inventory (pharmacy_id, medication_code, current_stock, min_threshold) VALUES
(1, 'MED001', 150, 20),
(1, 'MED002', 200, 30),
(1, 'MED003', 80, 15),
(1, 'MED004', 120, 25),
(1, 'MED005', 90, 18),
(2, 'MED001', 200, 25),
(2, 'MED002', 180, 28),
(2, 'MED003', 100, 20),
(2, 'MED006', 75, 12),
(2, 'MED007', 110, 22),
(3, 'MED001', 120, 18),
(3, 'MED002', 150, 25),
(3, 'MED008', 60, 10),
(3, 'MED009', 40, 8),
(3, 'MED010', 200, 35);

-- Configuración del sistema
INSERT IGNORE INTO system_config (config_key, config_value, description) VALUES
('max_daily_digital_turns', '100', 'Límite máximo diario de turnos digitales por farmacia'),
('turn_call_interval', '5', 'Intervalo en minutos entre llamados de turnos'),
('low_stock_threshold', '20', 'Porcentaje mínimo de stock considerado bajo'),
('demand_score_increment', '0.1', 'Incremento del score de demanda por dispensación'),
('max_demand_score', '10.0', 'Score máximo de demanda posible');

-- Crear vista para consultas frecuentes
CREATE OR REPLACE VIEW pharmacy_inventory_status AS
SELECT 
  p.id as pharmacy_id,
  p.name as pharmacy_name,
  m.code as medication_code,
  m.name as medication_name,
  i.current_stock,
  i.min_threshold,
  CASE 
    WHEN i.current_stock = 0 THEN 'out_of_stock'
    WHEN i.current_stock <= i.min_threshold THEN 'low_stock'
    ELSE 'available'
  END as status,
  COALESCE(dm.demand_score, 0) as demand_score,
  i.last_updated
FROM pharmacies p
JOIN inventory i ON p.id = i.pharmacy_id
JOIN medications m ON i.medication_code = m.code
LEFT JOIN demand_metrics dm ON i.pharmacy_id = dm.pharmacy_id 
  AND i.medication_code = dm.medication_code 
  AND dm.date = CURDATE()
WHERE p.status = 'active';

-- Crear vista para estadísticas de turnos
CREATE OR REPLACE VIEW daily_turn_statistics AS
SELECT 
  p.id as pharmacy_id,
  p.name as pharmacy_name,
  DATE(t.requested_at) as date,
  COUNT(*) as total_turns,
  SUM(CASE WHEN t.request_type = 'digital' THEN 1 ELSE 0 END) as digital_turns,
  SUM(CASE WHEN t.request_type = 'physical' THEN 1 ELSE 0 END) as physical_turns,
  SUM(CASE WHEN t.status = 'attended' THEN 1 ELSE 0 END) as attended_turns,
  AVG(TIMESTAMPDIFF(MINUTE, t.requested_at, t.attended_at)) as avg_wait_time_minutes
FROM pharmacies p
LEFT JOIN turns t ON p.id = t.pharmacy_id
WHERE DATE(t.requested_at) = CURDATE() OR t.requested_at IS NULL
GROUP BY p.id, p.name, DATE(t.requested_at);
