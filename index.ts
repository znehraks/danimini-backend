import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { conn } from "./connection";

const app = express();
conn.connect();
app.use(bodyParser.json());
app.use(cors());
app.get("/users", (req, res) => {
  conn.query("SELECT * FROM users", (err, rows, fields) => {
    console.log("err", err);
    console.log("rows", rows);
    console.log("fields", fields);
    res.send(rows);
  });
});

const PORT = 5000;

// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
