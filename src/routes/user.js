import express from "express";
import pool from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/me", auth, async (req,res)=>{
  const user = await pool.query(
    "SELECT id, username, balance, referral_code, is_admin, receive_notifications FROM users WHERE id=$1",
    [req.user.id]
  );

  res.json(user.rows[0]);
});

  res.json(user.rows[0]);
});


export default router;
router.post("/update-notif", auth, async (req,res)=>{
  const { receive_notifications } = req.body;

  await pool.query(
    "UPDATE users SET receive_notifications=$1 WHERE id=$2",
    [receive_notifications, req.user.id]
  );

  res.json({message:"Updated"});
});
router.post("/admin/broadcast", async (req,res)=>{
  const { message } = req.body;

  const users = await pool.query(
    "SELECT telegram_id FROM users WHERE receive_notifications=true"
  );

  console.log("Broadcast to:", users.rows.length, "users");

  res.json({message:"Broadcast simulated"});
});
