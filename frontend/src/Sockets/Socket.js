import { io } from "socket.io-client";
const url = import.meta.env.VITE_BACKEND_URL;
export const initalSocket = async () => {
  return io("http://localhost:3000");
};
