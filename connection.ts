import * as dotenv from "dotenv";
import path from "path";
import mysql from "mysql";

dotenv.config({ path: `${path.resolve()}/.env` });
export const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});
