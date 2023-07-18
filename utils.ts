import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { NextFunction, RequestHandler } from "express";
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
