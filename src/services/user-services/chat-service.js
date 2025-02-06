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
const { sendNotification } = require("../../config/firebase");
const notificationService = require("./notification-service");
const { errorLog } = require("../../utilities/handlers/log-handler");

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

      const inbox = await this.chat.aggregate([
        {
          $match: {
            $or: [{ sender_id: user_id }, { receiver_id: user_id }]
          }
        },
        {
          $addFields: {
            user1: {
              $cond: [
                { $lt: ["$sender_id", "$receiver_id"] },
                "$sender_id",
                "$receiver_id"
              ]
            },
            user2: {
              $cond: [
                { $lt: ["$sender_id", "$receiver_id"] },
                "$receiver_id",
                "$sender_id"
              ]
            }
          }
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: { user1: "$user1", user2: "$user2" },
            latestMessage: { $last: "$$ROOT" }
          }
        },
        { $replaceRoot: { newRoot: "$latestMessage" } },
        { $skip: parseInt(skip) },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: "users",
            localField: "sender_id",
            foreignField: "_id",
            as: "sender_id"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "receiver_id",
            foreignField: "_id",
            as: "receiver_id"
          }
        },
        { $unwind: "$sender_id" },
        { $unwind: "$receiver_id" },
        {
          $project: {
            sender_id: 1,
            receiver_id: 1,
            text: 1,
            files: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ]);

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

      const newChat = new this.chat({
        sender_id,
        receiver_id,
        text: text,
        files,
        is_read: false
      });
      await newChat.save();
      await newChat.populate(populateChat.populate);

      socket.join(receiver_id.toString());
      this.io.to(receiver_id).emit(
        "response",
        successEvent({
          object_type: "get-chat",
          message: "New chat created successfully.",
          data: newChat
        })
      );

      await this.notificationManagement({
        type: "chat",
        chat: newChat
      });
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

  async notificationManagement({ type, chat }) {
    try {
      const sender = chat.sender_id;
      const receiver = chat.receiver_id;
      console.log({ receiver: receiver.device_token });

      const fcmPayload = JSON.stringify({
        message: {
          token: receiver.device_token,
          notification: {
            title: "New message",
            body: `${sender.first_name || sender.legal_name} sent you a message`
          },
          data: {
            notificationType: type,
            data: JSON.stringify({
              type: type,
              sender_id: {
                _id: sender._id.toString() || null,
                email_address: sender.email_address.toString() || null,
                first_name:
                  sender.first_name.toString() ||
                  sender.legal_name.toString() ||
                  null,
                last_name: sender.last_name.toString() || null,
                profile_picture:
                  sender.profile_picture.file_url.toString() || null
              },
              receiver_id: {
                _id: receiver._id.toString() || null,
                email_address: receiver.email_address.toString() || null,
                first_name:
                  receiver.first_name.toString() ||
                  receiver.legal_name.toString() ||
                  null,
                last_name: receiver.last_name.toString() || null,
                profile_picture:
                  receiver.profile_picture?.file_url.toString() || null
              },
              text: chat.text.toString() || null,
              files: chat.files.toString() || null
            })
          }
        }
      });

      const updateNotificationCount = await this.user.findByIdAndUpdate(
        receiver._id,
        { $inc: { notification_count: 1 } },
        { new: true }
      );

      await sendNotification(fcmPayload);

      const notificationBody = {
        user_id: sender._id,
        message: "New message.",
        type: "chat",
        model_id: chat._id,
        model_type: "Chat"
      };

      await notificationService.createNotification({ body: notificationBody });

      // await io.to(receiver._id.toString()).emit("response", {
      //   object_type: "notification-count",
      //   data: updateNotificationCount.notification_count
      // });
    } catch (error) {
      return errorLog({ error });
    }
  }
}

module.exports = new Service();
