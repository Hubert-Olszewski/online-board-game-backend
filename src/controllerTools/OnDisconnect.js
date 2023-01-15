import { io } from "../../index.js";

export const onDisconnect = (socket, reason, {allUsers, pawns}) => {
    switch (reason) {
      case 'io server disconnect':
        console.log('\x1b[33m%s\x1b[0m', 'connectedAgain', socket.id, reason);
        socket.connect();
        break;
      default:
        const disconectedUser = allUsers.find(user => user.userId === socket.id),
          gameId = disconectedUser ? disconectedUser.gameId : null;

        if(disconectedUser){
          console.log('\x1b[33m%s\x1b[0m', `Client ${disconectedUser.userId} disconected from reason: ${reason}`);

          const userIndex = allUsers.findIndex(usr => usr.userId === disconectedUser.userId),
            smokeIndex = pawns.findIndex(p => p === 'smoke');
          
          disconectedUser.isConnected = false;
          allUsers.splice(userIndex, 1, disconectedUser);
          pawns.splice(smokeIndex, 1, socket.userProps.pawn);

          io.in(gameId).emit('onDisconnect', disconectedUser);
        }
        break;
    }
}