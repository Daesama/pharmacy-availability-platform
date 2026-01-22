import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Paper,
  LinearProgress,
  Avatar,
  Rating,
  IconButton,
  Tooltip,
  Fade,
  Tabs,
  Tab,
  CardActions,
  Alert
} from '@mui/material';
import { 
  Search, 
  LocalPharmacy, 
  LocationOn, 
  Phone, 
  AccessTime,
  TrendingUp,
  People,
  Star,
  Info,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';

// Datos de ejemplo - en producción vendrían de una API
const pharmaciesData = [
  {
    id: 1,
    name: 'Farmacia Central EPS',
    address: 'Calle 50 #45-67, Bogotá, Colombia',
    phone: '+57 1 2345678',
    daily_digital_turn_limit: 100,
    status: 'active',
    rating: 4.5,
    total_turns_today: 45,
    avg_wait_time: 15,
    services: ['Inventario', 'Turnos Digitales', 'Urgencias']
  },
  {
    id: 2,
    name: 'Farmacia IMSS Unidad 1',
    address: 'Av. Principal #123, Ciudad de México, México',
    phone: '+52 55 87654321',
    daily_digital_turn_limit: 150,
    status: 'active',
    rating: 4.2,
    total_turns_today: 62,
    avg_wait_time: 12,
    services: ['Inventario', 'Turnos Digitales', 'Consulta Externa']
  },
  {
    id: 3,
    name: 'Farmacia Sur EPS',
    address: 'Carrera 30 #15-89, Medellín, Colombia',
    phone: '+57 4 1234567',
    daily_digital_turn_limit: 80,
    status: 'active',
    rating: 4.8,
    total_turns_today: 38,
    avg_wait_time: 18,
    services: ['Inventario', 'Turnos Digitales', 'Vacunación']
  }
];

const PharmacyList = () => {
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState(pharmaciesData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ show: false, type: '', message: '' });

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pharmacy.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePharmacyClick = (pharmacyId) => {
    navigate(`/pharmacy/${pharmacyId}/inventory`);
  };

  const handleTurnRequest = (pharmacyId) => {
    navigate(`/pharmacy/${pharmacyId}/turn-request`);
  };

  const handleTurnDisplay = (pharmacyId) => {
    navigate(`/pharmacy/${pharmacyId}/turns`);
  };

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message });
    setTimeout(() => setFeedback({ show: false, type: '', message: '' }), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'inactive': return 'Inactiva';
      default: return 'Desconocido';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <LocalPharmacy sx={{ mr: 2, verticalAlign: 'middle' }} />
            Farmacias Participantes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Selecciona una farmacia para ver sus servicios específicos
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Actualizar lista">
            <IconButton onClick={() => showFeedback('info', 'Lista actualizada')} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Enviar sugerencia para mejorar la plataforma">
            <IconButton onClick={() => navigate('/suggestions')} color="primary">
              <Star />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar farmacias por nombre o dirección..."
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
      </Box>

      <Box sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} centered>
          <Tab label="Todas" />
          <Tab label="Con Mayor Demanda" />
          <Tab label="Mejor Calificadas" />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {filteredPharmacies.map((pharmacy) => (
          <Grid item xs={12} sm={6} md={4} key={pharmacy.id}>
            <Fade in timeout={300}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handlePharmacyClick(pharmacy.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
                        <LocalPharmacy />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                          {pharmacy.name}
                        </Typography>
                        <Chip
                          label={getStatusText(pharmacy.status)}
                          color={getStatusColor(pharmacy.status)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Rating value={pharmacy.rating} precision={0.1} readOnly size="small" />
                      <Tooltip title="Calificación basada en feedback de usuarios">
                        <Info sx={{ ml: 1, fontSize: 16 }} />
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary' }}>
                    <LocationOn sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">
                      {pharmacy.address}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">
                      {pharmacy.phone}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Límite diario de turnos:</strong> {pharmacy.daily_digital_turn_limit}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(pharmacy.total_turns_today / pharmacy.daily_digital_turn_limit) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime sx={{ fontSize: 16 }} />
                      <Typography variant="body2">
                        <strong>Tiempo promedio:</strong> {pharmacy.avg_wait_time} min
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People sx={{ fontSize: 16 }} />
                      <Typography variant="body2">
                        <strong>Turnos hoy:</strong> {pharmacy.total_turns_today}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Servicios disponibles:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {pharmacy.services.map((service, index) => (
                        <Chip
                          key={index}
                          label={service}
                          variant="outlined"
                          size="small"
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Button
                    variant="contained"
                    onClick={() => handleTurnRequest(pharmacy.id)}
                    sx={{ mr: 1 }}
                    startIcon={<TrendingUp />}
                  >
                    Solicitar Turno
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleTurnDisplay(pharmacy.id)}
                    startIcon={<People />}
                  >
                    Ver Turnos
                  </Button>
                </CardActions>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {filteredPharmacies.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron farmacias que coincidan con la búsqueda
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 6, p: 3, backgroundColor: 'info.light', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Selecciona una farmacia para ver sus servicios específicos
      </Typography>
      <Typography variant="body2" color="text.secondary" component="div">
        <ul style={{ margin: 0, paddingLeft: '1.5em' }}>
          <li>Cada farmacia tiene su propio inventario, sistema de turnos y servicios</li>
          <li>Las acciones se realizan dentro del contexto de cada farmacia</li>
          <li>Evita confusión y mantiene la interfaz limpia y organizada</li>
        </ul>
      </Typography>
    </Box>

    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        transform: feedback.show ? 'translateX(0)' : 'translateX(400px)',
        transition: 'transform 0.3s ease-in-out'
      }}
    >
      <Alert 
        severity={feedback.type}
        sx={{ 
          minWidth: 300,
          '& .MuiAlert-message': {
            fontWeight: 'bold'
          }
        }}
        onClose={() => setFeedback({ show: false, type: '', message: '' })}
      >
        {feedback.message}
      </Alert>
    </Box>
  </Container>
);

};

export default PharmacyList;
