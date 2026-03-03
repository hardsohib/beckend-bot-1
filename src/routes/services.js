import express from "express";
import pool from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, async (req,res)=>{
  const services = await pool.query(
    "SELECT * FROM services WHERE is_active=true"
  );
  res.json(services.rows);
});

router.post("/purchase", auth, async (req,res)=>{
  const { service_id } = req.body;

  const service = await pool.query(
    "SELECT * FROM services WHERE id=$1",
    [service_id]
  );

  if(service.rows.length === 0)
    return res.status(404).json({message:"Service not found"});

  const user = await pool.query(
    "SELECT * FROM users WHERE id=$1",
    [req.user.id]
  );

  if(user.rows[0].balance < service.rows[0].price)
    return res.status(400).json({message:"Not enough balance"});

  await pool.query("BEGIN");

  await pool.query(
    "UPDATE users SET balance = balance - $1 WHERE id=$2",
    [service.rows[0].price, req.user.id]
  );

  await pool.query(
    "INSERT INTO transactions (user_id,type,amount,status) VALUES ($1,'service',$2,'completed')",
    [req.user.id, -service.rows[0].price]
  );

  await pool.query("COMMIT");

  res.json({message:"Success"});
});

export default router;