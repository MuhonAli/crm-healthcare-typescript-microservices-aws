import express from "express";
import dotEnv from "dotenv";
import bodyParser from "body-parser";
import connectDb from "./config/db.js";
import cors from "cors";
import conversationRoutes from "./routers/conversationRoutes.js";
dotEnv.config(); // allow .env file to load

const app = express(); // initializing express app

const corsOptions = {
  // cors configuration options
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions)); // enable cors

app.use(bodyParser.urlencoded({ extended: false })); // enable body parsing

connectDb(); // connect to database

app.use(express.json({ limit: "3.5mb" })); // enable JSON serialization

// The Conversation Route
app.use("/api", conversationRoutes);

// Demo Route for testing
app.get("/", (req, res) => {
  res.send("Conversation Microservice is running...");
});

const Port = process.env.PORT || 8080;
// listening to the port
app.listen(Port, console.log("Listening to port ", Port));
