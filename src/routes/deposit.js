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
/**
 * Confirm deposit (simulate webhook)
 */
router.post("/confirm/:id", async (req,res)=>{
  const txId = req.params.id;

  const tx = await pool.query(
    "SELECT * FROM transactions WHERE id=$1",
    [txId]
  );

  if(tx.rows.length === 0)
    return res.status(404).json({message:"Not found"});

  if(tx.rows[0].status === "completed")
    return res.json({message:"Already completed"});

  await pool.query("BEGIN");

  // Update transaction
  await pool.query(
    "UPDATE transactions SET status='completed' WHERE id=$1",
    [txId]
  );

  // Increase balance
  await pool.query(
    "UPDATE users SET balance = balance + $1 WHERE id=$2",
    [tx.rows[0].amount, tx.rows[0].user_id]
  );

  // Referral logic (10%)
  const user = await pool.query(
    "SELECT * FROM users WHERE id=$1",
    [tx.rows[0].user_id]
  );

  if(user.rows[0].referred_by){
    const refUser = await pool.query(
      "SELECT * FROM users WHERE referral_code=$1",
      [user.rows[0].referred_by]
    );

    if(refUser.rows.length){
      const bonus = Math.floor(tx.rows[0].amount * 0.10);

      await pool.query(
        "UPDATE users SET balance = balance + $1 WHERE id=$2",
        [bonus, refUser.rows[0].id]
      );

      await pool.query(
        `INSERT INTO transactions (user_id,type,amount,status)
         VALUES ($1,'referral',$2,'completed')`,
        [refUser.rows[0].id, bonus]
      );
    }
  }

  await pool.query("COMMIT");

  res.json({message:"Deposit confirmed"});
});
