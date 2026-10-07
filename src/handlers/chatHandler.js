const { MAX_USERS_PER_ROOM } = require('../config/constants');
const getClientIp = require('../utils/getIp');

// Store clients per room: Map<roomName, Map<socketId, { ip, name }>>
const rooms = new Map();

function handleChat(io, socket) {
    socket.on('join_room', ({ nickname, roomName }) => {
        const clientIp = getClientIp(socket);
        const targetRoom = roomName.toLowerCase();

        if (!rooms.has(targetRoom)) {
            rooms.set(targetRoom, new Map());
        }

        const currentRoomMap = rooms.get(targetRoom);

        // Enforce 5 devices per room limit
        if (currentRoomMap.size >= MAX_USERS_PER_ROOM) {
            socket.emit(
                'room_full',
                `Room #${targetRoom} is full (5/5 devices). Try another room name.`
            );
            socket.disconnect(true);
            return;
        }

        // Join Socket.io room channel
        socket.join(targetRoom);

        const userData = {
            ip: clientIp,
            name: nickname,
            room: targetRoom
        };

        currentRoomMap.set(socket.id, userData);

        socket.emit('connect_success', { roomName: targetRoom });

        io.to(targetRoom).emit(
            'system_message',
            `${nickname} joined the room, say hi!'
        );

        io.to(targetRoom).emit(
            'user_count',
            currentRoomMap.size
        );

        // Typing indicator
        socket.on('typing', (isTyping) => {
            if (typeof isTyping !== 'boolean') return;

            socket.to(targetRoom).emit('typing', {
                username: nickname,
                isTyping
            });
        });

        // Handle chat messages
        socket.on('send_chat', (msg) => {
            if (typeof msg === 'string' && msg.trim()) {

                // Make sure typing indicator disappears when a message is sent
                socket.to(targetRoom).emit('typing', {
                    username: nickname,
                    isTyping: false
                });

                io.to(targetRoom).emit('receive_chat', {
                    sender: nickname,
                    text: msg.trim()
                });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            if (currentRoomMap.has(socket.id)) {
                currentRoomMap.delete(socket.id);

                io.to(targetRoom).emit('typing', {
                    username: nickname,
                    isTyping: false
                });

                io.to(targetRoom).emit(
                    'system_message',
                    `${nickname} left the room.`
                );

                io.to(targetRoom).emit(
                    'user_count',
                    currentRoomMap.size
                );
            }

            // Remove empty room from memory
            if (currentRoomMap.size === 0) {
                rooms.delete(targetRoom);
            }
        });
    });
}

module.exports = handleChat;
