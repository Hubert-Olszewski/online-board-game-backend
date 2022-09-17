const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const serverPort = 3001;
const domainClientURL = `http://localhost:${serverPort - 1}`;

const io = new Server(server, {
  cors: {
    origin: domainClientURL,
    methods: ["GET", "POST"],
  },
});

const gamesInSession = [],
      socketsInGame = []; 

io.on("connection", (socket) => {
  // console.log(`User Connected: ${socket.id}`);
  gamesInSession.push(socket);

  socket.on("disconnecting", (reason) => onDisconnect(socket, reason));
  socket.on("createNewGame", (gameId) => createNewGame(socket, gameId));
  socket.on("playerJoinGame", (data) => playerJoinsGame(socket, data));
  socket.on('requestUsername', (gameId) => requestUserName(socket, gameId));
  socket.on('recievedUserName', (data) => recievedUserName(socket, data));
  // socket.on("newMove", newMove);

  socket.on("sendMessage", (data) => {
    io.to(data.room).emit("receiveMessage", {message: data.message, user: data.user});
  });

});

const playerJoinsGame = (socket, idData) => {
  // console.log('playerJoinsGame idData: ', idData);
  // console.log('rooms: ', io.sockets.adapter.rooms);
  const room = io.sockets.adapter.rooms.get(idData.gameId);
  // console.log('room: ', room);

  if (room === undefined) {
    socket.emit('status', 'gameSessionDoesNotExist');
    return;
  }

  if (room.size < 2) {
    idData.mySocketId = socket.id;

    socket.join(idData.gameId);

    // console.log('room.size', room.size); 

    if (room.size === 2) {
      io.sockets.in(idData.gameId).emit('startGame', idData.userName);
    }

    io.sockets.in(idData.gameId).emit('playerJoinedRoom', idData);
    socketsInGame.push(socket.id);
  } else if (!socketsInGame.includes(socket.id)) {
    // console.log('The room is full', socket.id);
    socket.emit('status' , "fullRoom");
  }

}

const createNewGame = (socket, gameId) => {
  // console.log('CreateNewGame - server');
  socket.join(gameId);
  socket.emit('createNewGame', {gameId: gameId, mySocketId: socket.id});  
}

const onDisconnect = (socket, reason) => {
  socket.emit('onDisconnect', {reason, socket});
  console.log('onDisconnect', reason, socket.id);
  const index = gamesInSession.indexOf(socket);
  gamesInSession.splice(index, 1);
}

const requestUserName = (socket, gameId) => {
  // console.log('requestUserName: ' + socket.id + ' gameID: ' + gameId);
  io.to(gameId).emit('giveUserName', socket.id);
}

const recievedUserName = (socket, data) => {
  // console.log('recievedUserName');
  data.socketId = socket.id
  io.to(data.gameId).emit('getOpponentUserName', data);
}

const newMove = (move) => {
  io.to(move.gameId).emit('opponentMove', move);
}

server.listen(serverPort, () => {
  console.log("SERVER IS RUNNING");
});
