import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();
import { Server } from "socket.io";
import { createServer } from "http";

import { ACTIONS } from "@amangoel-dev/codesyncer";
const ApiKey = process.env.RapidKey;
const judgeurl = process.env.Judge0_url;
console.log(ApiKey, "heleo");
const app = express();
app.use(express.json());
app.use(cors());
//creating the server here
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});
// in memory database
const userSocketMap = {};
const roomCodeMap = {};

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

app.post("/submit-code", async (req, res) => {
  const { language_id, source_code, stdin } = req.body;
  console.log(language_id, source_code);

  try {
    const response = await axios.post(
      judgeurl,
      { language_id, source_code, stdin },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": ApiKey,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    const { token } = response.data;
    console.log("Token:", token);

    // Polling until the result is ready
    let resultresponse;
    for (let i = 0; i < 10; i++) {
      resultresponse = await axios.get(`${judgeurl}/${token}`, {
        headers: {
          "X-RapidAPI-Key": ApiKey,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      });

      if (resultresponse.data.status.id >= 3) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(resultresponse.data);
    res.json(resultresponse.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res
      .status(500)
      .json({ error: "Something went wrong with code submission." });
  }
});

io.on("connection", (socket) => {
  console.log("User connected and id = ", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    // we store the id and username of person join in inmemoryDb
    userSocketMap[socket.id] = username;
    // let the user join the room
    socket.join(roomId);

    if (roomCodeMap[roomId]) {
      socket.emit(ACTIONS.SYNC_CODE, {
        from: 0,
        to: roomCodeMap[roomId].length,
        text: roomCodeMap[roomId],
      });
    } else {
      // Initialize code for the room if not already set
      roomCodeMap[roomId] = "// Start coding...";
    }
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

    if (roomId) {
      // Apply changes to the current code for the room
      const { from, to, text } = changesInData;
      const currentCode = roomCodeMap[roomId] || "";
      roomCodeMap[roomId] =
        currentCode.slice(0, from) + text + currentCode.slice(to);
      console.log(roomCodeMap[roomId]);
      // Broadcast changes to other users in the room
      socket.broadcast.to(roomId).emit(ACTIONS.SYNC_CODE, changesInData);
    }
  });
});

server.listen(3000, () => {
  console.log("server is running ");
});
