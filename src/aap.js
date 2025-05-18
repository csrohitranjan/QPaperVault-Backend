import express from "express";
import cookiesParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookiesParser());

app.get("/", (req, res) => {
  res.status(200).send(`
        <div style="text-align: center;">
            <h1>Welcome to QPaperVault</h1>
            <p>Developed by Mr. Rohit Ranjan</p>
            <p>😊🎓📚</p>
        </div>
    `);
});

export default app;
