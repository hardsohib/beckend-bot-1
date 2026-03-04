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
