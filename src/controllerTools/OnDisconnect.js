import { io } from "../../index.js";

export const onDisconnect = (socket, reason, users) => {
    switch (reason) {
      case 'io server disconnect':
        console.log('\x1b[33m%s\x1b[0m', 'connectedAgain', socket.id, reason);
        socket.connect();
        break;
      default:
        const disconectedUser = users.find(user => user.userId === socket.id),
          gameId = disconectedUser ? disconectedUser.gameId : null;
  
        if(disconectedUser){
          console.log('\x1b[33m%s\x1b[0m', `Client ${disconectedUser.userId} disconected from reason: ${reason}`);
  
          const userIndex = users.findIndex(usr => usr.userId === disconectedUser.userId);
          disconectedUser.isConnected = false;
          users.splice(userIndex, 1, disconectedUser);
  
          io.in(gameId).emit('onDisconnect', disconectedUser);
        }
        break;
    }
}