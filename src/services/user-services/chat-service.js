const mongoose = require("mongoose");
const Chat = require("../../models/Chat");
const { populateChat } = require("../../populate/populate-models");
const {
  successEvent,
  errorEvent
} = require("../../utilities/handlers/event-handlers");

class Service {
  constructor(io) {
    this.io = io;
    this.chat = Chat;
  }

  async getInbox(socket, data) {
    try {
      const { sender_id, receiver_id, limit = 10, skip = 0 } = data;

      const inbox = await this.chat
        .find({
          $or: [
            { sender_id, receiver_id },
            { sender_id: receiver_id, receiver_id: sender_id }
          ]
        })
        .sort(populateChat.sort)
        .skip(skip)
        .limit(limit)
        .exec()
        .populate(populateChat.populate);

      socket.emit(
        "get-inbox",
        successEvent({ message: "Inbox fetch successfully", data: inbox })
      );
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }

  async getChats(socket, data) {
    try {
      const { sender_id, receiver_id, limit = 10, skip = 0 } = data;

      const chats = await this.chat
        .find({
          $or: [
            { sender_id, receiver_id },
            { sender_id: receiver_id, receiver_id: sender_id }
          ]
        })
        .sort(populateChat.sort)
        .skip(skip)
        .limit(limit)
        .exec()
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

      socket.emit(
        "get-chats",
        successEvent({ message: "Chats fetch successfully", data: chats })
      );
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }

  async chatMessage(socket, data) {
    try {
      const { sender_id, receiver_id, text = "", files = [] } = data;

      let message = await this.chat
        .findOne({
          sender_id,
          receiver_id
        })
        .populate(populateChat.populate);

      if (message) {
        message.text.push(text);
        message.files.push(...files);
        await message.save();
      } else {
        message = new this.chat({
          sender_id,
          receiver_id,
          text: [text],
          files,
          is_read: false
        });
        await message.save();
      }

      socket.emit(
        "chat-message",
        successEvent({
          message: "New chat created successfully.",
          data: message
        })
      );

      socket.join(message._id.toString());
      this.io.to(message._id).emit(
        "chat-message",
        successEvent({
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
