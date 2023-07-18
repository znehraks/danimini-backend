import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import usersRouter from "./router/users";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const PORT = 5000;

// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));

app.use("/users", usersRouter);
