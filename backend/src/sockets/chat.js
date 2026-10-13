const prisma = require("../prismaClient");
const supabase = require("../supabaseClient");

module.exports = function registerChatSockets(io) {
  // Check who is connecting before allowing the socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Not logged in"));

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return next(new Error("Invalid session"));

      socket.userId = data.user.id;
      next();
    } catch (err) {
      next(new Error("Auth failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id, "userId:", socket.userId);

    // Each user joins their own room, so we can reach them on any device
    socket.join(`user:${socket.userId}`);

    // Client sends: { listingId, receiverId, content }
    socket.on("send_message", async (payload, ack) => {
      try {
        const { listingId, receiverId, content } = payload || {};
        const text = typeof content === "string" ? content.trim() : "";

        if (!listingId || !receiverId || !text) {
          return ack?.({ error: "listingId, receiverId, and content are required" });
        }
        if (text.length > 1000) {
          return ack?.({ error: "Message is too long" });
        }
        if (receiverId === socket.userId) {
          return ack?.({ error: "You can't message yourself" });
        }

        const listing = await prisma.listing.findUnique({
          where: { id: Number(listingId) },
        });
        if (!listing) return ack?.({ error: "Listing not found" });

        // One side of every chat must be the listing's seller
        if (listing.sellerId !== socket.userId && listing.sellerId !== receiverId) {
          return ack?.({ error: "Messages must be between a buyer and the seller" });
        }

        const message = await prisma.message.create({
          data: {
            content: text,
            senderId: socket.userId,
            receiverId,
            listingId: listing.id,
          },
        });

        // Deliver to the receiver and back to the sender's own devices
        io.to(`user:${receiverId}`).emit("new_message", message);
        io.to(`user:${socket.userId}`).emit("new_message", message);

        ack?.({ ok: true, message });
      } catch (err) {
        console.error("send_message failed:", err);
        ack?.({ error: "Could not send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};