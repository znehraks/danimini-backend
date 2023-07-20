import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { Request, RequestHandler } from "express";
import { pool } from "./connection";
import { FieldPacket, RowDataPacket } from "mysql2";
import { TPartialUserRows } from "./interfaces";
dotenv.config({ path: `${path.resolve()}/.env` });

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY as string;
export const verifyToken: RequestHandler = (req, res, next) => {
  const {
    headers: { authorization },
  } = req;
  if (!authorization) {
    res.send({ errorCode: 0 });
    return;
  }
  const verified = jwt.verify(authorization, JWT_SECRET_KEY);
  console.log("verified", verified);
  return next();
};

interface IJWTPayload {
  email: string;
}

export const getVerifiedUser = async (req: Request) => {
  const {
    headers: { authorization },
  } = req;
  if (!authorization) return null;
  const { email } = jwt.verify(authorization, JWT_SECRET_KEY) as IJWTPayload;

  const connection = await pool.getConnection();
  const [id]: [TPartialUserRows[], FieldPacket[]] = await connection.execute(
    `SELECT user_id FROM users WHERE user_email = '${email}'`
  );
  if (id.length === 0) {
    return null;
  }

  const { user_id } = id[0];
  return user_id;
};
