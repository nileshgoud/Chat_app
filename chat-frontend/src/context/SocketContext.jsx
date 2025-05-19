import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAppContext } from "./AppContext";

const SOCKET_ENDPOINT = "https://r3qlbtcn-5000.inc1.devtunnels.ms";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { userProfile } = useAppContext();

  useEffect(() => {
    const newSocket = io(SOCKET_ENDPOINT);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const value = {
    socket,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
