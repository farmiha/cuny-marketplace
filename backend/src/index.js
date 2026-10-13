require("dotenv/config");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");


const authRoutes = require("./routes/auth");
const campusRoutes = require("./routes/campuses");
const listingRoutes = require("./routes/listings");
const messageRoutes = require("./routes/messages");
const dashboardRoutes = require("./routes/dashboard");
const registerChatSockets = require("./sockets/chat");


const app = express();
app.use(cors());
app.use(express.json());


app.use("/auth", authRoutes);
app.use("/campuses", campusRoutes);
app.use("/listings", listingRoutes);
app.use("/messages", messageRoutes);
app.use("/dashboard", dashboardRoutes);


const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
registerChatSockets(io);


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
