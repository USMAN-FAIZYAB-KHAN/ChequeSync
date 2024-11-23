import { io } from "socket.io-client";

// Replace with your server URL
const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("Connected to server:", socket.id);

    // Emit a test notification event
    socket.emit("sendNotification", { message: "Hello from test client!" });

    // Listen for notifications
    socket.on("receiveNotification", (data) => {
        console.log("Notification received:", data);
    });
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});
