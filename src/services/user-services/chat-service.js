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
const {
  convertToObjectId
} = require("../../utilities/formatters/value-formatters");

class Service {
  constructor(io) {
    this.io = io;
    this.chat = Chat;
  }

  async getInbox(request, response) {
    try {
      const user_id = request.user._id;
      const { limit = 10, skip = 0 } = request.query;

      const inbox = await this.chat
        .find({
          $or: [{ sender_id: user_id }, { receiver_id: user_id }]
        })
        .sort({ createdAt: -1 });

      console.log("Inbox Result:", inbox);

      if (!inbox.length) {
        return unavailableResponse({
          response,
          message: "Inbox is empty. Be the first to start a chat."
        });
      }

      return successResponse({
        response,
        message: "Inbox retrieved successfully",
        data: inbox
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
          "get-chats",
          failedEvent({ object_type: "get-chats", message: "No chats found" })
        );

      socket.emit(
        "get-chats",
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
        "chat-message",
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
        "chat-typing",
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
