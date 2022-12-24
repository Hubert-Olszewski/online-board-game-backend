export const createNewGame = (socket, gameId) => {
  console.log('CreateNewGame - server', gameId, socket.id);
  socket.join(gameId);
  socket.emit('createdNewGame', gameId, socket.id);  
}