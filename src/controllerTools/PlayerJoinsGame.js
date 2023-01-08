import { io } from "../../index.js";

const callbacksAfterStartGame = [],

requestUserProps = (serverSocket, allUsers, socketId) => {
    const user = allUsers.find(item => item.userId === socketId),
        isUserWithTheSameName = allUsers.find(u => u.userName === user.userName && !u.isConnected);

    if(isUserWithTheSameName){
        user.props = isUserWithTheSameName.props;

        const userIndex = allUsers.findIndex(usr => usr.userId === isUserWithTheSameName.userId);
        allUsers.splice(userIndex, 1);
    }
    else{
        user.props = serverSocket.userProps;
    }

    io.to(socketId).emit('responseUserProps', user);
},

startGame = (callbacksAfterStartGame, allUsers, gameId) => {
    console.log('\x1b[33m%s\x1b[0m', 'Starting the Game');
    io.in(gameId).emit('startGame', allUsers.filter(user => user.gameId === gameId), true);

    callbacksAfterStartGame.forEach(callback => callback());
    callbacksAfterStartGame.length = 0;
},

updatePawns = (pawn) => {
    const pawnIndexToRemove = pawns.findIndex(p => p === pawn);
    socket.userProps.pawn = pawn;
    pawnIndexToRemove != -1 && pawns.splice(pawnIndexToRemove, 1, 'smoke');
}

export const playerJoinsGame = (socket, user, {allUsers, pawns}) => {
    const { gameId } = user,
        room = io.sockets.adapter.rooms.get(gameId),
        amountPlayersState = +gameId[gameId.length - 1];

    if (room === undefined) {
        socket.emit('status', 'gameSessionDoesNotExist');
        return;
    }

    if (room.size < amountPlayersState) {
        const newUser = {
            ...user,
            didJoinTheGame: true,
            isConnected: true
        },
        isUser = allUsers.find(user => user.userId === newUser.userId),
        isUserWithTheSameName = allUsers.find(user => user.userName === newUser.userName);

        if(!isUser && (!isUserWithTheSameName || !isUserWithTheSameName.isConnected)){
            allUsers.push(newUser);
            socket.on('updatePawns', updatePawns);
        }
        else{
            socket.emit('status', 'userAlreadyExists');
            return;
        }

        callbacksAfterStartGame.push(() => {
            io.to(newUser.userId).emit('playerJoinedRoom', newUser);
            socket.to(gameId).emit('playerReconnected', newUser);
        });

        socket.join(gameId);
        if (room.size === amountPlayersState) {
            startGame(callbacksAfterStartGame, allUsers, gameId);
        }

        socket.on('requestUserProps', (socketId) => requestUserProps(socket, allUsers, socketId));
        
    } else if (!room.has(socket.id)) {
        socket.emit('status' , "fullRoom");
    }
}