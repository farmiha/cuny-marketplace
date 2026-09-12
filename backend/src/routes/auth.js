const express = require("express");
const router = express.Router();

// TODO (Farmiha): student verification + signup logic here.
// POST /auth/signup -> check email domain against Campus table, send OTP
// POST /auth/verify -> confirm OTP, create User row linked to Supabase auth.users.id

module.exports = router;
