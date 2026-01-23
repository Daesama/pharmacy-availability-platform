import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  TextField,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
  Fade
} from '@mui/material';
import { 
  Search, 
  LocalPharmacy, 
  TrendingUp, 
  Warning,
  FilterList,
  Sort,
  ViewList,
  ViewModule,
  Download,
  Refresh
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';

const Inventory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const { socket, joinPharmacy } = useSocket();
  
  const [medications, setMedications] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/pharmacy/${id}/inventory`);
      
      // Validar que response.data.medications exista y sea un array
      const medicationsData = response.data?.medications || [];
      setMedications(medicationsData);
      setFilteredMedications(medicationsData);
      setLastUpdate(new Date());
      setError('');
    } catch (err) {
      setError('Error al cargar el inventario. Por favor intente nuevamente.');
      console.error('Error fetching inventory:', err);
      // En caso de error, establecer arrays vacíos
      setMedications([]);
      setFilteredMedications([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    joinPharmacy(id);
  }, [id, joinPharmacy]);

  useEffect(() => {
    if (socket) {
      socket.on('inventory_updated', (data) => {
        if (data.pharmacy_id === parseInt(id)) {
          fetchInventory();
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('inventory_updated');
      }
    };
  }, [socket, id, fetchInventory]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    // Validar que medications sea un array antes de filtrar
    if (!Array.isArray(medications)) {
      setFilteredMedications([]);
      return;
    }

    let filtered = medications.filter(med => {
      const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           med.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || med.status === filterStatus;
      return matchesSearch && matchesFilter;
    });

    // Sort filtered medications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return b.current_stock - a.current_stock;
        case 'demand':
          return b.demand_score - a.demand_score;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredMedications(filtered);
  }, [medications, searchTerm, filterStatus, sortBy]);

  const exportToCSV = () => {
    const headers = ['Código', 'Nombre', 'Stock Actual', 'Stock Mínimo', 'Estado', 'Demanda'];
    const csvContent = [
      headers.join(','),
      ...filteredMedications.map(med => [
        med.code,
        `"${med.name}"`,
        med.current_stock,
        med.min_threshold,
        getStatusText(med.status),
        med.demand_score
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_farmacia_${id}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'low_stock': return 'Stock Bajo';
      case 'out_of_stock': return 'Agotado';
      default: return 'Desconocido';
    }
  };

  const getDemandColor = (score) => {
    if (score >= 7) return 'error';
    if (score >= 4) return 'warning';
    return 'success';
  };

  const getStockPercentage = (current, min) => {
    if (min === 0) return 100;
    return Math.min(100, (current / min) * 100);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <LocalPharmacy sx={{ mr: 2, verticalAlign: 'middle' }} />
          Inventario de Medicamentos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Consulta la disponibilidad en tiempo real de medicamentos en esta farmacia
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar medicamentos por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Filtrar por Estado</InputLabel>
              <Select
                value={filterStatus}
                label="Filtrar por Estado"
                onChange={(e) => setFilterStatus(e.target.value)}
                startAdornment={<FilterList sx={{ mr: 1 }} />}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="available">Disponibles</MenuItem>
                <MenuItem value="low_stock">Stock Bajo</MenuItem>
                <MenuItem value="out_of_stock">Agotados</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={sortBy}
                label="Ordenar por"
                onChange={(e) => setSortBy(e.target.value)}
                startAdornment={<Sort sx={{ mr: 1 }} />}
              >
                <MenuItem value="name">Nombre</MenuItem>
                <MenuItem value="stock">Stock</MenuItem>
                <MenuItem value="demand">Demanda</MenuItem>
                <MenuItem value="status">Estado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="grid">
                  <ViewModule />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Tooltip title="Exportar a CSV">
                <IconButton onClick={exportToCSV} color="primary">
                  <Download />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Actualizar">
                <IconButton onClick={fetchInventory} color="primary">
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Mostrando {filteredMedications.length} de {medications.length} medicamentos
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Última actualización: {lastUpdate.toLocaleTimeString()}
        </Typography>
      </Box>

      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {filteredMedications.map((medication) => (
            <Grid item xs={12} sm={6} md={4} key={medication.code}>
              <Fade in timeout={300}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                        {medication.name}
                      </Typography>
                      <Badge badgeContent={medication.current_stock} color={getStatusColor(medication.status)}>
                        <Chip
                          label={getStatusText(medication.status)}
                          color={getStatusColor(medication.status)}
                          size="small"
                        />
                      </Badge>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Código: {medication.code}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Unidades disponibles: <strong>{medication.current_stock}</strong>
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={getStockPercentage(medication.current_stock, medication.min_threshold)}
                        color={medication.current_stock === 0 ? 'error' : 
                               medication.current_stock <= medication.min_threshold ? 'warning' : 'success'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <TrendingUp sx={{ mr: 1, fontSize: 20 }} />
                      <Typography variant="body2">
                        Demanda: 
                        <Chip
                          label={medication.demand_score.toFixed(1)}
                          color={getDemandColor(medication.demand_score)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Box>

                    {medication.current_stock <= medication.min_threshold && medication.current_stock > 0 && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Warning sx={{ mr: 1 }} />
                          stock bajo
                        </Box>
                      </Alert>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      Última actualización: {new Date(medication.last_updated).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Demanda</TableCell>
                <TableCell>Última Actualización</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMedications.map((medication) => (
                <TableRow key={medication.code}>
                  <TableCell>{medication.code}</TableCell>
                  <TableCell>{medication.name}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{medication.current_stock}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={getStockPercentage(medication.current_stock, medication.min_threshold)}
                        color={medication.current_stock === 0 ? 'error' : 
                               medication.current_stock <= medication.min_threshold ? 'warning' : 'success'}
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(medication.status)}
                      color={getStatusColor(medication.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={medication.demand_score.toFixed(1)}
                      color={getDemandColor(medication.demand_score)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(medication.last_updated).toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {filteredMedications.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'No se encontraron medicamentos que coincidan con la búsqueda' : 'No hay medicamentos disponibles en esta farmacia'}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <button
          onClick={() => navigate(`/pharmacy/${id}/turn-request`)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Solicitar Turno
        </button>
        <button
          onClick={() => navigate(`/pharmacy/${id}/turns`)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2e7d32',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Ver Turnos en Vivo
        </button>
      </Box>
    </Container>
  );
};

export default Inventory;
