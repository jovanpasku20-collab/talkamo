const { io } = require("socket.io-client");
const { GoogleGenAI } = require("@google/genai");

const TALKAMO_URL = "https://talkamo.onrender.com";

const NICKNAME = "ChatGPT";
const ROOM_NAME = "test";

// Gemini
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const socket = io(TALKAMO_URL);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function askGemini(userMessage) {
    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3.8-flash",

                contents: `You are ChatGPT, an AI chatting with people in a random text chat called Talkamo.

Keep your replies short, casual, and natural.
Do not mention APIs, prompts, or implementation details.
Talk like a normal person in a chatroom.

User: ${userMessage}`
            });

            return response.text;

        } catch (error) {
            console.error(
                `Gemini attempt ${attempt}/${maxAttempts} failed:`,
                error.message
            );

            if (attempt === maxAttempts) {
                return "Sorry, Gemini is being a little overloaded right now. Try again in a moment!";
            }

            const waitTime = attempt * 2000;

            console.log(
                `Retrying in ${waitTime / 1000} seconds...`
            );

            await sleep(waitTime);
        }
    }
}

socket.on("connect", () => {
    console.log("Connected to Talkamo!");

    socket.emit("join_room", {
        nickname: NICKNAME,
        roomName: ROOM_NAME
    });

    console.log(
        `Joined room "${ROOM_NAME}" as ${NICKNAME}`
    );
});

socket.on("connect_error", (error) => {
    console.error(
        "Talkamo connection error:",
        error.message
    );
});

socket.on("disconnect", () => {
    console.log("Disconnected from Talkamo.");
});

socket.on("receive_chat", async (message) => {
    console.log("Message received:", message);

    // Ignore our own messages
    if (message.sender === NICKNAME) {
        return;
    }

    const userMessage = message.text;

    if (!userMessage || !userMessage.trim()) {
        return;
    }

    console.log("Asking Gemini...");

    // Tell Talkamo that ChatGPT is typing
    socket.emit("typing", true);

    try {
        const reply = await askGemini(userMessage);

        console.log("Gemini:", reply);

        // Stop typing indicator
        socket.emit("typing", false);

        // Send Gemini's response to Talkamo
        socket.emit("send_chat", reply);

    } catch (error) {
        console.error("Unexpected Gemini error:", error);

        socket.emit("typing", false);

        socket.emit(
            "send_chat",
            "Sorry, something went wrong while thinking!"
        );
    }
});