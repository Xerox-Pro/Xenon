import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  
  // Initialize Socket.io signaling server
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });
  
  const PORT = 3000;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // 1. Role-based joining to establish 1-on-1 connection
    socket.on('join', (data) => {
      const role = data.role; // 'web' or 'android'
      socket.join('android-remote'); // Hardcoding a single room for presentation purposes
      socket.data.role = role;
      console.log(`Socket ${socket.id} joined as ${role}`);
      
      // Notify the new client about existing clients in the room
      const room = io.sockets.adapter.rooms.get('android-remote');
      if (room) {
        for (const clientId of room) {
          if (clientId !== socket.id) {
            const clientRole = io.sockets.sockets.get(clientId)?.data.role;
            if (clientRole) {
              socket.emit('peer_joined', { role: clientRole, id: clientId });
            }
          }
        }
      }

      // Notify the other peers in the room that a new participant joined
      socket.to('android-remote').emit('peer_joined', { role, id: socket.id });
    });

    // 2. WebRTC SDP Offer / Answer Exchange
    socket.on('offer', (data) => {
      socket.to('android-remote').emit('offer', data);
    });

    socket.on('answer', (data) => {
      socket.to('android-remote').emit('answer', data);
    });

    // 3. WebRTC ICE Candidate Exchange
    socket.on('ice-candidate', (data) => {
      socket.to('android-remote').emit('ice-candidate', data);
    });

    // 4. Remote Control Action Relay
    // Broadcasts the JSON {"action": "...", "x": x, "y": y} to the connected device
    socket.on('remote_action', (data) => {
      socket.to('android-remote').emit('remote_action', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      const role = socket.data.role;
      if (role) {
        socket.to('android-remote').emit('peer_left', { role, id: socket.id });
      }
    });
  });

  // Vite middleware setup for Development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Singnaling server running on port ${PORT}`);
  });
}

startServer();
