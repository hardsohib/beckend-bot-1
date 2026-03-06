import express from "express";
import pool from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * Get active services
 */
router.get("/", auth, async (req, res) => {
  const services = await pool.query(
    "SELECT * FROM services WHERE is_active=true"
  );

  res.json(services.rows);
});

/**
 * Purchase service
 */
router.post("/purchase", auth, async (req, res) => {
  const { service_id } = req.body;

  if (!service_id)
    return res.status(400).json({ message: "Service ID required" });

  // Check service exists
  const service = await pool.query(
    "SELECT * FROM services WHERE id=$1",
    [service_id]
  );

  if (service.rows.length === 0)
    return res.status(404).json({ message: "Service not found" });

  // Check user balance
  const user = await pool.query(
    "SELECT * FROM users WHERE id=$1",
    [req.user.id]
  );

  if (user.rows[0].balance < service.rows[0].price)
    return res.status(400).json({ message: "Not enough balance" });

  try {
    await pool.query("BEGIN");

    // Deduct balance
    await pool.query(
      "UPDATE users SET balance = balance - $1 WHERE id=$2",
      [service.rows[0].price, req.user.id]
    );

    // Create transaction record
    await pool.query(
      "INSERT INTO transactions (user_id,type,amount,status) VALUES ($1,'service',$2,'completed')",
      [req.user.id, -service.rows[0].price]
    );

    // 🔥 Create result and return its id
    const result = await pool.query(
      `INSERT INTO results (user_id, service_id, status)
       VALUES ($1,$2,'in_progress')
       RETURNING id`,
      [req.user.id, service_id]
    );

    await pool.query("COMMIT");

    res.json({
      message: "Success",
      result_id: result.rows[0].id
    });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
