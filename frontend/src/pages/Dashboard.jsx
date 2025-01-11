import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
const Dashboard = () => {
  const [roomid, setroomId] = useState("");
  const [username, setusername] = useState("");
  const navigate = useNavigate();

  const HanldeInputEnter = (e) => {
    //made to go to new page by enter
    if (e.code === "Enter") {
      JoinRoom();
    }
  };

  const CreateNewRoom = (e) => {
    e.preventDefault();
    const id = uuidv4();
    setroomId(id);
    toast.success("Created a new room");
    console.log(roomid);
  };

  const JoinRoom = () => {
    if (!roomid || !username) {
      toast.error("Username and RoomID required");
      return;
    }
    navigate(`/editor/${roomid}`, {
      state: {
        username,
      },
    });
  };

  return (
    <div className=" bg-indigo-950 h-screen flex justify-center items-center">
      <div className=" bg-slate-300 p-5 flex flex-col gap-4 rounded-md  ">
        <div className=" ml-3 mr-3  flex gap-2  items-center">
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

        <div className="ml-3 mr-3 flex flex-col  gap-3">
          <div className=" font-bold text-xs">Paste the Invitation Room Id</div>
          <input
            className=" rounded-sm p-1 text-sm font-bold"
            type="text"
            onChange={(e) => setroomId(e.target.value)}
            value={roomid}
            placeholder="Room Id"
            onKeyUp={HanldeInputEnter}
          />
          <input
            className=" rounded-sm p-1 text-sm font-bold"
            type="text"
            value={username}
            onChange={(e) => setusername(e.target.value)}
            placeholder="Username"
            onKeyUp={HanldeInputEnter}
          />
          <div className=" flex max-w-full justify-end">
            <button
              onClick={JoinRoom}
              type="button"
              className="text-gray-900 bg-gradient-to-r from-lime-200 via-lime-400 to-lime-500 hover:bg-gradient-to-br focus:outline-none focus:ring-lime-800  dark:shadow-lime-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 "
            >
              Join Room
            </button>
          </div>
        </div>
        <div className="ml-3 mr-3 mb-3 text-xs font-semibold text-center">
          If you don't have an invite create room{" "}
          <span className=" underline text-green-900">
            <Link onClick={CreateNewRoom}> new room</Link>{" "}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
