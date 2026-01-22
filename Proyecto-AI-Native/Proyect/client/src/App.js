import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import PharmacyList from './components/PharmacyList';
import Inventory from './components/Inventory';
import TurnRequest from './components/TurnRequest_fixed';
import TurnDisplay from './components/TurnDisplay_fixed';
import { SocketProvider } from './contexts/SocketContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#d32f2f',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SocketProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<PharmacyList />} />
              <Route path="/pharmacy/:id/inventory" element={<Inventory />} />
              <Route path="/pharmacy/:id/turn-request" element={<TurnRequest />} />
              <Route path="/pharmacy/:id/turns" element={<TurnDisplay />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
