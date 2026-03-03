import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/telegram", async (req,res)=>{
  const { initData } = req.body;

  if(!initData) return res.status(400).json({message:"No data"});

  const params = new URLSearchParams(initData);
  const userData = JSON.parse(params.get("user"));

  const telegram_id = userData.id;
  const username = userData.username || "";

  let user = await pool.query(
    "SELECT * FROM users WHERE telegram_id=$1",
    [telegram_id]
  );

  if(user.rows.length === 0){

    const referralCode = Math.random().toString(36).substring(2,8);

    await pool.query(
      "INSERT INTO users (telegram_id,username,balance,referral_code,is_admin) VALUES ($1,$2,0,$3,false)",
      [telegram_id, username, referralCode]
    );

    user = await pool.query(
      "SELECT * FROM users WHERE telegram_id=$1",
      [telegram_id]
    );
  }

  const token = jwt.sign(
    { id:user.rows[0].id },
    process.env.JWT_SECRET,
    { expiresIn:"7d" }
  );

  res.json({ token });
});

export default router;