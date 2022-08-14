const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  console.log(socket.nsp.sockets.size);
  
  socket.emit("joinToRoom", "room");

  socket.on("joinRoom", (data) => {
    socket.join(data);
  });

  socket.on("sendMessage", (data) => {
    socket.to(data.room).emit("receiveMessage", data.message);
  });

  socket.on("disconnecting", (reason) => {
    console.log('reason: ', reason);
    console.log('rooms: ', socket.rooms);
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit("userLeft", socket.id);
      }
    }
  });

});
 
server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});