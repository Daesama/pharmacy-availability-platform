import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Paper,
  Grid,
  Chip,
  Rating
} from '@mui/material';
import { 
  Star, 
  Person, 
  ArrowBack, 
  LocalPharmacy,
  Phone,
  LocationOn,
  AccessTime
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

// Datos de ejemplo de farmacias
const pharmaciesData = [
  {
    id: 1,
    name: 'Farmacia SaludPlus',
    address: 'Calle 123 #45-67, Bogotá',
    phone: '+57 1 2345678',
    rating: 4.5,
    opensAt: 7,
    closesAt: 22,
    services: ['Urgencias 24h', 'Delivery', 'Laboratorio']
  },
  {
    id: 2,
    name: 'Farmacia Vida',
    address: 'Avenida 89 #12-34, Bogotá',
    phone: '+57 1 8765432',
    rating: 4.2,
    opensAt: 8,
    closesAt: 20,
    services: ['Control de presión', 'Vacunación']
  },
  {
    id: 3,
    name: 'Farmacia Bienestar',
    address: 'Carrera 45 #78-90, Bogotá',
    phone: '+57 1 3456789',
    rating: 4.8,
    opensAt: 6,
    closesAt: 24,
    services: ['Urgencias 24h', 'Parqueadero', 'Venta de equipos médicos']
  }
];

export default function PharmacyRatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [ratingsData, setRatingsData] = useState({ average_rating: 0, total_ratings: 0, recent: [] });
  const [pharmacy, setPharmacy] = useState(null);

  useEffect(() => {
    // Cargar datos de la farmacia
    const pharmacyData = pharmaciesData.find(p => p.id === parseInt(id));
    setPharmacy(pharmacyData);
    
    // Cargar calificaciones existentes
    fetchRatings();
  }, [id]);

  const fetchRatings = async () => {
    try {
      // Simulación de datos - en producción sería una llamada API real
      const mockRatings = {
        average_rating: 4.3,
        total_ratings: 127,
        recent: [
          {
            user_name: "María García",
            rating: 5,
            comment: "Excelente servicio, muy rápido y profesional.",
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            user_name: "Carlos Rodríguez",
            rating: 4,
            comment: "Buen atención, aunque el tiempo de espera fue un poco largo.",
            created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
          },
          {
            user_name: "Ana López",
            rating: 5,
            comment: "Muy contenta con el servicio de delivery, llegó todo en perfecto estado.",
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      };
      setRatingsData(mockRatings);
    } catch (err) {
      console.error('Error fetching ratings:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userName.trim() || rating === 0) {
      setSnackbar({ open: true, message: 'Por favor ingresa tu nombre y una calificación', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      // Simulación de envío - en producción sería una llamada API real
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSnackbar({ open: true, message: '¡Gracias por tu calificación!', severity: 'success' });
      setRating(0);
      setComment('');
      setUserName('');
      fetchRatings();
    } catch (err) {
      setSnackbar({ open: true, message: 'Error al enviar calificación', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!pharmacy) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography>Farmacia no encontrada</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Volver al inicio
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          Volver a farmacias
        </Button>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <LocalPharmacy sx={{ fontSize: 32 }} />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {pharmacy.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Rating value={pharmacy.rating} precision={0.1} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">
                  ({pharmacy.rating} • {ratingsData.total_ratings} calificaciones)
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn color="action" fontSize="small" />
                <Typography variant="body2">{pharmacy.address}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone color="action" fontSize="small" />
                <Typography variant="body2">{pharmacy.phone}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime color="action" fontSize="small" />
                <Typography variant="body2">
                  {pharmacy.opensAt}:00 - {pharmacy.closesAt}:00
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Servicios:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {pharmacy.services.map((service, index) => (
                <Chip key={index} label={service} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {/* Formulario de calificación */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Deja tu calificación
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Tu nombre"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                fullWidth
                required
                size="small"
              />

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" gutterBottom>
                  Tu calificación:
                </Typography>
                <Rating
                  value={rating}
                  onChange={(e, newValue) => setRating(newValue)}
                  size="large"
                />
              </Box>

              <TextField
                label="Tu opinión, queja o reclamo"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={4}
                fullWidth
                placeholder="Cuéntanos tu experiencia, sugerencias, quejas o reclamos..."
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={<Star />}
                size="large"
              >
                {loading ? 'Enviando...' : 'Enviar calificación'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Calificaciones recientes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, maxHeight: 600, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Calificaciones recientes
            </Typography>
            
            {ratingsData.recent.length > 0 ? (
              <List dense>
                {ratingsData.recent.map((r, i) => (
                  <React.Fragment key={i}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {r.user_name}
                            <Rating value={r.rating} readOnly size="small" />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {r.comment || 'Sin comentario'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(r.created_at).toLocaleString()}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {i < ratingsData.recent.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                No hay calificaciones aún. ¡Sé el primero en opinar!
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
