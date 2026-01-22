import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001');
    
    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Conectado al servidor Socket.IO');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Desconectado del servidor Socket.IO');
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const joinPharmacy = (pharmacyId) => {
    if (socket) {
      socket.emit('join_pharmacy', pharmacyId);
    }
  };

  const value = {
    socket,
    connected,
    joinPharmacy
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
