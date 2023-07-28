import express from "express";
const router = express.Router();
import { verifyToken, getVerifiedUser } from "../utils";
import { pool } from "../connection";
import { uuid } from "uuidv4";

router.post("/", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      body: { comment_content, feed_id },
    } = req;
    const id = await getVerifiedUser(req);
    if (!id) {
      connection.release();
      throw Error(" hi");
    }
    const [rows, fields] = await connection.execute(`INSERT INTO comments(
      comment_id, comment_content, feed_id, author_id
      ) VALUES (
          '${uuid()}', '${comment_content}', '${feed_id}', '${id}'
      )`);
    console.log(rows, fields);
    res.send(rows);
    connection.release();
    return;
  } catch (e) {
    connection.release();
    console.log(e);
    res.send({ errorCode: 2, message: e });
    return;
  }
});

export default router;
