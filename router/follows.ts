import express from "express";
const router = express.Router();
import { pool } from "../connection";
import { uuid } from "uuidv4";
import dotenv from "dotenv";
import path from "path";
import { getVerifiedUser, verifyToken } from "../utils";
dotenv.config({ path: `${path.resolve()}/.env` });

router.get("/", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const [rows] = await connection.execute("SELECT * FROM follows");
  console.log(rows);
  res.send(rows);
});

router.post("/", verifyToken, async (req, res) => {
  const {
    body: { following_id },
  } = req;
  const id = await getVerifiedUser(req);
  if (!id) {
    res.send({ errorCode: 0 });
    return;
  }
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`INSERT INTO follows (
      id, follower_id, following_id
    ) VALUES (
      '${uuid()}',
      '${id}',
      '${following_id}'
    )`);

    res.send(rows);
    return;
  } catch (e) {
    res.send({ errorCode: 1, message: e });
    return;
  }
});

router.delete("/", verifyToken, async (req, res) => {
  const {
    body: { following_id },
  } = req;
  const id = await getVerifiedUser(req);
  if (!id) {
    res.send({ errorCode: 0 });
    return;
  }
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`DELETE FROM follows WHERE 
    follower_id = '${id}' AND following_id = '${following_id}'
    `);

    res.send(rows);
    return;
  } catch (e) {
    res.send({ errorCode: 1, message: e });
    return;
  }
});

export default router;
