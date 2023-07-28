import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { Request, RequestHandler } from "express";
import { pool } from "./connection";
import { FieldPacket } from "mysql2";
import { TPartialUserRows } from "./interfaces";
dotenv.config({ path: `${path.resolve()}/.env` });

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY as string;
export const verifyToken: RequestHandler = (req, res, next) => {
  console.log("verifyToken req ===>", req.url);
  const {
    headers: { authorization },
  } = req;

  console.log("authorization ===>", authorization);
  if (!authorization) {
    res.send({ errorCode: 0 });
    return next(new Error());
  }
  try {
    const verified = jwt.verify(authorization, JWT_SECRET_KEY);
    console.log("verified", verified);
    return next();
  } catch (e) {
    console.log("here?");
    console.log(e);

    res.send({ errorCode: -1 });
  }
};

interface IJWTPayload {
  email: string;
}

export const getVerifiedUser = async (req: Request) => {
  const {
    headers: { authorization },
  } = req;
  console.log("authorization", authorization);
  if (!authorization) return null;
  console.log("here1?");
  const { email } = jwt.verify(authorization, JWT_SECRET_KEY) as IJWTPayload;

  const connection = await pool.getConnection();
  const [id]: [TPartialUserRows[], FieldPacket[]] = await connection.execute(
    `SELECT user_id FROM users WHERE user_email = '${email}'`
  );
  console.log("here2?");
  console.log("id", id);
  if (id.length === 0) {
    connection.release();
    return null;
  }

  const { user_id } = id[0];
  connection.release();
  return user_id;
};
