const prisma = require("../prismaClient");

const INACTIVE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Deletes every message in chats whose newest message is older than 30 days.
// A chat = same listing + same two people.
async function cleanupInactiveChats({ dryRun = false } = {}) {
  const cutoff = new Date(Date.now() - INACTIVE_DAYS * DAY_MS);

  const msgs = await prisma.message.findMany({
    select: { id: true, listingId: true, senderId: true, receiverId: true, createdAt: true },
  });

  // group messages into chats
  const chats = new Map();
  for (const m of msgs) {
    const pair = [m.senderId, m.receiverId].sort().join(":");
    const key = `${m.listingId}:${pair}`;
    if (!chats.has(key)) chats.set(key, { ids: [], newest: m.createdAt });
    const chat = chats.get(key);
    chat.ids.push(m.id);
    if (m.createdAt > chat.newest) chat.newest = m.createdAt;
  }

  // keep only the chats with no recent message
  const staleChats = [...chats.values()].filter((c) => c.newest < cutoff);
  const idsToDelete = staleChats.flatMap((c) => c.ids);

  if (!dryRun) {
    for (let i = 0; i < idsToDelete.length; i += 1000) {
      await prisma.message.deleteMany({
        where: { id: { in: idsToDelete.slice(i, i + 1000) } },
      });
    }
  }

  return { dryRun, staleChats: staleChats.length, messages: idsToDelete.length };
}

function startCleanupJob() {
  const dryRun = process.env.CLEANUP_DRY_RUN === "true";

  const run = async () => {
    try {
      const result = await cleanupInactiveChats({ dryRun });
      console.log("Chat cleanup:", result);
    } catch (err) {
      console.error("Chat cleanup failed:", err);
    }
  };

  setTimeout(run, 10 * 1000); // once shortly after startup
  setInterval(run, DAY_MS); // then every 24 hours
}

module.exports = { cleanupInactiveChats, startCleanupJob };