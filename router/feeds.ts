import express from "express";
const router = express.Router();
import { pool } from "../connection";
import { uuid } from "uuidv4";
import { getVerifiedUser, verifyToken } from "../utils";
import { FieldPacket, RowDataPacket } from "mysql2";

router.get("/", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const [rows] = await connection.execute("SELECT * FROM feeds");
  console.log(rows);
  res.send(rows);
});

router.get("/me", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const id = await getVerifiedUser(req);
  const [rows] = await connection.execute(
    `SELECT * FROM feeds WHERE author_id='${id}'`
  );
  console.log(rows);
  res.send(rows);
});

router.get("/following", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const id = await getVerifiedUser(req);
  const [rows] = (await connection.execute(
    `SELECT 
    u.user_email,
    u.user_avatar,
    f.feed_id, 
    f.feed_title, 
    f.feed_desc, 
    f.feed_thumb, 
    f.author_id as feed_author_id, 
    f.todo_id, 
    f.created_at as feed_created_at, 
    f.updated_at as feed_updated_at,
    c.comment_id,
    c.comment_content,
    c.author_id as comment_author_id,
    cu.user_email as comment_author_email,
    c.created_at as comment_created_at,
    c.updated_at as comment_updated_at
    FROM feeds AS f 
    LEFT JOIN comments AS c 
    ON f.feed_id = c.feed_id
    LEFT JOIN users AS u
    ON f.author_id = u.user_id
    LEFT JOIN users AS cu
	  ON cu.user_id = c.author_id
    WHERE f.author_id = '${id}'
    OR(
    f.author_id IN (SELECT following_id FROM FOLLOWS as fo 
    WHERE fo.follower_id = '${id}'))  
    ORDER BY f.created_at DESC
    LIMIT 10
        `
  )) as [rows: RowDataPacket[], fields: FieldPacket[]];

  console.log(rows);

  const data: {
    user_email: string;
    user_avatar: string;
    feed_id: string;
    feed_title: string;
    feed_desc: string;
    feed_thumb: string;
    feed_author_id: string;
    todo_id: string;
    feed_created_at: string;
    feed_updated_at: string;
  }[] = [];

  const checked: string[] = [];

  rows.forEach((item) => {
    if (!checked.includes(item.feed_id)) {
      console.log(item.feed_id);
      checked.push(item.feed_id);
      data.push({
        user_email: item.user_email,
        user_avatar: item.user_avatar,
        feed_id: item.feed_id,
        feed_title: item.feed_title,
        feed_desc: item.feed_desc,
        feed_thumb: item.feed_thumb,
        feed_author_id: item.feed_author_id,
        todo_id: item.todo_id,
        feed_created_at: item.feed_created_at,
        feed_updated_at: item.feed_updated_at,
      });
    }
  });
  const comments: {
    comment_id: string | null;
    comment_content: string | null;
    comment_author_id: string | null;
    comment_author_email: string | null;
    comment_created_at: string | null;
    comment_updated_at: string | null;
  }[][] = checked.map((item) => {
    return rows
      .filter((r) => r.feed_id === item)
      .map((mItem) => ({
        comment_id: mItem.comment_id,
        comment_content: mItem.comment_content,
        comment_author_id: mItem.comment_author_id,
        comment_author_email: mItem.comment_author_email,
        comment_created_at: mItem.comment_created_at,
        comment_updated_at: mItem.comment_updated_at,
      }));
  });
  console.log("comments", comments);
  console.log("checked", checked);
  console.log("data", data);
  const resData = data.map((item, idx) => ({
    ...item,
    comments: comments[idx],
  }));
  console.log("resData", resData);
  res.send(resData);
});

router.post("/", verifyToken, async (req, res) => {
  const {
    body: { feed_title, feed_desc, feed_thumb, todo_id },
  } = req;
  const connection = await pool.getConnection();
  const id = await getVerifiedUser(req);
  if (!id) {
    res.send({ errorCode: 0 });
    return;
  }
  try {
    const [rows] = await connection.execute(`INSERT INTO feeds(
    feed_id, feed_title, feed_desc, feed_thumb, author_id, todo_id
    ) VALUES (
        '${uuid()}', '${feed_title}', '${feed_desc}','${
      feed_thumb ?? null
    }','${id}','${todo_id}'
    )`);
    res.send(rows);
    return;
  } catch (e) {
    res.send({ errorCode: 2, message: e });
    return;
  }
});

export default router;
