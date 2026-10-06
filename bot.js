```js
const { io } = require("socket.io-client");

const TALKAMO_URL = "https://talkamo.onrender.com";

const NICKNAME = "ChatGPT";
const ROOM_NAME = "test";

// Your AI API key goes here for now:
const YOUR_API_HERE = "YOUR_API_HERE";

const AI_API_URL = "YOUR_AI_API_URL_HERE";
const AI_MODEL = "YOUR_AI_MODEL_HERE";

const socket = io(TALKAMO_URL);

socket.on("connect", () => {
    console.log("Connected to Talkamo!");

    socket.emit("join_room", {
        nickname: NICKNAME,
        roomName: ROOM_NAME
    });
});

socket.on("connect_error", (error) => {
    console.error("Connection error:", error.message);
});

socket.on("disconnect", () => {
    console.log("Disconnected from Talkamo.");
});

socket.on("receive_chat", (message) => {
    console.log("Message received:", message);
});
```
