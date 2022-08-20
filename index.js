const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const serverPort = 3001;
const domainClientURL = "http://localhost:" + (serverPort - 1);
const domainServerUrl = "http://localhost:" + serverPort;
const io = new Server(server, {
  cors: {
    origin: domainClientURL,
    methods: ["GET", "POST"],
  },
});

const gamesInSession = [];

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  gamesInSession.push(socket);

  socket.on("disconnect", () => onDisconnect(socket));
  socket.on("createNewGame", (gameId) => createNewGame(socket, gameId));
  socket.on("playerJoinGame", (data) => playerJoinsGame(socket, data));
  socket.on('requestUsername', (gameId) => requestUserName(socket, gameId));
  socket.on('recievedUserName', (data) => recievedUserName(socket, data));
  // socket.on("newMove", newMove);
});

const playerJoinsGame = (socket, idData) => {
  console.log('playerJoinsGame idData: ', idData);
  console.log('rooms: ', io.sockets.adapter.rooms);
  const room = io.sockets.adapter.rooms.get(idData.gameId);
  console.log('room: ', room);

  if (room === undefined) {
    socket.to(socket.id).emit('status' , "This game session does not exist." );
    return;
  }

  if (room.size < 2) {
    idData.mySocketId = socket.id;

    socket.join(idData.gameId);

    console.log('room.size', room.size); 

    if (room.size === 2) {
      io.sockets.in(idData.gameId).emit('startGame', idData.userName);
    }

    io.sockets.in(idData.gameId).emit('playerJoinedRoom', idData);

  } else {
    console.log();
    socket.to(socket.id).emit('status' , "There are already 2 people playing in this room." );
  }
}

const createNewGame = (socket, gameId) => {
  console.log('CreateNewGame - server');
  socket.join(gameId);
  socket.emit('createNewGame', {gameId: gameId, mySocketId: socket.id});  
}

const onDisconnect = (socket) => {
  console.log('onDisconnect');
  const index = gamesInSession.indexOf(socket);
  gamesInSession.splice(index, 1);
}

const requestUserName = (socket, gameId) => {
  console.log('requestUserName: ' + socket + ' gameID: ' + gameId);
  io.to(gameId).emit('giveUserName', socket.id);
}

const recievedUserName = (socket, data) => {
  console.log('recievedUserName');
  data.socketId = socket.id
  io.to(data.gameId).emit('getOpponentUserName', data);
}

const newMove = (move) => {
  io.to(move.gameId).emit('opponentMove', move);
}

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});





const chatInit = (socket) => {
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
}