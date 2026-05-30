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

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/nearby-emergencies", async (req, res) => {
    const { lat, lng } = req.query;
    
    // Fallback emergency contacts
    const fallbacks = {
        police: {
            name: "National Police Helpline",
            phone: "+91100",
            address: "Closest police emergency dispatch",
            distance: "National Line"
        },
        ambulance: {
            name: "National Ambulance & Medical Service",
            phone: "+91108",
            address: "Closest hospital/medical responder dispatch",
            distance: "National Line"
        }
    };

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    if (!lat || !lng) {
        return res.json({
            ...fallbacks,
            note: "No coordinates provided. Loaded national emergency lines."
        });
    }

    if (!apiKey) {
        console.warn("GOOGLE_MAPS_API_KEY is not defined. Returning fallback national helplines.");
        return res.json({
            ...fallbacks,
            note: "Google Maps API Key not configured. Loaded national emergency lines."
        });
    }

    try {
        // Query nearest police station using Places API Nearby Search
        const policeSearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=police&key=${apiKey}`;
        const policeRes = await fetch(policeSearchUrl);
        const policeData = await policeRes.json();

        // Query nearest hospital using Places API Nearby Search
        const hospitalSearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=hospital&key=${apiKey}`;
        const hospitalRes = await fetch(hospitalSearchUrl);
        const hospitalData = await hospitalRes.json();

        const results = {
            police: null,
            ambulance: null
        };

        // Helper to query Place Details to fetch formatted_phone_number
        const getPlaceDetails = async (placeId) => {
            try {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,vicinity,geometry&key=${apiKey}`;
                const res = await fetch(detailsUrl);
                const data = await res.json();
                if (data.status === "OK" && data.result) {
                    return data.result;
                }
            } catch (err) {
                console.error(`Error querying details for place ${placeId}:`, err);
            }
            return null;
        };

        // Process nearest police station
        if (policeData.status === "OK" && policeData.results && policeData.results.length > 0) {
            const nearestPolice = policeData.results[0];
            const details = await getPlaceDetails(nearestPolice.place_id);
            results.police = {
                name: details?.name || nearestPolice.name,
                phone: details?.formatted_phone_number || null,
                address: details?.vicinity || nearestPolice.vicinity || "Nearby Police Station",
                distance: "Nearest Location"
            };
        }

        // Process nearest hospital/ambulance service
        if (hospitalData.status === "OK" && hospitalData.results && hospitalData.results.length > 0) {
            const nearestHospital = hospitalData.results[0];
            const details = await getPlaceDetails(nearestHospital.place_id);
            results.ambulance = {
                name: details?.name || nearestHospital.name,
                phone: details?.formatted_phone_number || null,
                address: details?.vicinity || nearestHospital.vicinity || "Nearby Medical Service",
                distance: "Nearest Location"
            };
        }

        // Apply fallback values if Google returns nothing or values lack fields
        if (!results.police) {
            results.police = fallbacks.police;
        } else if (!results.police.phone) {
            results.police.phone = fallbacks.police.phone;
            results.police.note = "Contact number missing in search results. Routed to national police helpline.";
        }

        if (!results.ambulance) {
            results.ambulance = fallbacks.ambulance;
        } else if (!results.ambulance.phone) {
            results.ambulance.phone = fallbacks.ambulance.phone;
            results.ambulance.note = "Contact number missing in search results. Routed to national medical helpline.";
        }

        return res.json(results);

    } catch (error) {
        console.error("API error fetching nearby services from Google Maps:", error);
        return res.json({
            ...fallbacks,
            error: "Failed to fetch from Google Maps. Loaded national emergency lines."
        });
    }
});

const rooms = new Map();

io.on("connection", (socket) => {
    console.log("Peer connected:", socket.id);

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        if (!rooms.has(roomId)) rooms.set(roomId, new Set());
        rooms.get(roomId).add(socket.id);

        const peers = [...rooms.get(roomId)].filter((id) => id !== socket.id);
        socket.emit("existing-peers", peers);

        socket.to(roomId).emit("peer-joined", socket.id);

        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

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