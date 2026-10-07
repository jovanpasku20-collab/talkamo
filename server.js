require('./bot');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { PORT } = require('./src/config/constants');
const handleChat = require('./src/handlers/chatHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    handleChat(io, socket);
});

server.listen(PORT, () => {
    console.log(`Talkamo server running on http://localhost:${PORT}`);
});
