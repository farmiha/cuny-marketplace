const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const supabase = require("../supabaseClient");

// emails allowed to sign up even if they're not a school email, for testing only
// set TEST_EMAILS in your own backend/.env, for example: TEST_EMAILS=lockin8709@gmail.com
const TEST_EMAILS = (process.env.TEST_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const isTestEmail = (email) =>
  TEST_EMAILS.includes(String(email).toLowerCase());

// Check the email matches the selected campus's domain,
// before Supabase sends any verification code.
router.post("/check-domain", async (req, res) => {
  const { email, campusId } = req.body;

  if (!email || !campusId) {
    return res.status(400).json({ message: "email and campusId are required" });
  }

  const campus = await prisma.campus.findUnique({
    where: { id: Number(campusId) },
  });
  if (!campus) {
    return res.status(404).json({ message: "Campus not found" });
  }

  const domain = email.split("@")[1]?.toLowerCase();
  if (!isTestEmail(email) && domain !== campus.emailDomain.toLowerCase()) {
    return res.status(403).json({
      message: `That email doesn't match ${campus.name} (it should end in @${campus.emailDomain})`,
    });
  }

  res.json({ valid: true });
});

// After the code is verified, create the User row.
router.post("/complete-signup", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Not logged in" });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ message: "Invalid session" });
  }

  // name is new, it comes from the "Full name" field on the signup form
  const { name, campusId, year, expectedGraduation } = req.body;
  if (!campusId || !year || !expectedGraduation) {
    return res
      .status(400)
      .json({ message: "campusId, year, and expectedGraduation are required" });
  }

  const campus = await prisma.campus.findUnique({
    where: { id: Number(campusId) },
  });
  if (!campus) {
    return res.status(404).json({ message: "Campus not found" });
  }

  const id = data.user.id;
  const email = data.user.email.toLowerCase();

  if (
    !isTestEmail(email) &&
    email.split("@")[1] !== campus.emailDomain.toLowerCase()
  ) {
    return res
      .status(403)
      .json({ message: "Email does not match that campus" });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (existing) {
    return res.json(existing);
  }

  const user = await prisma.user.create({
    data: {
      id,
      email,
      name: name?.trim() || null, // save the name, or leave it empty if none was sent
      campusId: campus.id,
      year,
      expectedGraduation,
    },
  });

  res.status(201).json(user);
});

// Used by the login flow to check if a verified email already has an account
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Not logged in" });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ message: "Invalid session" });
  }

  const user = await prisma.user.findUnique({ where: { id: data.user.id } });
  res.json(user);
});

// ---------- backup email (for after the stu-mail stops working) ----------

// get the logged in Supabase user from a token, or null
async function getAuthUser(token) {
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// a backup email has to be a real, personal address that nobody else is using
async function checkBackupEmail(rawEmail, me) {
  const email = String(rawEmail || "")
    .trim()
    .toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 400, error: "Enter a valid email address" };
  }
  if (email === me.email) {
    return {
      status: 400,
      error: "Your backup email has to be different from your school email",
    };
  }
  if (email.split("@")[1].endsWith("cuny.edu")) {
    return {
      status: 400,
      error:
        "Use a personal email (like Gmail), CUNY emails stop working after you graduate",
    };
  }

  const taken = await prisma.user.findFirst({
    where: { OR: [{ email }, { backupEmail: email }], NOT: { id: me.id } },
  });
  if (taken) {
    return {
      status: 409,
      error: "That email is already used by another account",
    };
  }

  return { email };
}

// Step 1 of adding a backup email: check it before we send a code to it.
router.post("/backup-email/check", async (req, res) => {
  const authUser = await getAuthUser(
    req.headers.authorization?.replace("Bearer ", ""),
  );
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const me = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!me) return res.status(404).json({ message: "Account not found" });

  const result = await checkBackupEmail(req.body.backupEmail, me);
  if (result.error)
    return res.status(result.status).json({ message: result.error });

  res.json({ ok: true });
});

// Step 2: the student typed the code we sent to the backup email.
// The frontend sends us the session it got for that email as "backupToken",
// which proves they own it. We save it, then delete that throwaway Supabase user.
router.post("/backup-email/save", async (req, res) => {
  const authUser = await getAuthUser(
    req.headers.authorization?.replace("Bearer ", ""),
  );
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const me = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!me) return res.status(404).json({ message: "Account not found" });

  const backupAuth = await getAuthUser(req.body.backupToken);
  if (!backupAuth || !backupAuth.email || !backupAuth.email_confirmed_at) {
    return res.status(400).json({ message: "We couldn't verify that email" });
  }

  // never touch a real account
  const realAccount = await prisma.user.findUnique({
    where: { id: backupAuth.id },
  });
  if (realAccount) {
    return res
      .status(409)
      .json({ message: "That email is already used by another account" });
  }

  const result = await checkBackupEmail(backupAuth.email, me);
  if (result.error)
    return res.status(result.status).json({ message: result.error });

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: { backupEmail: result.email },
  });

  // the throwaway Supabase user was only used to send the code
  const { error: deleteError } = await supabase.auth.admin.deleteUser(
    backupAuth.id,
  );
  if (deleteError)
    console.error("Could not delete temp backup user:", deleteError.message);

  res.json({ backupEmail: updated.backupEmail });
});

// ---------- recovery login (student lost access to the stu-mail) ----------

// Check a backup email belongs to an account, before we send it a code.
router.post("/recover/lookup", async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  if (!email) return res.status(400).json({ message: "email is required" });

  const user = await prisma.user.findUnique({ where: { backupEmail: email } });
  if (!user) {
    return res.status(404).json({
      message:
        "No account uses that backup email. You can only recover if you added one in your profile.",
    });
  }

  res.json({ found: true });
});

// The student typed the code sent to their backup email. The frontend sends the
// session it got for that email, which proves they own it. We find their real
// account and hand back a one-time token the frontend uses to log in as them.
router.post("/recover/complete", async (req, res) => {
  const backupAuth = await getAuthUser(
    req.headers.authorization?.replace("Bearer ", ""),
  );
  if (!backupAuth || !backupAuth.email || !backupAuth.email_confirmed_at) {
    return res.status(401).json({ message: "We couldn't verify that email" });
  }

  // never touch a real account
  const realAccount = await prisma.user.findUnique({
    where: { id: backupAuth.id },
  });
  if (realAccount) {
    return res
      .status(400)
      .json({ message: "Something went wrong, please try again" });
  }

  const user = await prisma.user.findUnique({
    where: { backupEmail: backupAuth.email.toLowerCase() },
  });
  if (!user) {
    return res
      .status(404)
      .json({ message: "No account uses that backup email" });
  }

  const { data: link, error: linkError } =
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
    });
  if (linkError || !link?.properties?.hashed_token) {
    return res
      .status(500)
      .json({ message: "Could not sign you in, please try again" });
  }

  // the throwaway Supabase user was only used to send the code
  const { error: deleteError } = await supabase.auth.admin.deleteUser(
    backupAuth.id,
  );
  if (deleteError)
    console.error("Could not delete temp backup user:", deleteError.message);

  res.json({ tokenHash: link.properties.hashed_token });
});

module.exports = router;
