import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Fade,
  Zoom
} from '@mui/material';
import { 
  Person, 
  LocalHospital, 
  ConfirmationNumber,
  History,
  AccessTime,
  CheckCircle,
  Error,
  Info,
  Phone,
  Email
} from '@mui/icons-material';
import axios from 'axios';

const TurnRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  const [formData, setFormData] = useState({
    user_name: '',
    user_document: '',
    user_id: '',
    phone: '',
    email: '',
    document_type: 'cc'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [turnData, setTurnData] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(0);
  const [turnHistory, setTurnHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(null);

  const steps = ['Información Personal', 'Confirmación', 'Turno Asignado'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.user_name.trim()) {
      setError('Por favor ingrese su nombre completo');
      return false;
    }
    if (formData.user_name.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return false;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.user_name)) {
      setError('El nombre solo puede contener letras y espacios');
      return false;
    }
    if (!formData.user_document.trim()) {
      setError('Por favor ingrese su número de documento');
      return false;
    }
    if (formData.user_document.length < 5) {
      setError('El documento debe tener al menos 5 caracteres');
      return false;
    }
    if (formData.document_type === 'cc' && !/^\d+$/.test(formData.user_document)) {
      setError('La cédula debe contener solo números');
      return false;
    }
    if (formData.phone && !/^\d+$/.test(formData.phone.replace(/[-\s]/g, ''))) {
      setError('El teléfono debe contener solo números');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('El formato del email no es válido');
      return false;
    }
    return true;
  };

  const fetchTurnHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/user/${formData.user_document}/turns`);
      setTurnHistory(response.data.turns || []);
    } catch (err) {
      console.error('Error fetching turn history:', err);
      setTurnHistory([]);
    }
  };

  const fetchEstimatedWaitTime = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/pharmacy/${id}/wait-time`);
      setEstimatedWaitTime(response.data.estimated_minutes || 0);
    } catch (err) {
      setEstimatedWaitTime(15); // Default estimate
    }
  };

  const cancelTurn = async (turnId) => {
    try {
      await axios.put(`${API_URL}/api/turns/${turnId}/status`, { status: 'cancelled' });
      setShowCancelDialog(false);
      setCurrentTurn(null);
      fetchTurnHistory();
    } catch (err) {
      setError('Error al cancelar el turno');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API_URL}/api/turns/request`, {
        pharmacy_id: parseInt(id),
        user_id: formData.user_id || `USER_${Date.now()}`,
        user_name: formData.user_name,
        user_document: formData.user_document
      });

      setTurnData(response.data);
      setSuccess(true);
      setActiveStep(2);
      
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.error || 'Error al solicitar el turno');
      } else {
        setError('Error del servidor. Por favor intente nuevamente.');
      }
      console.error('Error requesting turn:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateForm()) return;
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  name="user_name"
                  value={formData.user_name}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Documento</InputLabel>
                  <Select
                    value={formData.document_type}
                    label="Tipo de Documento"
                    name="document_type"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="cc">Cédula</MenuItem>
                    <MenuItem value="ti">Tarjeta Identidad</MenuItem>
                    <MenuItem value="ce">Cédula Extranjería</MenuItem>
                    <MenuItem value="passport">Pasaporte</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Número de Documento"
                  name="user_document"
                  value={formData.user_document}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: <LocalHospital sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teléfono (opcional)"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email (opcional)"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ID de Usuario (opcional)"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleInputChange}
                  helperText="Si ya tienes una cuenta, ingresa tu ID"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirmar Información
            </Typography>
            <Paper sx={{ p: 3, backgroundColor: 'grey.50' }}>
              <Typography variant="body1" gutterBottom>
                <strong>Nombre:</strong> {formData.user_name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Documento:</strong> {formData.user_document}
              </Typography>
              {formData.phone && (
                <Typography variant="body1" gutterBottom>
                  <strong>Teléfono:</strong> {formData.phone}
                </Typography>
              )}
              {formData.email && (
                <Typography variant="body1" gutterBottom>
                  <strong>Email:</strong> {formData.email}
                </Typography>
              )}
              <Typography variant="body1" gutterBottom>
                <strong>ID Usuario:</strong> {formData.user_id || 'Generado automáticamente'}
              </Typography>
              
              {estimatedWaitTime > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTime sx={{ mr: 1 }} />
                    Tiempo estimado de espera: {estimatedWaitTime} minutos
                  </Box>
                </Alert>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Al confirmar, se solicitará un turno digital para esta farmacia.
              </Typography>
            </Paper>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            {success && turnData ? (
              <Zoom in timeout={500}>
                <Box>
                  <ConfirmationNumber sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                  <Typography variant="h5" color="success.main" gutterBottom>
                    ¡Turno Asignado Exitosamente!
                  </Typography>
                  <Paper sx={{ p: 3, mb: 3, backgroundColor: 'success.light' }}>
                    <Typography variant="h4" gutterBottom>
                      Turno #{turnData.turn_number}
                    </Typography>
                    <Typography variant="body1">
                      ID de Turno: {turnData.turn_id}
                    </Typography>
                  </Paper>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Por favor, presente este número cuando sea llamado en la farmacia.
                  </Typography>
                </Box>
              </Zoom>
            ) : (
              <CircularProgress />
            )}
          </Box>
        );

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <ConfirmationNumber sx={{ mr: 2, verticalAlign: 'middle' }} />
            Solicitar Turno Digital
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Obtén tu turno digital y evita largas esperas en la farmacia
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Ver historial de turnos">
            <IconButton onClick={() => setShowHistory(true)} color="primary">
              <History />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {renderStepContent(activeStep)}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0 || activeStep === 2}
          onClick={handleBack}
          variant="outlined"
        >
          Anterior
        </Button>

        {activeStep === 0 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
          >
            Siguiente
          </Button>
        )}

        {activeStep === 1 && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Procesando...' : 'Confirmar y Solicitar Turno'}
          </Button>
        )}

        {activeStep === 2 && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/pharmacy/${id}/turns`)}
            >
              Ver Turnos en Vivo
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(`/pharmacy/${id}/inventory`)}
            >
              Ver Inventario
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 4, p: 2, backgroundColor: 'info.light', borderRadius: 2 }}>
        <Typography variant="body2" color="info.dark">
          <strong>Nota:</strong> El sistema tiene un límite diario de turnos digitales para garantizar 
          atención equitativa a todos los usuarios, incluyendo aquellos que acuden presencialmente.
        </Typography>
      </Box>

      {/* Historial de Turnos Dialog */}
      <Dialog open={showHistory} onClose={() => setShowHistory(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History />
            Historial de Turnos
          </Box>
        </DialogTitle>
        <DialogContent>
          {turnHistory.length > 0 ? (
            <List>
              {turnHistory.map((turn) => (
                <Box key={turn.id}>
                  <ListItem>
                    <ListItemText
                      primary={`Turno #${turn.turn_number} - ${turn.user_name}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Estado: 
                            <Chip 
                              label={turn.status === 'attended' ? 'Atendido' : 
                                     turn.status === 'cancelled' ? 'Cancelado' : 
                                     turn.status === 'called' ? 'Llamado' : 'Pendiente'}
                              color={turn.status === 'attended' ? 'success' : 
                                     turn.status === 'cancelled' ? 'error' : 
                                     turn.status === 'called' ? 'warning' : 'default'}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(turn.requested_at).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    {turn.status === 'pending' && (
                      <IconButton 
                        onClick={() => {
                          setCurrentTurn(turn);
                          setShowCancelDialog(true);
                        }}
                        color="error"
                      >
                        <Error />
                      </IconButton>
                    )}
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No tienes turnos registrados
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      
      {/* Cancelar Turno Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Cancelar Turno</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            ¿Estás seguro que deseas cancelar el turno #{currentTurn?.turn_number}?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>No</Button>
          <Button onClick={() => cancelTurn(currentTurn.id)} color="error" variant="contained">
            Sí, Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TurnRequest;
