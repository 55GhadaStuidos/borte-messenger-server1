const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Health check endpoint (Railway bunu kontrol eder)
app.get('/', (req, res) => {
    res.send('Börte Messenger Sunucusu Aktif!');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Socket.io bağlantıları
io.on('connection', (socket) => {
    console.log('⚡ Kullanıcı bağlandı: ' + socket.id);

    socket.on('join_node', (nodeTag) => {
        socket.join(nodeTag);
        console.log(`👤 ${socket.id} -> ${nodeTag} odasına girdi`);
    });

    socket.on('send_msg', (data) => {
        if (!data.nodeTag || !data.sender || !data.content) return;
        io.to(data.nodeTag).emit('receive_msg', data);
        console.log(`📩 ${data.sender} -> ${data.nodeTag}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ Kullanıcı ayrıldı: ' + socket.id);
    });
});

// Railway PORT env değişkenini otomatik verir
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Börte Sunucusu ${PORT} portunda aktif!`);
});
