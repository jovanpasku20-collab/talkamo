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
const typingIndicator = document.getElementById('typing-indicator');

let socket = null;

goBtn.addEventListener('click', function () {
    const nickname = nicknameInput.value.trim();
    const roomName = roomInput.value.trim().toLowerCase() || 'general';

    if (!nickname) {
        alert('Please enter a nickname before continuing.');
        return;
    }

    socket = io();

    socket.on('connect_success', function (data) {
        landing.classList.add('hidden');
        chatRoom.classList.remove('hidden');
        roomTitle.textContent = 'Room: #' + data.roomName;
    });

    socket.on('user_count', function (count) {
        userCount.textContent = count;
    });

    socket.on('system_message', function (msg) {
        const div = document.createElement('div');
        div.className = 'sys-msg';
        div.textContent = '[System]: ' + msg;

        chatbox.appendChild(div);
        chatbox.scrollTop = chatbox.scrollHeight;
    });

    socket.on('receive_chat', function (data) {
        const div = document.createElement('div');

        const strong = document.createElement('strong');
        strong.textContent = data.sender;

        div.appendChild(strong);
        div.appendChild(
            document.createTextNode(': ' + data.text)
        );

        chatbox.appendChild(div);
        chatbox.scrollTop = chatbox.scrollHeight;
    });

    socket.on('typing', function (data) {
        if (!typingIndicator) {
            return;
        }

        if (data.isTyping) {
            typingIndicator.textContent =
                data.username + ' is typing...';
        } else {
            typingIndicator.textContent = '';
        }
    });

    socket.on('room_full', function (msg) {
        alert(msg);
        socket.disconnect();
    });

    socket.emit('join_room', {
        nickname: nickname,
        roomName: roomName
    });
});

function sendMessage() {
    const text = msgInput.value.trim();

    if (!text || !socket) {
        return;
    }

    socket.emit('typing', false);
    socket.emit('send_chat', text);

    msgInput.value = '';
}

sendBtn.addEventListener('click', sendMessage);

msgInput.addEventListener('input', function () {
    if (!socket) {
        return;
    }

    socket.emit('typing', msgInput.value.length > 0);
});

msgInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
