require("dotenv/config");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const analyticsRouter = require("./routes/analytics");


const authRoutes = require("./routes/auth");
const campusRoutes = require("./routes/campuses");
const listingRoutes = require("./routes/listings");
const messageRoutes = require("./routes/messages");
const dashboardRoutes = require("./routes/dashboard");
const cartRoutes = require("./routes/cart");
const paymentRoutes = require("./routes/payments");
const stripeWebhook = require("./routes/stripeWebhook");
const registerChatSockets = require("./sockets/chat");
const { startCleanupJob } = require("./cleanupMessage/cleanupMessage");





const app = express();
app.use(cors());

// Stripe's webhook needs the RAW request body, so it has to be registered
// BEFORE express.json() (which would turn the body into an object).
app.post(
  "/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

app.use(express.json());


app.use("/auth", authRoutes);
app.use("/campuses", campusRoutes);
app.use("/listings", listingRoutes);
app.use("/analytics", analyticsRouter);
app.use("/messages", messageRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/cart", cartRoutes);
app.use("/payments", paymentRoutes);


const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
registerChatSockets(io);


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  startCleanupJob();
});

