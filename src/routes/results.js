import express from "express";
import pool from "../db.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

/**
 * User fetch own results
 */
router.get("/my", auth, async (req, res) => {
  const results = await pool.query(
    `SELECT r.id,
            r.status,
            r.score,
            r.feedback,
            r.created_at,
            s.name
     FROM results r
     JOIN services s ON r.service_id = s.id
     WHERE r.user_id=$1
     ORDER BY r.created_at DESC`,
    [req.user.id]
  );

  res.json(results.rows);
});

/**
 * Admin adds result (complete test)
 */
router.post("/admin/add", auth, async (req, res) => {

  const { user_id, service_id, score, feedback } = req.body;

  // Check admin
  const adminCheck = await pool.query(
    "SELECT is_admin FROM users WHERE id=$1",
    [req.user.id]
  );

  if (!adminCheck.rows[0]?.is_admin)
    return res.status(403).json({ message: "Not admin" });

  // Update pending result
  const result = await pool.query(
    `UPDATE results
     SET score=$1,
         feedback=$2,
         status='completed'
     WHERE user_id=$3
       AND service_id=$4
       AND status='pending'
     RETURNING *`,
    [score, feedback, user_id, service_id]
  );

  if (result.rows.length === 0)
    return res.status(404).json({ message: "Pending result not found" });

  // Get user telegram_id
  const userQuery = await pool.query(
    "SELECT telegram_id FROM users WHERE id=$1",
    [user_id]
  );

  const telegramId = userQuery.rows[0]?.telegram_id;

  // Send Telegram notification
  if (telegramId) {
    await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramId,
          text: `🎉 Your test has been checked!\n\nScore: ${score}\n\n${feedback}`
        })
      }
    );
  }

  res.json({ message: "Result added" });
});

/**
 * Submit Writing Test
 */
router.post(
  "/submit-writing",
  auth,
  upload.fields([
    { name: "topic_image", maxCount: 1 },
    { name: "essay_images", maxCount: 10 }
  ]),
  async (req, res) => {

    try {

      const { result_id, topic_text, essay_text } = req.body;

      let topicImage = null;
      let essayImages = [];

      if (req.files?.topic_image) {
        topicImage = req.files.topic_image[0].filename;
      }

      if (req.files?.essay_images) {
        essayImages = req.files.essay_images.map(f => f.filename);
      }

      await pool.query(
        `UPDATE results
         SET topic_text=$1,
             topic_image=$2,
             essay_text=$3,
             essay_images=$4,
             status='pending',
             submitted_at=NOW()
         WHERE id=$5 AND user_id=$6`,
        [
          topic_text,
          topicImage,
          essay_text,
          essayImages,
          result_id,
          req.user.id
        ]
      );

      res.json({ message: "Submitted successfully" });

    } catch (err) {

      console.log(err);
      res.status(500).json({ message: "Submit error" });

    }

  }
);
router.get("/admin/pending", auth, async (req,res)=>{

  const adminCheck = await pool.query(
    "SELECT is_admin FROM users WHERE id=$1",
    [req.user.id]
  );

  if(!adminCheck.rows[0]?.is_admin)
    return res.status(403).json({message:"Not admin"});

  const results = await pool.query(
    `SELECT r.id,
            r.user_id,
            r.service_id,
            r.topic_text,
            r.topic_image,
            r.essay_text,
            r.essay_images,
            u.username,
            s.name
     FROM results r
     JOIN users u ON r.user_id = u.id
     JOIN services s ON r.service_id = s.id
     WHERE r.status='pending'
     ORDER BY r.created_at ASC`
  );

  res.json(results.rows);
});
export default router;
