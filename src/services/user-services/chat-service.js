const mongoose = require("mongoose");
const Chat = require("../../models/Chat");
const { populateChat } = require("../../populate/populate-models");
const {
  successEvent,
  errorEvent,
  failedEvent
} = require("../../utilities/handlers/event-handlers");
const {
  unavailableResponse,
  successResponse,
  errorResponse
} = require("../../utilities/handlers/response-handler");
const User = require("../../models/User");

class Service {
  constructor(io) {
    this.io = io;
    this.chat = Chat;
    this.user = User;
  }

  async getInbox(request, response) {
    try {
      const user_id = request.user._id;
      const { limit = 10, skip = 0 } = request.query;

      // Step 1: Find all chats where user is either sender or receiver
      const chats = await this.chat
        .find({
          $or: [{ sender_id: user_id }, { receiver_id: user_id }]
        })
        .sort({ createdAt: -1 }) // Step 2: Sort chats by creation time
        .skip(parseInt(skip)) // Step 3: Skip the records as per pagination
        .limit(parseInt(limit)); // Step 3: Limit the number of records

      if (!chats.length) {
        return unavailableResponse({
          response,
          message: "Inbox is empty. Be the first to start a chat."
        });
      }

      // Step 4: Group chats by sender-receiver pairs
      const groupedChats = {};
      chats.forEach((chat) => {
        const user1 = chat.sender_id.toString();
        const user2 = chat.receiver_id.toString();
        const pairKey =
          user1 < user2 ? `${user1}-${user2}` : `${user2}-${user1}`;

        if (!groupedChats[pairKey]) {
          groupedChats[pairKey] = chat;
        }
      });

      // Step 5: Prepare unique chat pair details (sender and receiver lookup)
      const uniqueChats = Object.values(groupedChats);

      // Step 6: Look up sender and receiver details
      const result = await Promise.all(
        uniqueChats.map(async (chat) => {
          const sender = await this.user.findById(chat.sender_id);
          const receiver = await this.user.findById(chat.receiver_id);

          return {
            _id: chat._id,
            sender_id: sender,
            receiver_id: receiver,
            text: chat.text,
            files: chat.files,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt
          };
        })
      );

      // Step 7: Return response
      return successResponse({
        response,
        message: "Inbox retrieved successfully",
        data: result
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async getChats(socket, data) {
    try {
      const { sender_id, receiver_id } = data;

      const chats = await this.chat
        .find({
          $or: [
            { sender_id, receiver_id },
            { sender_id: receiver_id, receiver_id: sender_id }
          ]
        })
        .sort(populateChat.sort)
        .populate(populateChat.populate);

      await this.chat.updateMany(
        {
          $or: [
            { sender_id, receiver_id },
            { sender_id: receiver_id, receiver_id: sender_id }
          ]
        },
        { $set: { is_read: true } }
      );

      if (!chats)
        socket.emit(
          "response",
          failedEvent({ object_type: "get-chats", message: "No chats found" })
        );

      socket.emit(
        "response",
        successEvent({
          object_type: "get-chats",
          message: "Chats fetch successfully",
          data: chats
        })
      );
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }

  async chatMessage(socket, data) {
    try {
      const { sender_id, receiver_id, text = "", files = [] } = data;

      const message = new this.chat({
        sender_id,
        receiver_id,
        text: text,
        files,
        is_read: false
      });
      await message.save();
      await message.populate(populateChat.populate);

      socket.join(receiver_id.toString());
      this.io.to(receiver_id).emit(
        "response",
        successEvent({
          object_type: "get-chat",
          message: "New chat created successfully.",
          data: message
        })
      );
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }

  async chatTyping(socket, data) {
    try {
      const { chat_id } = data;

      socket.join(chat_id.toString());
      this.io.to(chat_id.toString()).emit(
        "response",
        successEvent({
          message: "Recipient is typing.",
          data: { is_typing: true }
        })
      );
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }
}

module.exports = new Service();
