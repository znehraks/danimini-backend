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

router.get("/", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const [rows] = await connection.execute("SELECT * FROM users");
  console.log(rows);
  res.send(rows);
});

router.get("/me", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const id = await getVerifiedUser(req);
  const [rows] = await connection.execute(
    `SELECT * FROM users WHERE user_id='${id}'`
  );
  console.log(rows);
  res.send(rows);
});

router.get("/following", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const id = await getVerifiedUser(req);
  const [rows] = await connection.execute(
    `SELECT * FROM users 
        WHERE user_id = '${id}'
        OR(
          user_id IN (SELECT following_id FROM FOLLOWS 
        WHERE follower_id = '${id}'))  
        `
  );
  console.log(rows);
  res.send(rows);
});

router.get("/follower", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  const id = await getVerifiedUser(req);
  const [rows] = await connection.execute(
    `SELECT * FROM users WHERE(
          user_id IN (SELECT follower_id FROM FOLLOWS 
        WHERE following_id = '${id}')
        )  
        `
  );
  console.log(rows);
  res.send(rows);
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
        { expiresIn: "1d" }
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
