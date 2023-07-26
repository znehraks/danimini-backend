import express from "express";
const router = express.Router();
import { pool } from "../connection";
import bcrypt, { genSalt } from "bcrypt";
import { uuid } from "uuidv4";
import { FieldPacket } from "mysql2";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { getVerifiedUser, verifyToken } from "../utils";
import { TEntierUserRows } from "../interfaces";
dotenv.config({ path: `${path.resolve()}/.env` });

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY as string;

const saltRounds = 10;

const getAggregateInfoSQL = (id: string) => {
  return `SELECT 
    u.user_id, 
    u.user_email, 
    u.user_desc,
    u.user_avatar,
    u.created_at AS 'user_created_at',
    u.updated_at AS 'user_updated_at',
    t.todo_id,
    t.todo_title,
    t.todo_desc,
    t.todo_point,
    t.todo_is_finished,
    t.created_at AS 'todo_created_at',
    t.updated_at AS 'todo_updated_at',
    f.feed_id,
    f.feed_title,
    f.feed_desc,
    f.feed_thumb,
    f.created_at AS 'feed_created_at',
    f.updated_at AS 'feed_updated_at'
     FROM users AS u 
    LEFT JOIN todos AS t
    ON u.user_id = t.author_id
    LEFT JOIN feeds AS f
    ON u.user_id = f.author_id AND t.todo_id = f.todo_id
    WHERE u.user_id = '${id}'
    ORDER BY f.created_at DESC;

    SELECT COUNT(feed_id) AS feed_count FROM feeds
    WHERE author_id = '${id}';

    SELECT COUNT(todo_id) AS todo_count FROM todos
    WHERE author_id = '${id}';

    SELECT COUNT(id) AS following_count FROM follows
    WHERE follower_id = '${id}';

    SELECT COUNT(id) AS follower_count FROM follows
    WHERE following_id = '${id}';`;
};

router.get("/", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const [rows] = await connection.execute("SELECT * FROM users");
  console.log(rows);
  res.send(rows);
});

router.get("/me", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const id = await getVerifiedUser(req);
    if (!id) {
      res.send({ errorCode: 0 });
      return;
    }
    const [rows] = await connection.query(getAggregateInfoSQL(id));

    console.log("here?");

    const data = {
      ...rows,
    };
    console.log("here?2");
    res.send(data);
  } catch (e) {
    console.log("에러", e);
    console.log("here?3 =================>");
    res.send({ errorCode: 1, message: e });
  }
});

router.get("/:email", verifyToken, async (req, res) => {
  const {
    params: { email },
  } = req;
  const connection = await pool.getConnection();

  console.log("야긴가?");

  try {
    const [targetId] = await connection.query(
      `SELECT user_id FROM users WHERE user_email = '${email}'`
    );
    console.log("targetId", targetId);
    const [rows] = await connection.query(
      getAggregateInfoSQL(
        (targetId as unknown as { user_id: string }[])[0].user_id
      )
    );

    console.log("rows", rows);

    console.log("here?");

    const data = {
      ...rows,
    };
    console.log("here?2");
    console.log("data", data);
    res.send(data);
    connection.end();
  } catch (e) {
    console.log("에러", e);
    console.log("here?3 =================>");
    res.send({ errorCode: 1, message: e });
  }
});

router.get("/following", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const id = await getVerifiedUser(req);
  if (!id) {
    res.send({ errorCode: 0 });
    return;
  }
  const [rows] = await connection.query(getAggregateInfoSQL(id));

  const data = {
    ...rows,
  };
  console.log(data);
  res.send(data);
});

router.get("/follower", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const id = await getVerifiedUser(req);
  if (!id) {
    res.send({ errorCode: 0 });
    return;
  }
  const [rows] = await connection.query(getAggregateInfoSQL(id));

  const data = {
    ...rows,
  };
  console.log(data);
  res.send(data);
});

router.post("/register", async (req, res) => {
  console.log(req.body);
  const { email, password: rawPassword } = req.body;
  // 아이디 중복 확인
  const connection = await pool.getConnection();
  const [alreadyExistUsers]: [TEntierUserRows[], FieldPacket[]] =
    await connection.execute(
      `SELECT user_email FROM users where user_email='${email}'`
    );

  console.log("rows", alreadyExistUsers);

  if (alreadyExistUsers.length > 0) {
    res.send({ errorCode: 1, message: "email is already exist" });
    return;
  }
  const salt = await genSalt(saltRounds);
  const password = await bcrypt.hash(rawPassword, salt);

  console.log(email, rawPassword, password);

  try {
    const [rows] = await connection.execute(
      `INSERT INTO users(user_id, user_email, user_password) VALUES ('${uuid()}', '${email}', '${password}')`
    );
    res.send(rows);
    return;
  } catch (e) {
    res.send({ errorCode: 2, message: e });
    return;
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const connection = await pool.getConnection();
  try {
    // 아이디 확인
    const [dbUser]: [TEntierUserRows[], FieldPacket[]] =
      await connection.execute(
        `SELECT user_email, user_password from users WHERE user_email='${email}'`
      );
    if (!dbUser) {
      res.send({ errorCode: 1, message: "email is not exist" });
      return;
    }

    console.log("dbPassword", dbUser);
    // 비밀번호 확인
    const isPasswordCorrect = await bcrypt.compare(
      password,
      dbUser[0].user_password
    );
    console.log("isPasswordCorrect", isPasswordCorrect);
    if (isPasswordCorrect) {
      const accessToken = jwt.sign(
        {
          email: dbUser[0].user_email,
        },
        JWT_SECRET_KEY,
        { expiresIn: "7d" }
      );
      console.log(accessToken);
      res.send({ email: dbUser[0].user_email, accessToken });
      return;
    }
    res.send({ errorCode: 2, message: "password is not correnct" });
    return;
  } catch (e) {
    console.log(e);
    res.send({ errorCode: 0, message: "Unexpected error happeded" });
    return;
  }
});
export default router;
