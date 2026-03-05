import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/telegram", async (req,res)=>{

  const { initData } = req.body;

  if(!initData)
    return res.status(400).json({message:"No data"});

  const params = new URLSearchParams(initData);

  const userRaw = params.get("user");
  if(!userRaw)
    return res.status(400).json({message:"No user data"});

  const tgUser = JSON.parse(userRaw);

  const telegram_id = tgUser.id;
  const username = tgUser.username || "";

  // 🔥 GET REFERRAL FROM TELEGRAM START PARAM
  const startParam = params.get("start_param"); // very important

  let user = await pool.query(
    "SELECT * FROM users WHERE telegram_id=$1",
    [telegram_id]
  );

  let userData;

  // ==============================
  // CREATE NEW USER (WITH REFERRAL)
  // ==============================
  if(user.rows.length === 0){

    let referredById = null;

    if(startParam){

      const refUser = await pool.query(
        "SELECT id FROM users WHERE referral_code=$1",
        [startParam]
      );

      if(refUser.rows.length > 0){
        referredById = refUser.rows[0].id;
      }
    }

    const newCode = Math.random().toString(36).substring(2,8);

    const newUser = await pool.query(
      `INSERT INTO users 
       (telegram_id, username, referral_code, referred_by, balance)
       VALUES ($1,$2,$3,$4,0)
       RETURNING *`,
      [telegram_id, username, newCode, referredById]
    );

    userData = newUser.rows[0];

  }else{
    userData = user.rows[0];
  }

  // ==============================
  // CREATE JWT TOKEN
  // ==============================
  const token = jwt.sign(
    { id: userData.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });

});

export default router;
