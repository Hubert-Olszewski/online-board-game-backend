import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from "socket.io";
import { createGameController } from "./src/GameController.js";

const app = express();
app.use(cors());
const server = http.createServer(app);

const serverPort = 3001;
const domainClientURL = `http://localhost:${serverPort - 1}`;

export const io = new Server(server, {
  cors: {
    origin: domainClientURL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => createGameController(socket));

server.listen(serverPort, console.log('\x1b[31m', "SERVER IS RUNNING"));
