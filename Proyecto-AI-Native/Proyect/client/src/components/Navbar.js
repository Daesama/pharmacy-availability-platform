import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { 
  LocalPharmacy, 
  Menu as MenuIcon,
  Home,
  ConfirmationNumber,
  Visibility,
  Feedback,
  Inventory
} from '@mui/icons-material';

const Navbar = () => {
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [feedbackType, setFeedbackType] = React.useState('feedback');
  const [feedbackMessage, setFeedbackMessage] = React.useState('');

  const isMenuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFeedbackOpen = () => {
    setFeedbackOpen(true);
    handleMenuClose();
  };

  const handleFeedbackClose = () => {
    setFeedbackOpen(false);
  };

  const handleFeedbackSend = () => {
    const subjectMap = {
      feedback: 'Feedback',
      complaint: 'Queja',
      claim: 'Reclamo'
    };

    const subject = `[FarmaciaConnect] ${subjectMap[feedbackType] || 'Mensaje'}`;
    const body = feedbackMessage || '';
    window.location.href = `mailto:soporte@farmaciaconnect.local?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setFeedbackMessage('');
    setFeedbackOpen(false);
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const pharmacyMatch = location.pathname.match(/^\/pharmacy\/([^/]+)/);
  const pharmacyId = pharmacyMatch ? pharmacyMatch[1] : null;
  const isHome = location.pathname === '/';
  const isPharmacyRoute = Boolean(pharmacyId);

  const navItems = isPharmacyRoute
    ? [
        { path: '/', label: 'Farmacias', icon: <Home /> },
        { path: `/pharmacy/${pharmacyId}/inventory`, label: 'Inventario', icon: <Inventory /> },
        { path: `/pharmacy/${pharmacyId}/turn-request`, label: 'Solicitar Turno', icon: <ConfirmationNumber /> },
        { path: `/pharmacy/${pharmacyId}/turns`, label: 'Ver Turnos', icon: <Visibility /> }
      ]
    : [{ path: '/', label: 'Farmacias', icon: <Home /> }];

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2, display: { sm: 'none' } }}
          onClick={handleMenuOpen}
        >
          <MenuIcon />
        </IconButton>

        <LocalPharmacy sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          FarmaciaConnect
        </Typography>

        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
          {isHome ? (
            <Button
              color="inherit"
              startIcon={<Feedback />}
              onClick={handleFeedbackOpen}
              sx={{
                mx: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              Feedback / Quejas / Reclamos
            </Button>
          ) : (
            navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                component={Link}
                to={item.path}
                startIcon={item.icon}
                sx={{
                  mx: 1,
                  backgroundColor: isActivePath(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }
                }}
              >
                {item.label}
              </Button>
            ))
          )}
        </Box>
      </Toolbar>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        sx={{ display: { xs: 'block', sm: 'none' } }}
      >
        {navItems.map((item) => (
          <MenuItem
            key={item.path}
            component={Link}
            to={item.path}
            onClick={handleMenuClose}
            selected={isActivePath(item.path)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {item.icon}
              {item.label}
            </Box>
          </MenuItem>
        ))}

        {isHome && (
          <MenuItem onClick={handleFeedbackOpen}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Feedback />
              Feedback / Quejas / Reclamos
            </Box>
          </MenuItem>
        )}
      </Menu>

      <Dialog open={feedbackOpen} onClose={handleFeedbackClose} maxWidth="sm" fullWidth>
        <DialogTitle>Feedback / Quejas / Reclamos</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'grid', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="feedback-type-label">Tipo</InputLabel>
              <Select
                labelId="feedback-type-label"
                label="Tipo"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
              >
                <MenuItem value="feedback">Feedback</MenuItem>
                <MenuItem value="complaint">Queja</MenuItem>
                <MenuItem value="claim">Reclamo</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Mensaje"
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              multiline
              minRows={4}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFeedbackClose}>Cancelar</Button>
          <Button onClick={handleFeedbackSend} variant="contained">Enviar</Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default Navbar;
