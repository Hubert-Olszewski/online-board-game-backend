import { io } from "../index.js";
import { createNewGame } from "./controllerTools/CreateNewGame.js";
import { onDisconnect } from "./controllerTools/OnDisconnect.js";
import { playerJoinsGame } from "./controllerTools/PlayerJoinsGame.js";

const allUsers = [];

export const createGameController = (socket) => {
    console.log('connection', socket.id);
    socket.userProps = {
        money: 1500
    }
  
    socket.on("createNewGame", (gameId) => createNewGame(socket, gameId));
    socket.on("playerJoinGame", (user) => playerJoinsGame(socket, user, allUsers));
    socket.on("sendMessage", ({room, message, user}) => io.to(room).emit("receiveMessage", {message, user}));
    socket.on("disconnect", (reason) => onDisconnect(socket, reason, allUsers));

    socket.on("connect_error", (reason) => {
        console.log('\x1b[33m%s\x1b[0m','onConnectionError', reason, socket.id);
    });
    socket.on("reconnect", () => {
        console.log('\x1b[33m%s\x1b[0m', 'reconnect');
    });
}

const newMove = (move) => {
    io.in(move.gameId).emit('opponentMove', move);
}