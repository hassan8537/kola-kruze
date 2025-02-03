const mongoose = require("mongoose");
const Chat = require("../../models/Chat");
const { populateChat } = require("../../populate/populate-models");

class Service {
  constructor(io) {
    this.io = io;
    this.chat = Chat;
  }

  async getInbox(socket, data) {
    try {
      const { sender_id, receiver_id, limit = 10, skip = 0 } = data;

      const messages = await this.chat
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

      socket.emit("get-inbox", {
        status: 1,
        message: "Inbox fetched successfully",
        data: messages
      });
    } catch (error) {
      socket.emit("get-inbox", {
        status: 0,
        message: "Error fetching inbox",
        error
      });
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

      socket.emit("get-chats", {
        status: 1,
        message: "Chats fetched successfully",
        data: chats
      });
    } catch (error) {
      socket.emit("get-chats", {
        status: 0,
        message: "Error fetching chats",
        error
      });
    }
  }

  async chatMessage(socket, data) {
    try {
      const { sender_id, receiver_id, text, files = [] } = data;

      const newMessage = new this.chat({
        sender_id,
        receiver_id,
        text,
        files,
        is_read: false
      }).populate(populateChat.populate);

      await newMessage.save();

      socket.emit("chat-message", {
        status: 1,
        message: "Message sent successfully",
        data: newMessage
      });

      this.io.to(receiver_id).emit("chat-message", {
        sender_id,
        receiver_id,
        text,
        files,
        is_read: false,
        _id: newMessage._id
      });
    } catch (error) {
      socket.emit("chat-message", {
        status: 0,
        message: "Error sending message",
        error
      });
    }
  }

  async chatTyping(socket, data) {
    try {
      const { sender_id, receiver_id } = data;

      this.io.to(receiver_id).emit("chat-typing", {
        sender_id,
        receiver_id,
        is_typing: true
      });
    } catch (error) {
      socket.emit("chat-typing", {
        status: 0,
        message: "Error sending typing indicator",
        error
      });
    }
  }

  async chatSeen(socket, data) {
    try {
      const { message_id, receiver_id } = data;

      const message = await this.chat
        .findById(message_id)
        .populate(populateChat.populate);

      if (!message || message.receiver_id !== receiver_id) {
        return socket.emit("chat-seen", {
          status: 0,
          message: "Message not found or receiver mismatch"
        });
      }

      message.is_read = "true";
      await message.save();

      socket.emit("chat-seen", {
        status: 1,
        message: "Message marked as read",
        data: message
      });

      this.io.to(message.sender_id).emit("chat-seen", {
        message_id,
        is_read: "true"
      });
    } catch (error) {
      socket.emit("chat-seen", {
        status: 0,
        message: "Error marking message as read",
        error
      });
    }
  }
}

module.exports = new Service();
