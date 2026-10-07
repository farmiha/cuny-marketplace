const supabase = require("../supabaseClient");

module.exports = async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Not logged in" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ message: "Invalid session" });
  }
  req.userId = data.user.id;
  next();
};