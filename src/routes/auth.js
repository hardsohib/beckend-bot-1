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

  let user = await pool.query(
    "SELECT * FROM users WHERE telegram_id=$1",
    [telegram_id]
  );

  let userData;

  if(user.rows.length === 0){

    const newUser = await pool.query(
      `INSERT INTO users 
       (telegram_id, username, balance)
       VALUES ($1,$2,0)
       RETURNING *`,
      [telegram_id, username]
    );

    userData = newUser.rows[0];

  }else{
    userData = user.rows[0];
  }

  const token = jwt.sign(
    { id: userData.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });

});

export default router;
