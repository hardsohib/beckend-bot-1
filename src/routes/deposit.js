import express from "express";
import pool from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * Create deposit (TEST MODE)
 */
router.post("/create", auth, async (req,res)=>{
  const { amount } = req.body;

  if(!amount || amount <= 0)
    return res.status(400).json({message:"Invalid amount"});

  const tx = await pool.query(
    `INSERT INTO transactions (user_id,type,amount,status)
     VALUES ($1,'deposit',$2,'checking')
     RETURNING *`,
    [req.user.id, amount]
  );

  res.json({
    message:"Deposit created (test mode)",
    transaction_id: tx.rows[0].id
  });
});

export default router;
