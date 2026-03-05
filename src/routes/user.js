import bot from "../services/telegram.js";
import express from "express";
import pool from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * Get current user
 */
router.get("/me", auth, async (req, res) => {
  const user = await pool.query(
    "SELECT id, username, balance, referral_code, is_admin, receive_notifications FROM users WHERE id=$1",
    [req.user.id]
  );

  res.json(user.rows[0]);
});

/**
 * Update notification preference
 */
router.post("/update-notif", auth, async (req, res) => {
  const { receive_notifications } = req.body;

  await pool.query(
    "UPDATE users SET receive_notifications=$1 WHERE id=$2",
    [receive_notifications, req.user.id]
  );

  res.json({ message: "Updated" });
});

/**
 * Admin broadcast (test mode)
 */
router.post("/admin/broadcast", auth, async (req, res) => {

  const adminCheck = await pool.query(
    "SELECT is_admin FROM users WHERE id=$1",
    [req.user.id]
  );

  if (!adminCheck.rows[0].is_admin)
    return res.status(403).json({ message: "Not admin" });

  const { message } = req.body;

  if (!message)
    return res.status(400).json({ message: "No message" });

  const users = await pool.query(
    "SELECT telegram_id FROM users WHERE receive_notifications=true"
  );

  let sent = 0;

  for (const user of users.rows) {
    try {
      await bot.sendMessage(user.telegram_id, message);
      sent++;
    } catch {}
  }

  res.json({ message: `Sent to ${sent} users` });
});
router.get("/referral-stats", auth, async (req,res)=>{

  const totalEarned = await pool.query(
    "SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id=$1 AND type='referral'",
    [req.user.id]
  );

  const totalUsers = await pool.query(
    "SELECT COUNT(*) FROM users WHERE referred_by=$1",
    [req.user.id]
  );

  res.json({
    earned: totalEarned.rows[0].total,
    users: totalUsers.rows[0].count
  });
});
export default router;


