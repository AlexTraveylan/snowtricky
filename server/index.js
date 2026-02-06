import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameManager } from './GameManager.js';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;
const gameManager = new GameManager(io);

// Servir les fichiers statiques en production
app.use(express.static('dist'));

io.on('connection', (socket) => {
  console.log(`🎿 Joueur connecté: ${socket.id}`);
  
  // Rejoindre la partie
  socket.on('join-game', (playerName) => {
    gameManager.addPlayer(socket, playerName);
  });
  
  // Mise à jour de la position du joueur
  socket.on('player-update', (data) => {
    gameManager.updatePlayer(socket.id, data);
  });
  
  // Joueur prêt
  socket.on('player-ready', () => {
    gameManager.setPlayerReady(socket.id);
  });
  
  // Joueur a terminé la course
  socket.on('player-finished', (time) => {
    gameManager.playerFinished(socket.id, time);
  });
  
  // Déconnexion
  socket.on('disconnect', () => {
    console.log(`👋 Joueur déconnecté: ${socket.id}`);
    gameManager.removePlayer(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`
  🏔️  SnowTricky Server
  ════════════════════════════════════
  🎿 Serveur lancé sur http://localhost:${PORT}
  🌐 Client: http://localhost:5173
  ════════════════════════════════════
  `);
});
