const prisma = require("../prismaClient");

// Safe, busy, public places on campus. The chat shows these first.
const SAFE_SPOTS = [
  "Library (main entrance)",
  "Security / Public Safety desk",
  "Student center lobby",
  "Main building lobby",
  "Cafeteria / food court",
];

const MIN_LEAD_MINUTES = 10; // can't propose a time that is basically now
const MAX_DAYS_AHEAD = 30;
const REMINDER_MINUTES = 60; // the bell reminds both people this long before
const DONE_AFTER_HOURS = 3; // a confirmed meetup counts as done this long after it starts

// meetups close themselves, no timer needed: we tidy up whenever someone loads a chat
async function expireStaleMeetups() {
  const now = new Date();
  await prisma.meetup.updateMany({
    where: { status: "pending", startsAt: { lt: now } },
    data: { status: "expired" },
  });
  await prisma.meetup.updateMany({
    where: {
      status: "confirmed",
      startsAt: { lt: new Date(now.getTime() - DONE_AFTER_HOURS * 60 * 60 * 1000) },
    },
    data: { status: "done" },
  });
}

// returns an error message, or null when the time + spot are fine
function checkProposal(startsAt, spot) {
  if (!startsAt || isNaN(startsAt.getTime())) return "Pick a date and time.";
  const now = Date.now();
  if (startsAt.getTime() < now + MIN_LEAD_MINUTES * 60 * 1000) {
    return "Pick a time at least 10 minutes from now.";
  }
  if (startsAt.getTime() > now + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000) {
    return "Pick a time within the next 30 days.";
  }
  if (typeof spot !== "string" || spot.trim().length < 2 || spot.trim().length > 80) {
    return "Pick a meetup spot.";
  }
  return null;
}

module.exports = {
  SAFE_SPOTS,
  REMINDER_MINUTES,
  expireStaleMeetups,
  checkProposal,
};