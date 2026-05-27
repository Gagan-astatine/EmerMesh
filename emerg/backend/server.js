const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// --- Signaling logic (Phase 2 will expand this) ---
const rooms = new Map(); // roomId -> Set of socket IDs

io.on("connection", (socket) => {
    console.log("Peer connected:", socket.id);

    // A device announces itself to a disaster "room" (geo-based or manual)
    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        if (!rooms.has(roomId)) rooms.set(roomId, new Set());
        rooms.get(roomId).add(socket.id);

        // Tell this peer who else is in the room
        const peers = [...rooms.get(roomId)].filter((id) => id !== socket.id);
        socket.emit("existing-peers", peers);

        // Tell everyone else a new peer joined
        socket.to(roomId).emit("peer-joined", socket.id);

        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Relay WebRTC signaling messages between peers
    socket.on("relay-signal", ({ targetId, signal }) => {
        io.to(targetId).emit("signal", { fromId: socket.id, signal });
    });

    socket.on("disconnecting", () => {
        for (const [roomId, members] of rooms.entries()) {
            if (members.has(socket.id)) {
                members.delete(socket.id);
                socket.to(roomId).emit("peer-left", socket.id);
                if (members.size === 0) rooms.delete(roomId);
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("Peer disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Signaling server running on port ${PORT}`));