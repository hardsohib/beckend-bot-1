import express from "express";
import pool from "../db.js";
import auth from "../middleware/auth.js";
import bot from "../services/telegram.js";

const router = express.Router();

/**
 * User fetch own results
 */
router.get("/my", auth, async (req,res)=>{
  const results = await pool.query(
    `SELECT r.id,
            r.status,
            r.score,
            r.feedback,
            r.created_at,
            s.name
     FROM results r
     JOIN services s ON r.service_id = s.id
     WHERE r.user_id=$1
     ORDER BY r.created_at DESC`,
    [req.user.id]
  );

  res.json(results.rows);
});
/**
 * Admin adds result
 */
router.post("/admin/add", auth, async (req,res)=>{

  // check admin
  const adminCheck = await pool.query(
    "SELECT is_admin FROM users WHERE id=$1",
    [req.user.id]
  );

  if(!adminCheck.rows[0].is_admin)
    return res.status(403).json({message:"Not admin"});

  const { user_id, service_id, score, feedback } = req.body;

  const result = await pool.query(
    `INSERT INTO results (user_id, service_id, score, feedback)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [user_id, service_id, score, feedback]
  );

  // get user's telegram_id
  const user = await pool.query(
    "SELECT telegram_id FROM users WHERE id=$1",
    [user_id]
  );

  // send via Telegram
  await bot.sendMessage(
    user.rows[0].telegram_id,
    `📊 Your result is ready!\n\nScore: ${score}\n\n${feedback}`
  );

  res.json({message:"Result added and sent"});
});

export default router;
