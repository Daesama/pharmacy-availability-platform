import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Snackbar,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Lightbulb,
  Send,
  ThumbUp,
  BugReport,
  TrendingUp,
  Security,
  Speed,
  Accessibility,
  Language
} from '@mui/icons-material';

const CATEGORIES = [
  { value: 'general', label: 'General', icon: <Lightbulb /> },
  { value: 'ui', label: 'Interfaz / Experiencia', icon: <Accessibility /> },
  { value: 'performance', label: 'Rendimiento', icon: <Speed /> },
  { value: 'features', label: 'Nuevas Funcionalidades', icon: <TrendingUp /> },
  { value: 'bugs', label: 'Errores / Bugs', icon: <BugReport /> },
  { value: 'security', label: 'Seguridad', icon: <Security /> },
  { value: 'accessibility', label: 'Accesibilidad', icon: <Accessibility /> },
  { value: 'multilanguage', label: 'Multiidioma', icon: <Language /> }
];

const EXAMPLES = {
  general: [
    'Agregar notificaciones push para cambios de estado de turnos',
    'Mostrar tiempo estimado de espera en la lista de farmacias',
    'Permitir calificar la atención recibida'
  ],
  ui: [
    'Mejorar el contraste en modo oscuro',
    'Añadir atajos de teclado para acciones comunes',
    'Hacer la interfaz más amigable para adultos mayores'
  ],
  performance: [
    'Optimizar carga de listas grandes de inventario',
    'Implementar caché local para reducir consultas',
    'Carga progresiva de imágenes y datos'
  ],
  features: [
    'Historial de medicamentos dispensados',
    'Recordatorios de medicamentos',
    'Chat en vivo con la farmacia',
    'Mapa interactivo con todas las farmacias'
  ],
  bugs: [
    'Error al actualizar inventario en tiempo real',
    'Turnos duplicados al hacer doble clic',
    'Problemas al cargar el inventario en conexiones lentas'
  ],
  security: [
    'Autenticación de dos factores',
    'Encriptación de datos sensibles',
    'Política de privacidad más clara'
  ],
  accessibility: [
    'Lector de pantalla para usuarios con discapacidad visual',
    'Navegación por voz',
    'Modo de alto contraste'
  ],
  multilanguage: [
    'Soporte para inglés y portugués',
    'Traducción automática según el país',
    'Términos médicos localizados'
  ]
};

export default function Suggestions() {
  const [category, setCategory] = useState('general');
  const [suggestion, setSuggestion] = useState('');
  const [email, setEmail] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!suggestion.trim()) {
      setSnackbar({ open: true, message: 'Por favor escribe tu sugerencia', severity: 'warning' });
      return;
    }

    // Aquí podrías enviar a un backend real
    console.log('Sugerencia enviada:', { category, suggestion, email });

    setSnackbar({ 
      open: true, 
      message: '¡Gracias por tu sugerencia! La ayudaremos a mejorar FarmaciaConnect.', 
      severity: 'success' 
    });
    setSuggestion('');
    setEmail('');
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const selectedCategory = CATEGORIES.find(cat => cat.value === category);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        <Lightbulb sx={{ mr: 2, verticalAlign: 'middle' }} />
        Consejos para Mejorar la Plataforma
      </Typography>

      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Tu feedback es invaluable para mejorar FarmaciaConnect. Comparte tus ideas y sugerencias para hacer la plataforma mejor para todos.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Envía tu Sugerencia
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 3 }}>
              <TextField
                select
                label="Categoría"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
                SelectProps={{
                  native: false
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </TextField>

              <TextField
                label="Tu sugerencia"
                multiline
                rows={4}
                fullWidth
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Describe tu idea o sugerencia en detalle..."
                required
              />

              <TextField
                label="Correo electrónico (opcional)"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="si@ejemplo.com"
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<Send />}
                fullWidth
              >
                Enviar Sugerencia
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {selectedCategory?.icon}
                {selectedCategory?.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ejemplos de sugerencias en esta categoría:
              </Typography>
              <List dense>
                {(EXAMPLES[category] || []).map((example, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <ThumbUp fontSize="small" color="action" />
                      </ListItemIcon>
                      <ListItemText primary={example} />
                    </ListItem>
                    {index < (EXAMPLES[category] || []).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          <Alert severity="info">
            <Typography variant="body2">
              <strong>¿Por qué tu opinión importa?</strong><br />
              Cada sugerencia nos ayuda a priorizar mejoras y a construir una plataforma que realmente sirva a las comunidades de salud pública en Latinoamérica.
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
