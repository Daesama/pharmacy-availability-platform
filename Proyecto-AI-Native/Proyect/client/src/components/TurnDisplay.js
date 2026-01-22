import React, { useState, useEffect } from 'react';
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
  Alert,
  IconButton,
  Tooltip,
  Button,
  Grid,
  LinearProgress,
  Switch,
  FormControlLabel,
  Badge,
  Fade,
  Zoom,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
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
      const response = await axios.get(`/api/pharmacy/${id}/turns`);
      const turnsData = response.data.turns;
      setTurns(turnsData);
      calculateStatistics(turnsData);
      setLastUpdate(new Date());
      setError('');
    } catch (err) {
      setError('Error al cargar los turnos. Por favor intente nuevamente.');
      console.error('Error fetching turns:', err);
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
    const calledTurn = turns.find(t => t.status === 'called');
    return calledTurn ? calledTurn.turn_number : '-';
  };

  const getNextTurns = () => {
    return turns.filter(t => t.status === 'pending').slice(0, 5);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} />
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
    const response = await axios.get(`/api/pharmacy/${id}/turns`);
    const turnsData = response.data.turns;
    setTurns(turnsData);
    calculateStatistics(turnsData);
    setLastUpdate(new Date());
    setError('');
  } catch (err) {
    setError('Error al cargar los turnos. Por favor intente nuevamente.');
    console.error('Error fetching turns:', err);
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
  const calledTurn = turns.find(t => t.status === 'called');
  return calledTurn ? calledTurn.turn_number : '-';
};

const getNextTurns = () => {
  return turns.filter(t => t.status === 'pending').slice(0, 5);
};

const filteredTurns = filterStatus === 'all' 
  ? turns 
  : turns.filter(t => t.status === filterStatus);

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
  <Grid item xs={12} sm={6} md={3}>
    <Card sx={{ backgroundColor: 'primary.main', color: 'white' }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="h2" component="div">
          {getCurrentTurn() || '-'}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {getNextTurns().map((turn) => (
              <Chip
                key={turn.id}
                label={`#${turn.turn_number}`}
                color="warning"
                variant="outlined"
                size="medium"
              />
            ))}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {getNextTurns().map((turn) => (
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
      )}

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
                  <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {turns.map((turn) => (
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
                    <TableCell>
                      <Chip
                        label={turn.request_type === 'digital' ? 'Digital' : 'Presencial'}
                        variant="outlined"
                        size="small"
                        color={turn.request_type === 'digital' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {turns.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No hay turnos registrados para hoy
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={() => navigate(`/pharmacy/${id}/turn-request`)}
        >
          Solicitar Turno
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate(`/pharmacy/${id}/inventory`)}
        >
          Ver Inventario
        </Button>
      </Box>
    </Container>
  );
};

export default TurnDisplay;
