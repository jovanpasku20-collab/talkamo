const goBtn = document.getElementById('go-btn');
const nicknameInput = document.getElementById('nickname-input');
const roomInput = document.getElementById('room-input');

const landing = document.getElementById('landing');
const chatRoom = document.getElementById('chat-room');
const roomTitle = document.getElementById('room-title');
const userCount = document.getElementById('user-count');

const chatbox = document.getElementById('chatbox');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');

let socket = null;

goBtn.addEventListener('click', () => {
    const nickname = nicknameInput.value.trim();
    const roomName = roomInput.value.trim().toLowerCase() || 'general';

    if (!nickname) {
        alert('Please enter a nickname before continuing.');
        return;
    }

    socket = io();

    socket.on('connect_success', (data) => {
        landing.classList.add('hidden');
        chatRoom.classList.remove('hidden');
        roomTitle.textContent = `Room: #${data.roomName}`;
    });

    socket.on('user_count', (count) => {
        userCount.textContent = count;
    });

    socket.on('system_message', (msg) => {
        const div = document.createElement('div');
        div.className = 'sys-msg';
        div.textContent = `[System]: ${msg}`;
        chatbox.appendChild(div);
        chatbox.scrollTop = chatbox.scrollHeight;
    });

    socket.on('receive_chat', (data) => {
        const div = document.createElement('div');

        const strong = document.createElement('strong');
        strong.textContent = data.sender;

        div.appendChild(strong);
        div.appendChild(
            document.createTextNode(`: ${data.text}`)
        );

        chatbox.appendChild(div);
        chatbox.scrollTop = chatbox.scrollHeight;
    });

    socket.on('room_full', (msg) => {
        alert(msg);
        socket.disconnect();
    });

    socket.emit('join_room', {
        nickname,
        roomName
    });
});

function sendMessage() {
    const text = msgInput.value.trim();

    if (!text || !socket) {
        return;
    }

    socket.emit('send_chat', text);
    msgInput.value = '';
}

sendBtn.addEventListener('click', sendMessage);

msgInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
