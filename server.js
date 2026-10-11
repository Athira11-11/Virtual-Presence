
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const app = express();

const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'server-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'server.pem'))
};

// Serve index.html and other webpage files from this folder.
app.use(express.static(__dirname));

const server = https.createServer(httpsOptions, app);

const io = new Server(server);

app.get('/health', (req, res) => {
    res.send('Virtual Presence signaling server is running securely');
});

io.on('connection', (socket) => {
    console.log('Device connected:', socket.id);

    socket.on('join-room', (roomId) => {
        if (typeof roomId !== 'string' || roomId.length > 100) return;

        socket.join(roomId);
        socket.to(roomId).emit('user-joined', socket.id);

        console.log(`${socket.id} joined room ${roomId}`);
    });

    socket.on('signal', ({ roomId, data } = {}) => {
        if (
            typeof roomId !== 'string' ||
            !roomId ||
            !data ||
            typeof data !== 'object'
        ) return;

        socket.to(roomId).emit('signal', {
            from: socket.id,
            data
        });
    });

    socket.on('disconnect', () => {
        console.log('Device disconnected:', socket.id);
    });
});

const PORT = 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Virtual Presence running on port ${PORT}`);
});
