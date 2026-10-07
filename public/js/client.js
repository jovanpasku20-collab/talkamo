```js
const goBtn = document.getElementById('go-btn');
const aiBtn = document.getElementById('ai-btn');

const nicknameInput = document.getElementById('nickname-input');
const roomInput = document.getElementById('room-input');

const landing = document.getElementById('landing');
const chatRoom = document.getElementById('chat-room');

const roomTitle = document.getElementById('room-title');
const userCount = document.getElementById('user-count');
const connectionStatus = document.getElementById('connection-status');

const chatbox = document.getElementById('chatbox');
const typingArea = document.getElementById('typing-area');

const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const leaveBtn = document.getElementById('leave-btn');

let socket = null;
let currentNickname = '';
let typingUsers = new Set();
let isTyping = false;

function joinRoom(roomName) {
    const nickname = nicknameInput.value.trim();

    if (!nickname) {
        alert('Please enter a nickname before continuing.');
        nicknameInput.focus();
        return;
    }

    if (socket) {
        socket.disconnect();
        socket = null;
    }

    currentNickname = nickname;

    roomName = roomName.trim().toLowerCase() || 'general';

    chatbox.innerHTML = '';
    typingUsers.clear();
    updateTypingIndicator();

    socket = io();

    socket.on('connect', () => {
        connectionStatus.textContent = '● Connected';
        connectionStatus.className = 'connected';

        socket.emit('join_room', {
            nickname,
            roomName
        });
    });

    socket.on('connect_success', (data) => {
        landing.classList.add('hidden');
        chatRoom.classList.remove('hidden');

        roomTitle.textContent = `Room: #${data.roomName}`;

        msgInput.disabled = false;
        sendBtn.disabled = false;
        msgInput.focus();
    });

    socket.on('user_count', (count) => {
        userCount.textContent = count;
    });

    socket.on('system_message', (msg) => {
        addSystemMessage(msg);
    });

    socket.on('receive_chat', (data) => {
        removeTypingUser(data.sender);

        const div = document.createElement('div');
        div.className = 'chat-message';

        const strong = document.createElement('strong');
        strong.textContent = data.sender;

        div.appendChild(strong);
        div.appendChild(
            document.createTextNode(`: ${data.text}`)
        );

        chatbox.appendChild(div);
        scrollChat();
    });

    socket.on('typing', (data) => {
        if (!data || !data.username) return;

        if (data.isTyping) {
            typingUsers.add(data.username);
        } else {
            typingUsers.delete(data.username);
        }

        updateTypingIndicator();
    });

    socket.on('room_full', (msg) => {
        alert(msg);

        socket.disconnect();
        socket = null;

        connectionStatus.textContent = '● Disconnected';
        connectionStatus.className = 'disconnected';
    });

    socket.on('disconnect', () => {
        connectionStatus.textContent = '● Disconnected';
        connectionStatus.className = 'disconnected';

        typingUsers.clear();
        updateTypingIndicator();
    });

    socket.on('connect_error', () => {
        connectionStatus.textContent = '● Connection error';
        connectionStatus.className = 'disconnected';
    });
}

function addSystemMessage(message) {
    const div = document.createElement('div');

    div.className = 'sys-msg';
    div.textContent = `[System]: ${message}`;

    chatbox.appendChild(div);

    scrollChat();
}

function updateTypingIndicator() {
    typingArea.innerHTML = '';

    const users = Array.from(typingUsers);

    if (users.length === 0) {
        return;
    }

    let text;

    if (users.length === 1) {
        text = `${users[0]} is typing...`;
    } else if (users.length === 2) {
        text = `${users[0]} and ${users[1]} are typing...`;
    } else {
        text = `${users.length} people are typing...`;
    }

    const indicator = document.createElement('div');

    indicator.className = 'typing-indicator';
    indicator.textContent = text;

    typingArea.appendChild(indicator);
}

function removeTypingUser(username) {
    typingUsers.delete(username);
    updateTypingIndicator();
}

function sendMessage() {
    const text = msgInput.value.trim();

    if (!text || !socket) {
        return;
    }

    socket.emit('typing', false);

    isTyping = false;

    socket.emit('send_chat', text);

    msgInput.value = '';
}

function scrollChat() {
    chatbox.scrollTop = chatbox.scrollHeight;
}

function leaveRoom() {
    if (socket) {
        socket.emit('typing', false);
        socket.disconnect();
        socket = null;
    }

    landing.classList.remove('hidden');
    chatRoom.classList.add('hidden');

    chatbox.innerHTML = '';
    typingArea.innerHTML = '';

    typingUsers.clear();
    isTyping = false;

    connectionStatus.textContent = '● Disconnected';
    connectionStatus.className = 'disconnected';

    msgInput.value = '';
}

goBtn.addEventListener('click', () => {
    joinRoom(roomInput.value);
});

aiBtn.addEventListener('click', () => {
    roomInput.value = 'test';
    joinRoom('test');
});

sendBtn.addEventListener('click', sendMessage);

leaveBtn.addEventListener('click', leaveRoom);

msgInput.addEventListener('input', () => {
    if (!socket) return;

    const currentlyTyping =
        msgInput.value.trim().length > 0;

    if (currentlyTyping !== isTyping) {
        isTyping = currentlyTyping;

        socket.emit('typing', isTyping);
    }
});

msgInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
```
