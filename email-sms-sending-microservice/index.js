import bodyParser from "body-parser";
import cors from "cors";
import dotEnv from "dotenv";
import express from "express";
import connectDb from "./config/db.js";
import sendEmailSmsRoutes from "./routers/sendEmailSmsRoutes.js";
dotEnv.config(); // allow .env file to load

const app = express(); // initializing express app

const corsOptions = {
  // cors configuration options
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions)); // enable cors

app.use(bodyParser.urlencoded({ extended: true })); // enable body parsing

connectDb(); // connect to database

app.use(express.json({ limit: process.env.SEND_EMAIL_MAX_PAYLOAD_SIZE })); // enable JSON serialization

// The Email & SMS Routes
app.use("/api", sendEmailSmsRoutes);

// Demo Route for testing
app.get("/", (req, res) => {
  res.send("Email & SMS sending Microservice is running...");
});

const Port = process.env.PORT || 8080;
// listening to the port
app.listen(Port, console.log("Listening to port ", Port));
