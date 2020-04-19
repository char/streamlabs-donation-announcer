const io = require("socket.io-client");

const { STREAMLABS_SOCKET_API_TOKEN } = process.env;

const connectStreamlabs = async () => {
  return io("https://sockets.streamlabs.com/?token=" + STREAMLABS_SOCKET_API_TOKEN, {
    "transports": [ "websocket" ]
  });
}

module.exports = connectStreamlabs;
