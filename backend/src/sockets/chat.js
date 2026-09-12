// TODO (Ishra): real-time chat logic — sending/receiving messages live,
// and saving them via Prisma so history persists.

module.exports = function registerChatSockets(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
