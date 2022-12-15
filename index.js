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

io.on("connection", (socket) => {
  socket.userProps = {
    money: 1500
  }
  socket.on("createNewGame", (gameId) => createNewGame(socket, gameId));
  console.log('connection', socket.id);

  socket.on("disconnect", (reason) => onDisconnect(socket, reason));

  socket.on("playerJoinGame", (data) => playerJoinsGame(socket, data));
  socket.on('requestUsername', (gameId) => requestUserName(socket, gameId));
  socket.on('recievedUserName', (data) => recievedUserName(socket, data));
  // socket.on("newMove", newMove);

  socket.on("sendMessage", (data) => {
    io.to(data.room).emit("receiveMessage", {message: data.message, user: data.user});
  });

  socket.on("connect_error", (reason) => onConnectionError(reason, socket));
});

const playerJoinsGame = (socket, idData) => {
  const room = io.sockets.adapter.rooms.get(idData.gameId),
  amountPlayersState = +idData.gameId[idData.gameId.length - 1];
  
  if (room === undefined) {
    socket.emit('status', 'gameSessionDoesNotExist');
    return;
  }
  
  if (room.size < amountPlayersState) {
    idData.mySocketId = socket.id;

    socket.join(idData.gameId);

    if (room.size === amountPlayersState) {
      console.log('Starting the Game');
      io.sockets.in(idData.gameId).emit('startGame', idData.userName);
    }

    io.sockets.in(idData.gameId).emit('playerJoinedRoom', idData);

  } else if (!room.has(socket.id)) {
    socket.emit('status' , "fullRoom");
  }
}

const createNewGame = (socket, gameId) => {
  console.log('CreateNewGame - server', gameId);
  socket.join(gameId);
  socket.emit('createdNewGame', {gameId: gameId, mySocketId: socket.id});  
}

const onDisconnect = (socket, reason) => {
  switch (reason) {
    case 'io server disconnect':
      console.log(socket.id, 'connectedAgain');
      socket.connect();
      break;
    case 'transport close':
    case 'io client disconnect':
      io.emit('onDisconnect', {reason: reason, userId: socket.id});
      console.log('clientDisconected', reason);
      break;
    default:
      console.log(socket.id, 'Disconected from other reason: ', reason);
      break;
  }
}

const onConnectionError = (reason, socket) => {
  console.log('onConnectionError', reason, socket.id);
}

const requestUserName = (socket, gameId) => {
  io.to(gameId).emit('giveUserName', socket.id);
}

const recievedUserName = (socket, data) => {
  data.socketId = socket.id
  io.to(data.gameId).emit('getOpponentUserName', data);
}

const newMove = (move) => {
  io.to(move.gameId).emit('opponentMove', move);
}

server.listen(serverPort, () => {
  console.log("SERVER IS RUNNING");
});
