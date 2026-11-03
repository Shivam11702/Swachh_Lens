let io = null

function init(_io){
  io = _io
}

function getIo(){
  if (!io) throw new Error('Socket.IO not initialized')
  return io
}

module.exports = { init, getIo }
