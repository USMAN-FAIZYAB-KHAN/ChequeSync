import dotenv from "dotenv";
import connection from "./db/dbConnection.js";
import { app } from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import users from "./globals/global.js";

const domain = '0.0.0.0';

// Load environment variables
dotenv.config({
    path: "./.env"
});

// Use the port from the environment variable or default to 3000
const port = process.env.PORT || 3000;

// Create HTTP server and initialize Socket.IO
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});

// Object to store the mapping between user IDs and their socket IDs


// MongoDB connection
connection()
    .then(() => {
        server.listen(port, domain, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => console.log("MongoDB connection failed", err));

// Socket.IO connection
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    

    // Listen for user login event and associate the socket ID with the user ID
    socket.on("registerUser", (userId) => {
        console.log(userId)
        console.log(`User ${userId.userId} registered with socket ${socket.id}`);
        users[userId.userId] = socket.id; // Store user ID and socket ID mapping
        let message = `${userId.userId} has been registered`
        io.to(users[userId.userId]).emit("receiveConfirmation", { message });
        console.log(users)
    });

    // Listen for notification events
    socket.on("sendNotification", (data) => {
        console.log("Notification received:", data);

        // Assuming the message has a recipient userId
        const { recipientUserId, message } = data;

        if (users[recipientUserId]) {
            // Emit notification to the specific user (one-to-one)
            io.to(users[recipientUserId]).emit("receiveNotification", { message });
            console.log(`Notification sent to user ${recipientUserId}`);
        } else {
            console.log(`User ${recipientUserId} not connected`);
        }
    });

    // Handle client disconnection
    socket.on("disconnect", () => {
        // Remove the user from the mapping when they disconnect
        for (const [userId, socketId] of Object.entries(users)) {
            if (socketId === socket.id) {
                console.log(`User ${userId} disconnected`);
                delete users[userId]; // Remove the user from the map
                break;
            }
        }
    });
});

export { io };
