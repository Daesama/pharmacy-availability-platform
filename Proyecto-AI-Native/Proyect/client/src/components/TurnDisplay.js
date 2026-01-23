import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  LinearProgress,
  Badge,
  Fade,
  Zoom,
  Divider,
  CardActions,
  Avatar
} from '@mui/material';
import { 
  Refresh, 
  Visibility, 
  LocalHospital, 
  AccessTime,
  CheckCircle,
  Pending,
  Cancel,
  Settings,
  Fullscreen,
  VolumeUp,
  NotificationsActive,
  TrendingUp,
  People,
  Schedule
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';

const TurnDisplay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, joinPharmacy } = useSocket();
  
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [filterStatus, setFilterStatus] = useState('all');
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    called: 0,
    attended: 0,
    cancelled: 0,
    avgWaitTime: 0,
    digitalTurns: 0,
    physicalTurns: 0
  });

  useEffect(() => {
    joinPharmacy(id);
  }, [id, joinPharmacy]);

  useEffect(() => {
    if (socket) {
      socket.on('new_turn', (data) => {
        if (data.pharmacy_id === parseInt(id)) {
          fetchTurns();
          playNotificationSound();
        }
      });

      socket.on('turn_updated', (data) => {
        if (data.pharmacy_id === parseInt(id)) {
          fetchTurns();
          if (data.status === 'called') {
            playNotificationSound();
          }
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('new_turn');
        socket.off('turn_updated');
      }
    };
  }, [socket, id]);

  useEffect(() => {
    fetchTurns();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchTurns, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id, autoRefresh, refreshInterval]);

  const calculateStatistics = (turnsData) => {
    const stats = {
      total: turnsData.length,
      pending: turnsData.filter(t => t.status === 'pending').length,
      called: turnsData.filter(t => t.status === 'called').length,
      attended: turnsData.filter(t => t.status === 'attended').length,
      cancelled: turnsData.filter(t => t.status === 'cancelled').length,
      digitalTurns: turnsData.filter(t => t.request_type === 'digital').length,
      physicalTurns: turnsData.filter(t => t.request_type === 'physical').length
    };
    
    // Calcular tiempo promedio de espera
    const attendedTurns = turnsData.filter(t => t.status === 'attended' && t.requested_at && t.attended_at);
    if (attendedTurns.length > 0) {
      const totalWaitTime = attendedTurns.reduce((sum, turn) => {
        const waitTime = new Date(turn.attended_at) - new Date(turn.requested_at);
        return sum + waitTime;
      }, 0);
      stats.avgWaitTime = Math.round(totalWaitTime / attendedTurns.length / 60000); // Convertir a minutos
    }
    
    setStatistics(stats);
  };

  const playNotificationSound = () => {
    if (soundEnabled) {
      // Crear un sonido simple de notificación
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator(440, 'sine');
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreenMode(true);
    } else {
      document.exitFullscreen();
      setFullscreenMode(false);
    }
  };

  const fetchTurns = async () => {
    try {
      // Simulación de datos para demostración
      const simulatedTurns = [
        {
          id: 1,
          turn_number: 'A001',
          user_name: 'Juan Pérez',
          status: 'called',
          request_type: 'digital',
          requested_at: '2026-01-23T13:20:00',
          called_at: '2026-01-23T13:35:00',
          attended_at: null
        },
        {
          id: 2,
          turn_number: 'A002',
          user_name: 'María García',
          status: 'pending',
          request_type: 'physical',
          requested_at: '2026-01-23T13:30:00',
          called_at: null,
          attended_at: null
        },
        {
          id: 3,
          turn_number: 'A003',
          user_name: 'Carlos Rodríguez',
          status: 'pending',
          request_type: 'digital',
          requested_at: '2026-01-23T13:32:00',
          called_at: null,
          attended_at: null
        },
        {
          id: 4,
          turn_number: 'A004',
          user_name: 'Ana Martínez',
          status: 'attended',
          request_type: 'physical',
          requested_at: '2026-01-23T13:00:00',
          called_at: '2026-01-23T13:10:00',
          attended_at: '2026-01-23T13:25:00'
        },
        {
          id: 5,
          turn_number: 'A005',
          user_name: 'Luis Sánchez',
          status: 'pending',
          request_type: 'digital',
          requested_at: '2026-01-23T13:38:00',
          called_at: null,
          attended_at: null
        },
        {
          id: 6,
          turn_number: 'A006',
          user_name: 'Sofía López',
          status: 'cancelled',
          request_type: 'physical',
          requested_at: '2026-01-23T12:45:00',
          called_at: null,
          attended_at: null
        },
        {
          id: 7,
          turn_number: 'A007',
          user_name: 'Roberto Díaz',
          status: 'pending',
          request_type: 'digital',
          requested_at: '2026-01-23T13:40:00',
          called_at: null,
          attended_at: null
        },
        {
          id: 8,
          turn_number: 'A008',
          user_name: 'Carmen Torres',
          status: 'attended',
          request_type: 'physical',
          requested_at: '2026-01-23T12:30:00',
          called_at: '2026-01-23T12:40:00',
          attended_at: '2026-01-23T13:00:00'
        }
      ];

      // Comentamos la llamada real al API para usar datos simulados
      // const response = await axios.get(`/api/pharmacy/${id}/turns`);
      // const turnsData = response.data?.turns || [];
      
      const turnsData = simulatedTurns;
      setTurns(turnsData);
      calculateStatistics(turnsData);
      setLastUpdate(new Date());
      setError('');
    } catch (err) {
      setError('Error al cargar los turnos. Por favor intente nuevamente.');
      console.error('Error fetching turns:', err);
      setTurns([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'called': return 'info';
      case 'attended': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'called': return 'Llamado';
      case 'attended': return 'Atendido';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Pending />;
      case 'called': return <Visibility />;
      case 'attended': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      default: return null;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWaitingTime = (requestedAt, status) => {
    if (status !== 'pending' || !requestedAt) return '-';
    
    const now = new Date();
    const requested = new Date(requestedAt);
    const diffMinutes = Math.floor((now - requested) / (1000 * 60));
    
    return `${diffMinutes} min`;
  };

  const getCurrentTurn = () => {
    if (!turns || !Array.isArray(turns)) return '-';
    const calledTurn = turns.find(t => t.status === 'called');
    return calledTurn ? calledTurn.turn_number : '-';
  };

  const getNextTurns = () => {
    if (!turns || !Array.isArray(turns)) return [];
    return turns.filter(t => t.status === 'pending').slice(0, 5);
  };

  const filteredTurns = filterStatus === 'all' 
    ? (turns || [])
    : (turns || []).filter(t => t.status === filterStatus);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <LocalHospital sx={{ mr: 2, verticalAlign: 'middle' }} />
            Turnos en Tiempo Real
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitorea el avance de turnos desde cualquier lugar
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <Tooltip title="Actualizar">
            <IconButton onClick={fetchTurns} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Pantalla completa">
            <IconButton onClick={toggleFullscreen} color="primary">
              <Fullscreen />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Panel de Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: 'primary.main', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h2" component="div">
                {getCurrentTurn() || '-'}
              </Typography>
              <Typography variant="body2">
                Turno Actual
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: 'warning.main', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h2" component="div">
                {statistics.pending}
              </Typography>
              <Typography variant="body2">
                Turnos Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: 'success.main', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h2" component="div">
                {statistics.attended}
              </Typography>
              <Typography variant="body2">
                Turnos Atendidos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: 'info.main', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h2" component="div">
                {statistics.avgWaitTime || 0}
              </Typography>
              <Typography variant="body2">
                Tiempo Promedio (min)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controles */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
        {/* Primera fila - Switches */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  color="primary"
                />
              }
              label="Actualización automática"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label="Sonido de notificación"
            />
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2">Intervalo:</Typography>
              <ToggleButtonGroup
                value={refreshInterval}
                exclusive
                onChange={(e, newInterval) => newInterval && setRefreshInterval(newInterval)}
                size="small"
              >
                <ToggleButton value={3000}>3s</ToggleButton>
                <ToggleButton value={5000}>5s</ToggleButton>
                <ToggleButton value={10000}>10s</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
        
        {/* Segunda fila - Botones de filtro y vista con más espacio */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ minWidth: 40 }}>Filtro:</Typography>
              <ToggleButtonGroup
                value={filterStatus}
                exclusive
                onChange={(e, newStatus) => newStatus && setFilterStatus(newStatus)}
                size="small"
                sx={{ flexWrap: 'wrap' }}
              >
                <ToggleButton value="all">Todos</ToggleButton>
                <ToggleButton value="pending">Pendientes</ToggleButton>
                <ToggleButton value="called">Llamados</ToggleButton>
                <ToggleButton value="attended">Atendidos</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
          <Grid item xs={12} sm={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ minWidth: 40 }}>Vista:</Typography>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="table">Tabla</ToggleButton>
                <ToggleButton value="cards">Tarjetas</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Próximos Turnos */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Próximos Turnos
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {(getNextTurns() || []).map((turn) => (
              <Chip
                key={turn.id}
                label={`#${turn.turn_number}`}
                color="warning"
                variant="outlined"
                size="medium"
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Tabla de Turnos Completa */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Lista Completa de Turnos
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Turno #</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Hora Solicitud</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Hora Llamado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tiempo Espera</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(filteredTurns || []).map((turn) => (
                  <TableRow 
                    key={turn.id}
                    sx={{
                      backgroundColor: turn.status === 'called' ? 'action.hover' : 'inherit',
                      '&:hover': {
                        backgroundColor: 'action.selected'
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        #{turn.turn_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{turn.user_name}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(turn.status)}
                        label={getStatusText(turn.status)}
                        color={getStatusColor(turn.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime sx={{ fontSize: 16 }} />
                        {formatTime(turn.requested_at)}
                      </Box>
                    </TableCell>
                    <TableCell>{formatTime(turn.called_at)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getWaitingTime(turn.requested_at, turn.status)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {!filteredTurns || filteredTurns.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No hay turnos registrados para hoy
          </Typography>
        </Box>
      ) : null}
    </Container>
  );
};

export default TurnDisplay;
