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

const users = [], 
  playerJoinedRoomCallbacks = [];

io.on("connection", (socket) => {
  console.log('connection', socket.id);
  socket.userProps = {
    money: 1500
  }

  socket.on("createNewGame", (gameId) => createNewGame(socket, gameId));
  socket.on("playerJoinGame", (basicUserData) => playerJoinsGame(socket, basicUserData));
  // socket.on("newMove", newMove);

  socket.on("sendMessage", (data) => {
    io.to(data.room).emit("receiveMessage", {message: data.message, user: data.user});
  });

  socket.on("disconnect", (reason) => onDisconnect(socket, reason));
  socket.on("connect_error", (reason) => onConnectionError(reason, socket));
  
  socket.on("reconnect", () => {
    console.log('\x1b[33m%s\x1b[0m', 'reconnect');
  });
});

const playerJoinsGame = (socket, basicUserData) => {
  const { gameId } = basicUserData,
    room = io.sockets.adapter.rooms.get(gameId),
    amountPlayersState = +gameId[gameId.length - 1];
  
  if (room === undefined) {
    socket.emit('status', 'gameSessionDoesNotExist');
    return;
  }

  if (room.size < amountPlayersState) {
    socket.join(gameId);

    const newUser = {
      ...basicUserData,
      didGetUserName: true,
      didJoinTheGame: true,
      isConnected: true,
    },
    isUser = users.find(user => user.userId === newUser.userId);
    !isUser && users.push(newUser);

    playerJoinedRoomCallbacks.push(() => {
      io.to(newUser.userId).emit('playerJoinedRoom', newUser);
      socket.broadcast.emit('playerReconnected', newUser);
    });

    socket.on('requestUserProps', (socketId) => {
      console.log('requestUserProps', socket.id, socketId, socket.id === socketId);
      
      const user = users.find(item => item.userId === socketId);
      user.props = socket.userProps;

      io.to(socketId).emit('responseUserProps', user);
    });

    if (room.size === amountPlayersState) {
      console.log('Starting the Game');
      io.to(gameId).emit('startGame', users, room.size === amountPlayersState);

      playerJoinedRoomCallbacks.forEach(callback => callback());
      playerJoinedRoomCallbacks.length = 0;
    }

  } else if (!room.has(socket.id)) {
    socket.emit('status' , "fullRoom");
  }
}

const createNewGame = (socket, gameId) => {
  console.log('CreateNewGame - server', gameId, socket.id);
  socket.join(gameId);
  socket.emit('createdNewGame', gameId, socket.id);  
}

const onDisconnect = (socket, reason) => {
  switch (reason) {
    case 'io server disconnect':
      console.log('\x1b[33m%s\x1b[0m', 'connectedAgain', socket.id, reason);
      socket.connect();
      break;
    default:
      const disconectedUser = users.find(user => user.userId === socket.id),
        gameId = disconectedUser ? disconectedUser.gameId : null;

      if(disconectedUser){
        console.log(`Client ${disconectedUser.userId} disconected from reason: ${reason}`);

        const userIndex = users.findIndex(usr => usr.userId === disconectedUser.userId);
        users.splice(userIndex, 1);

        disconectedUser.isConnected = false;

        io.to(gameId).emit('onDisconnect', disconectedUser);
      }
      break;
  }
}

const onConnectionError = (reason, socket) => {
  console.log('onConnectionError', reason, socket.id);
}

const newMove = (move) => {
  io.to(move.gameId).emit('opponentMove', move);
}

server.listen(serverPort, () => {
  console.log("SERVER IS RUNNING");
});
