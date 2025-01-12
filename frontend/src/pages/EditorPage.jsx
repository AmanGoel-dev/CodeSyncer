import React, { useEffect, useRef, useState } from "react";
import Client from "../components/Client";
import Editorcomp from "../components/Editorcomp";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { initalSocket } from "../Sockets/Socket";
import { ACTIONS } from "@amangoel-dev/codesyncer";
import toast from "react-hot-toast";

const EditorPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const SocketRef = useRef(null);
  const reactNavigator = useNavigate();
  const [clients, setclients] = useState([]);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const handleErrors = (e) => {
    console.log("socket error ", e);
    toast.error("Socket Connection Failed, try again later");
    reactNavigator("/");
  };
  useEffect(() => {
    const init = async () => {
      SocketRef.current = await initalSocket();
      SocketRef.current.on("connect_error", (err) => handleErrors(err));
      SocketRef.current.on("connect_failed", (err) => handleErrors(err));

      SocketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      // listening for joined event;
      SocketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(` ${username} joined the room.`);
            console.log(` ${username} joined the room.`);
          }
          setclients(clients);
        }
      );

      //listning to disconnected
      SocketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setclients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
      setIsSocketReady(true);
    };
    init();

    return () => {
      if (SocketRef.current) {
        SocketRef.current.off(ACTIONS.JOINED);
        SocketRef.current.off(ACTIONS.DISCONNECTED);
        SocketRef.current.disconnect();
      }
    };
  }, []);

  if (!location.state) {
    reactNavigator("/");
  }
  return (
    <div className=" grid  h-screen grid-cols-[230px_1fr] ">
      <div className=" bg-slate-300 h-screen flex flex-col ">
        <div className=" flex-1 ml-2 overflow-auto">
          <div className=" ml-3 mr-3  flex gap-2  items-center border-b-2 border-black">
            <div className=" max-h-20 max-w-20">
              <img src="/src/assets/code.png" className="h-[100%]" alt="" />
            </div>
            <div>
              <div className=" text-xl font-bold text-slate-950">Code Sync</div>
              <div className=" text-sm font-medium   text-gray-500">
                Realtime Collaboration
              </div>
            </div>
          </div>
          <div className=" mb-4 font-bold text-xl ml-8">Connected</div>
          <div className=" w-full flex items-center flex-wrap gap-5">
            {clients.map((c) => (
              <Client key={c.socketid} username={c.username} />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
        >
          Copy Room Id
        </button>

        <button
          type="button"
          className="text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
        >
          Leave Room
        </button>
      </div>

      <div className="overflow-hidden bg-[#282c34]">
        {isSocketReady ? (
          <Editorcomp SocketRef={SocketRef} /> // Only render the editor once socket is ready
        ) : (
          <p>Loading editor...</p> // You can show a loading message while waiting for the socket connection
        )}
      </div>
    </div>
  );
};

export default EditorPage;
