import express from "express";
const router = express.Router();
import { pool } from "../connection";
import { uuid } from "uuidv4";
import { getVerifiedUser, verifyToken } from "../utils";

router.get("/", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const [rows] = await connection.execute("SELECT * FROM todos");
  console.log(rows);
  res.send(rows);
});

router.get("/me", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const id = await getVerifiedUser(req);
  const [rows] = await connection.execute(
    `SELECT * FROM todos WHERE author_id='${id}'`
  );
  console.log(rows);
  res.send(rows);
});

router.get("/following", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const id = await getVerifiedUser(req);
  const [rows] = await connection.execute(
    `SELECT * FROM todos 
        WHERE author_id = '${id}'
        OR(
        author_id IN (SELECT following_id FROM FOLLOWS 
        WHERE follower_id = '${id}'))  
        `
  );
  console.log(rows);
  res.send(rows);
});

router.post("/", verifyToken, async (req, res) => {
  const {
    body: { todo_title, todo_desc, todo_point },
  } = req;
  const connection = await pool.getConnection();
  const id = await getVerifiedUser(req);
  if (!id) {
    res.send({ errorCode: 0 });
    return;
  }
  try {
    const [rows] = await connection.execute(`INSERT INTO todos(
    todo_id, todo_title, todo_desc, todo_point, author_id
    ) VALUES (
        '${uuid()}','${todo_title}','${todo_desc}', '${todo_point}', '${id}'
    )`);
    res.send(rows);
    return;
  } catch (e) {
    res.send({ errorCode: 2, message: e });
    return;
  }
});

export default router;
