import { Server } from "socket.io";
import ChatRoom from "../model/ChatRoom.js";
import Message from "../model/Message.js";
import fs from "fs";
import path from "path";

const uploadFile = async (file) => {
  try {
    if (!file || !file.value || !file.name) {
      return {
        status: 400,
        message: "Invalid file format",
        data: null
      };
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = 'public/upload';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = path.join(uploadDir, filename);

    // Write buffer directly to disk
    fs.writeFileSync(filepath, file.value);

    return {
      status: 200,
      message: "File uploaded successfully",
      data: filename
    };

  } catch (error) {
    return {
      status: 500,
      message: "Error uploading file",
      data: error.message
    };
  }
};

const uploadMultipleFiles = async (files) => {
  try {
    if (!files || !Array.isArray(files) || files.length === 0) {
      return {
        status: 400,
        message: "No files provided",
        data: null
      };
    }

    // Validate file format
    const validFiles = files.every(file => file.value && file.name);
    if (!validFiles) {
      return {
        status: 400,
        message: "Invalid file format in array",
        data: null
      };
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = 'public/upload';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Generate unique filename for each file
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;
      const filepath = path.join(uploadDir, filename);

      // Write buffer directly to disk
      fs.writeFileSync(filepath, file.value);

      uploadedFiles.push(filename);
    }

    return {
      status: 200,
      message: "Files uploaded successfully",
      data: uploadedFiles
    };

  } catch (error) {
    return {
      status: 500,
      message: "Error uploading files",
      data: error.message
    };
  }
};

const createChatRoom = async (participants) => {
  try {
    const chatRoom = await ChatRoom.findOne({ participants: { $all: participants } });
    if (chatRoom) {
      return {
        status: 200,
        message: "Chat room already exists",
        data: { id: chatRoom._id, exists: true },
      };
    }

    const newChatRoom = await ChatRoom.create({ participants });
    return {
      status: 200,
      message: "Chat room created successfully",
      data: { id: newChatRoom._id, exists: false },
    };
  } catch (error) {
    return {
      status: 500,
      message: "Error creating chat room",
      data: error.message,
    };
  }
};

const getMyChats = async (userId) => {
  try {
    const chats = await ChatRoom.find(
      {
        participants: { $in: [userId] },
        $expr: { $gt: [{ $size: "$messages" }, 0] },
      },
      { messages: 0 }
    )
      .populate({ path: "participants", select: "name username" })
      .populate({
        path: "lastMessage",
        select: "content sender createdAt readBy",
        populate: { path: "sender", select: "name username" },
      })
      .sort({ updatedAt: -1 });

    // Get unread count for each chat
    const chatsWithUnreadCount = await Promise.all(chats.map(async (chat) => {
      const unreadCount = await Message.countDocuments({
        chatRoom: chat._id,
        sender: { $ne: userId },
        readBy: { $ne: userId }
      });
      return {
        ...chat.toObject(),
        unreadCount
      };
    }));

    return { status: 200, message: "Chats fetched successfully", data: chatsWithUnreadCount };
  } catch (error) {
    return {
      status: 500,
      message: "Internal server error",
      data: [error.message],
    };
  }
};

const getChatMessages = async (chatRoomId) => {
  try {
    const messages = await Message.find({ chatRoom: chatRoomId }).populate(
      "sender",
      "name username"
    );
    return {
      status: 200,
      message: "Messages fetched successfully",
      data: messages,
    };
  } catch (error) {
    return {
      status: 500,
      message: "Internal server error",
      data: [error.message],
    };
  }
};

const sendMessage = async (sender, receiver, content, file) => {
  try {
    let uploadedFile = "";
    if (file) {
      if (Array.isArray(file)) {
        // Handle multiple files
        uploadedFile = await uploadMultipleFiles(file);
      } else {
        // Handle single file
        uploadedFile = await uploadFile(file);
      }
    }

    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [sender, receiver] },
    });
    if (!chatRoom) {
      chatRoom = await ChatRoom.create({ participants: [sender, receiver] });
    }
    const message = await Message.create({
      sender,
      content,
      chatRoom: chatRoom._id,
      file: uploadedFile?.data || [],
    });
    chatRoom.lastMessage = message._id;
    chatRoom.messages.push(message._id);
    await chatRoom.save();
    return {
      status: 200,
      message: "Messages fetched successfully",
      data: message,
    };
  } catch (error) {
    console.log("82: ", error);
    return {
      status: 500,
      message: "Internal server error",
      data: [error.message],
    };
  }
};

const socketConfig = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    maxHttpBufferSize: 1e8,
  });

  // Track online users and their socket IDs
  const userSockets = new Map(); // userId -> Set of socketIds
  const onlineUsers = new Set(); // Set of online userIds

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Handle user joining with their ID
    socket.on("setup", (userId) => {
      if (!userId) {
        console.log("Setup failed: No userId provided");
        return;
      }

      console.log(`User ${userId} setting up with socket ${socket.id}`);

      // Store socket ID for this user
      socket.data.userId = userId;
      let set = userSockets.get(userId);
      if (!set) set = new Set();
      set.add(socket.id);
      userSockets.set(userId, set);

      // Join user's room
      socket.join(userId);

      // Add user to online users if not already there
      if (!onlineUsers.has(userId)) {
        onlineUsers.add(userId);
        // Notify all clients that this user is online
        io.emit("presence:update", { userId, online: true });
      }

      // Send the newcomer the full online list
      socket.emit("presence:list", Array.from(onlineUsers));

      console.log(`User ${userId} connected with socket ${socket.id}`);
      console.log("Current online users:", Array.from(onlineUsers));
    });

    socket.on("get-my-chats", async (userId) => {
      if (!userId) return;
      const chats = await getMyChats(userId);
      socket.emit("my-chats", chats);
    });

    socket.on("get-chat-messages", async (chatRoomId) => {
      if (!chatRoomId) return;
      const messages = await getChatMessages(chatRoomId);
      socket.emit("chat-messages", messages);
    });

    socket.on("create-chat-room", async (participants) => {
      if (!participants || participants.length === 0) return;
      const chatRoomInfo = await createChatRoom(participants);
      socket.emit("chat-room-created", chatRoomInfo);
    });

    socket.on("send-message", async (messageData) => {
      if (!messageData) return;
      const { sender, receiver, content, file } = messageData;
      const messageInfo = await sendMessage(sender, receiver, content, file);
      if (messageInfo?.status === 200) {
        socket.emit("new-message", messageInfo);
        socket.to(receiver).emit("new-message", messageInfo);
      }
    });

    socket.on("mark-messages-read", async ({ chatRoomId, userId }) => {
      try {
        await Message.updateMany(
          {
            chatRoom: chatRoomId,
            sender: { $ne: userId },
            readBy: { $ne: userId }
          },
          {
            $addToSet: { readBy: userId }
          }
        );

        // Get updated chat list
        const chats = await getMyChats(userId);
        socket.emit("my-chats", chats);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      console.log(`Socket ${socket.id} disconnected`);

      if (userId) {
        // Remove this socket from user's socket set
        const userSocketSet = userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);

          // If user has no more sockets, mark them as offline
          if (userSocketSet.size === 0) {
            userSockets.delete(userId);
            onlineUsers.delete(userId);
            // Notify all clients that this user is offline
            io.emit("presence:update", { userId, online: false });
            console.log(`User ${userId} is now offline`);
          }
        }
      }

      console.log("Current online users:", Array.from(onlineUsers));
    });
  });

  return io;
};

export default socketConfig; 