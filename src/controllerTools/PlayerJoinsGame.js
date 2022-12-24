import { io } from "../../index.js";

const callbacksAfterStartGame = [],

requestUserProps = (serverSocket, allUsers, socketId) => {
    console.log('requestUserProps');
    
    const user = allUsers.find(item => item.userId === socketId);
    user.props = serverSocket.userProps;

    io.to(socketId).emit('responseUserProps', user);
},

startGame = (callbacksAfterStartGame, allUsers) => {
    console.log('Starting the Game');
    io.to(gameId).emit('startGame', allUsers, true);

    callbacksAfterStartGame.forEach(callback => callback());
    callbacksAfterStartGame.length = 0;
}

export const playerJoinsGame = (socket, user, allUsers) => {
    const { gameId } = user,
        room = io.sockets.adapter.rooms.get(gameId),
        amountPlayersState = +gameId[gameId.length - 1];

    if (room === undefined) {
        socket.emit('status', 'gameSessionDoesNotExist');
        return;
    }

    if (room.size < amountPlayersState) {
        socket.join(gameId);

        const newUser = {
            ...user,
            didGetUserName: true,
            didJoinTheGame: true,
            isConnected: true
        },

        isUser = allUsers.find(user => user.userId === newUser.userId);
        !isUser && allUsers.push(newUser);

        callbacksAfterStartGame.push(() => {
            io.to(newUser.userId).emit('playerJoinedRoom', newUser);
            socket.broadcast.emit('playerReconnected', newUser);
        });

        if (room.size === amountPlayersState) {
            startGame(callbacksAfterStartGame, allUsers);
        }

        socket.on('requestUserProps', (socketId) => requestUserProps(socket, allUsers, socketId));
        
    } else if (!room.has(socket.id)) {
        socket.emit('status' , "fullRoom");
    }
}