const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const supabase = require("../supabaseClient");


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
 if (domain !== campus.emailDomain.toLowerCase()) {
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


 const { campusId, year, expectedGraduation } = req.body;
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


 if (email.split("@")[1] !== campus.emailDomain.toLowerCase()) {
   return res
     .status(403)
     .json({ message: "Email does not match that campus" });
 }


 const existing = await prisma.user.findUnique({ where: { id } });
 if (existing) {
   return res.json(existing);
 }


 const user = await prisma.user.create({
   data: { id, email, campusId: campus.id, year, expectedGraduation },
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


module.exports = router;
