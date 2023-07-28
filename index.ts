import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import usersRouter from "./router/users";
import todosRouter from "./router/todos";
import feedsRouter from "./router/feeds";
import followsRouter from "./router/follows";
import commentsRouter from "./router/comments";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const PORT = 5000;

// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));

app.use("/users", usersRouter);
app.use("/todos", todosRouter);
app.use("/feeds", feedsRouter);
app.use("/follows", followsRouter);
app.use("/comments", commentsRouter);
