import express from "express";
import pool from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/my", auth, async (req,res)=>{
  const results = await pool.query(
    `SELECT r.id, r.score, r.feedback, r.created_at, s.name
     FROM results r
     JOIN services s ON r.service_id = s.id
     WHERE r.user_id=$1
     ORDER BY r.created_at DESC`,
    [req.user.id]
  );

  res.json(results.rows);
});

export default router;
