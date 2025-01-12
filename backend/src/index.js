import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import { log } from "console";
import { ACTIONS } from "@amangoel-dev/codesyncer";
const app = express();
//creating the server here
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST"],
  },
});
// in memory database
const userSocketMap = {};

function getAllConnectedClinets(roomId) {
  // this method get the all the sockets connected in the particular room
  const clientIds = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
  return clientIds.map((socketId) => {
    return {
      socketId,
      username: userSocketMap[socketId],
    };
  });
}

// a checking end point
app.get("/", (req, res) => {
  res.json({
    msg: "hello everyone testing the routes",
  });
});

io.on("connection", (socket) => {
  console.log("User connected and id = ", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    // we store the id and username of person join in inmemoryDb
    userSocketMap[socket.id] = username;
    // let the user join the room
    socket.join(roomId);
    // get all the clients in the room
    const clients = getAllConnectedClinets(roomId);
    clients.forEach((client) => {
      io.to(client.socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
    // this event will triggger before disconnect
    socket.on("disconnecting", () => {
      // getting all the rooms that the socket has joined
      const rooms = Array.from(socket.rooms);
      rooms.forEach((roomId) => {
        socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
          socketId: socket.id,
          username: userSocketMap[socket.id],
        });
      });
      delete userSocketMap[socket.id];
    });
  });
  socket.on(ACTIONS.CODE_CHANGE, (changesInData) => {
    const roomId = Array.from(socket.rooms).find((id) => id !== socket.id);
    console.log(changesInData);
    socket.broadcast.to(roomId).emit(ACTIONS.SYNC_CODE, changesInData);
  });
});

server.listen(3000, () => {
  console.log("server is running ");
});
