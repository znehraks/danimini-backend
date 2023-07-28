import express from "express";
const router = express.Router();
import { verifyToken, getVerifiedUser } from "../utils";
import { pool } from "../connection";
import { uuid } from "uuidv4";

router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      body: { comment_content, feed_id },
    } = req;
    const id = await getVerifiedUser(req);
    if (!id) {
      throw Error(" hi");
    }
    const [rows, fields] = await pool.query(`INSERT INTO comments(
      comment_id, comment_content, feed_id, author_id
      ) VALUES (
          '${uuid()}', '${comment_content}', '${feed_id}', '${id}'
      )`);
    console.log(rows, fields);
    res.send(rows);
    return;
  } catch (e) {
    console.log(e);
    res.send({ errorCode: 2, message: e });
    return;
  }
});

export default router;
