import React, { useEffect, useState } from "react";
import Index from "../../container/Index";
import PageIndex from "../../container/PageIndex";
import { useSocket } from "../../context/SocketContext";
import "../../assets/global.css";
import { useAppContext } from "../../context/AppContext";

const ChatHeader = () => {
  const { selectedChat } = PageIndex.useAppContext();
  const { socket } = useSocket();
  const [isOnline, setIsOnline] = useState(false);
  const { userProfile } = useAppContext();

  useEffect(() => {
    if (socket && selectedChat?.user?._id) {
      console.log(
        "Setting up presence tracking for user:",
        selectedChat.user._id
      );

      // Listen for presence updates
      const handlePresenceUpdate = ({ userId, online }) => {
        console.log("Presence update received:", { userId, online });
        console.log("Current selected user:", selectedChat.user._id);
        if (userId === selectedChat.user._id) {
          console.log("Updating online status to:", online);
          setIsOnline(online);
        }
      };

      socket.on("presence:update", handlePresenceUpdate);

      // Get initial presence list
      socket.on("presence:list", (onlineUserIds) => {
        console.log("Presence list received:", onlineUserIds);
        const userIsOnline = onlineUserIds.includes(selectedChat.user._id);
        console.log("User online status:", userIsOnline);
        setIsOnline(userIsOnline);
      });

      // Request initial presence list
      socket.emit("setup", userProfile?.id);

      return () => {
        console.log("Cleaning up presence listeners");
        socket.off("presence:update", handlePresenceUpdate);
        socket.off("presence:list");
      };
    }
  }, [socket, selectedChat?.user?._id, userProfile?.id]);

  console.log("Current online status:", isOnline);

  return (
    <Index.Box className="chat-header">
      <PageIndex.StyledBadge
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        variant="dot"
        color={isOnline ? "success" : "error"}
      >
        <Index.Avatar src={selectedChat?.user?.avatar} />
      </PageIndex.StyledBadge>
      <Index.Box className="chat-header-info">
        <Index.Typography variant="subtitle1">
          {selectedChat?.user?.name}
        </Index.Typography>
        <Index.Typography
          variant="body2"
          color={isOnline ? "success.main" : "error.main"}
          className={`online-status ${isOnline ? "online" : "offline"}`}
        >
          {isOnline ? "Online" : "Offline"}
        </Index.Typography>
      </Index.Box>
      {/* <Index.IconButton>
        <Index.Videocam />
      </Index.IconButton>
      <Index.IconButton>
        <Index.CallIcon />
      </Index.IconButton> */}
      {/* <Index.IconButton onClick={toggleTheme} aria-label="toggle dark mode">
        {isDarkMode ? <Index.LightMode /> : <Index.DarkMode />}
      </Index.IconButton> */}
      <Index.IconButton>
        <Index.MoreVert />
      </Index.IconButton>
    </Index.Box>
  );
};

export default ChatHeader;
