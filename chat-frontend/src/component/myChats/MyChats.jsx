import React, { useEffect, useState } from "react";
import Index from "../../container/Index";
import PageIndex from "../../container/PageIndex";
import SearchNewUser from "../searchNewUser/SearchNewUser";
import { useSocket } from "../../context/SocketContext";
import { useAppContext } from "../../context/AppContext";

const MyChats = () => {
  const { selectedChat, setSelectedChat, newMessage } =
    PageIndex.useAppContext();
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [myChatList, setMyChatList] = useState([]);
  const [filterMyChat, setFilterMyChat] = useState([]);
  const { socket } = useSocket();
  const { userProfile } = useAppContext();
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const updateSelectedChat = (chat) => {
    setSelectedChat({
      user: chat.participants.find(
        (participant) => participant._id !== userProfile?.id
      ),
      chatRoom: chat._id,
    });

    // Mark messages as read when chat is selected
    if (socket && chat._id && userProfile?.id) {
      socket.emit("mark-messages-read", {
        chatRoomId: chat._id,
        userId: userProfile.id,
      });
    }
  };

  // Separate useEffect for socket setup
  useEffect(() => {
    if (socket && userProfile?.id) {
      console.log("Socket connection status:", socket.connected);
      console.log("Emitting setup with userId:", userProfile.id);
      socket.emit("setup", userProfile.id);

      // Add connection event listeners
      socket.on("connect", () => {
        console.log("Socket connected, re-emitting setup");
        socket.emit("setup", userProfile.id);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });
    }
  }, [socket, userProfile?.id]);

  // Separate useEffect for presence and chat updates
  useEffect(() => {
    if (socket && userProfile?.id) {
      // Listen for presence updates
      socket.on("presence:update", ({ userId, online }) => {
        console.log("Presence update in MyChats:", { userId, online });
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          if (online) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          console.log("Updated online users:", Array.from(newSet));
          return newSet;
        });
      });

      // Listen for initial presence list
      socket.on("presence:list", (onlineUserIds) => {
        console.log("Initial presence list received:", onlineUserIds);
        setOnlineUsers(new Set(onlineUserIds));
      });

      socket.emit("get-my-chats", userProfile?.id);
    }

    socket?.on("my-chats", (chats) => {
      if (chats?.status === 200) {
        setMyChatList(chats?.data);
      }
    });

    return () => {
      console.log("Cleaning up MyChats socket listeners");
      socket?.off("presence:update");
      socket?.off("presence:list");
      socket?.off("my-chats");
    };
  }, [socket, userProfile?.id]);

  const handleSearchMyChats = (searchText) => {
    if (!searchText) {
      setFilterMyChat(myChatList);
      return;
    }
    setFilterMyChat(
      myChatList.filter((chat) =>
        chat?.participants?.some(
          (participant) =>
            participant._id !== userProfile?.id &&
            participant?.name?.toLowerCase().includes(searchText)
        )
      )
    );
  };

  const trimContent = (content) => {
    if (content?.length > 20) {
      return content.substring(0, 20) + "...";
    }
    return content;
  };

  useEffect(() => {
    setFilterMyChat(myChatList);
  }, [myChatList]);

  return (
    <>
      <Index.Box
        sx={{
          width: 360,
          borderRight: 1,
          borderColor: "divider",
          transition: (theme) =>
            theme.transitions.create("border-color", {
              duration: theme.transitions.duration.standard,
            }),
        }}
      >
        <Index.Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Index.TextField
            fullWidth
            placeholder="Search"
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <Index.InputAdornment position="start">
                  <Index.Search />
                </Index.InputAdornment>
              ),
            }}
            onChange={(e) => handleSearchMyChats(e.target.value?.toLowerCase())}
          />
          <Index.Tooltip arrow title="Start new chat" placement="bottom">
            <Index.IconButton aria-label="start new chat" onClick={handleOpen}>
              <Index.NewChatIcon />
            </Index.IconButton>
          </Index.Tooltip>
        </Index.Box>
        <Index.List>
          {filterMyChat.map((chat) => {
            const otherUser = chat.participants.find(
              (participant) => participant._id !== userProfile?.id
            );
            const isOnline = onlineUsers.has(otherUser._id);

            return (
              <Index.ListItemButton
                key={chat.id}
                button
                selected={selectedChat?.chatRoom === chat?._id}
                onClick={() => updateSelectedChat(chat)}
              >
                <Index.ListItemAvatar>
                  <PageIndex.StyledBadge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    variant="dot"
                    color={isOnline ? "success" : "error"}
                  >
                    <Index.Avatar src={chat.avatar} />
                  </PageIndex.StyledBadge>
                </Index.ListItemAvatar>
                <Index.ListItemText
                  primary={
                    <Index.Box
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Index.Typography>{otherUser.name}</Index.Typography>
                      {chat.unreadCount > 0 &&
                        selectedChat?.chatRoom !== chat._id && (
                          <Index.Badge
                            badgeContent={chat.unreadCount}
                            color="primary"
                            sx={{
                              "& .MuiBadge-badge": {
                                right: -3,
                                top: 3,
                              },
                            }}
                          />
                        )}
                    </Index.Box>
                  }
                  secondary={
                    <Index.Typography
                      component="span"
                      variant="body2"
                      color={chat.isTyping ? "primary" : "text.secondary"}
                      sx={{
                        transition: (theme) =>
                          theme.transitions.create("color", {
                            duration: theme.transitions.duration.standard,
                          }),
                      }}
                    >
                      {trimContent(chat?.lastMessage?.content)}
                    </Index.Typography>
                  }
                />
                <Index.Box
                  sx={{ display: "flex", alignItems: "center", ml: "auto" }}
                >
                  {chat.read ? (
                    <Index.DoneAllIcon
                      sx={{
                        fontSize: 16,
                        color: "primary.main",
                        mr: 1,
                      }}
                    />
                  ) : (
                    <Index.Check
                      sx={{
                        fontSize: 16,
                        color: "primary.main",
                        mr: 1,
                      }}
                    />
                  )}
                  <Index.Typography variant="caption" color="text.secondary">
                    {Index.moment(chat?.lastMessage?.createdAt).format(
                      "hh:mm A"
                    )}
                  </Index.Typography>
                </Index.Box>
              </Index.ListItemButton>
            );
          })}
        </Index.List>
      </Index.Box>
      <SearchNewUser open={open} handleClose={handleClose} />
    </>
  );
};

export default MyChats;
