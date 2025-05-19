import React from "react";
import Index from "../../container/Index";

const NoChatSelected = () => {
  return (
    <Index.Box className="no-chat-container">
      <Index.IconButton className="no-chat-icon-button">
        <Index.ChatBubbleOutline className="no-chat-icon" />
      </Index.IconButton>
      <Index.Typography variant="h4" gutterBottom>
        Welcome to Chat App
      </Index.Typography>
      <Index.Typography
        variant="body1"
        color="text.secondary"
        className="no-chat-message"
      >
        Select a user from the sidebar to start chatting
      </Index.Typography>
    </Index.Box>
  );
};

export default NoChatSelected;
