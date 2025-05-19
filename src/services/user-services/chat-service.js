const Chat = require("../../models/Chat");
const User = require("../../models/User");
const { sendNotification } = require("../../config/firebase");
const notificationService = require("./notification-service");
const { handlers } = require("../../utilities/handlers/handlers");
const chatSchema = require("../../schemas/chat-schema");

class Service {
  constructor(io) {
    this.io = io;
    this.chat = Chat;
    this.user = User;
  }

  async getInbox(req, res) {
    const object_type = "fetch-inbox";
    try {
      const user_id = req.user._id;
      const { limit = 10, skip = 0 } = req.query;

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
        // Populate sender_id.profile_picture
        {
          $lookup: {
            from: "files",
            localField: "sender_id.profile_picture",
            foreignField: "_id",
            as: "sender_id.profile_picture"
          }
        },
        {
          $unwind: {
            path: "$sender_id.profile_picture",
            preserveNullAndEmptyArrays: true
          }
        },

        // Populate receiver_id.profile_picture
        {
          $lookup: {
            from: "files",
            localField: "receiver_id.profile_picture",
            foreignField: "_id",
            as: "receiver_id.profile_picture"
          }
        },
        {
          $unwind: {
            path: "$receiver_id.profile_picture",
            preserveNullAndEmptyArrays: true
          }
        },
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

      if (!inbox.length) {
        handlers.logger.unavailable({
          object_type,
          message: "Inbox is empty. Be the first to start a chat."
        });
        return handlers.response.unavailable({
          res,
          message: "Inbox is empty. Be the first to start a chat."
        });
      }

      handlers.logger.success({
        object_type,
        message: "Inbox retrieved successfully",
        data: inbox
      });
      return handlers.response.success({
        res,
        message: "Inbox retrieved successfully",
        data: inbox
      });
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async getChats(socket, data) {
    const object_type = "get-chats";
    try {
      const { sender_id, receiver_id } = data;

      const chats = await this.chat
        .find({
          $or: [
            { sender_id, receiver_id },
            { sender_id: receiver_id, receiver_id: sender_id }
          ]
        })
        .sort("-createdAt")
        .populate(chatSchema.populate);

      await this.chat.updateMany(
        {
          $or: [
            { sender_id, receiver_id },
            { sender_id: receiver_id, receiver_id: sender_id }
          ]
        },
        { $set: { is_read: true } }
      );

      if (!chats.length) {
        handlers.logger.unavailable({
          object_type,
          message: "No chats found"
        });
        return socket.emit(
          "response",
          handlers.event.unavailable({ object_type, message: "No chats found" })
        );
      }

      handlers.logger.success({
        object_type,
        message: "Chats fetched successfully",
        data: chats
      });

      socket.emit(
        "response",
        handlers.event.success({
          object_type,
          message: "Chats fetched successfully",
          data: chats
        })
      );
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      socket.emit(
        "error",
        handlers.event.error({ object_type, message: error.message })
      );
    }
  }

  async chatMessage(socket, data) {
    const object_type = "chat-message";
    try {
      const { sender_id, receiver_id, text = "", files = [] } = data;

      const newChat = new this.chat({
        sender_id,
        receiver_id,
        text,
        files,
        is_read: false
      });

      await newChat.save();
      await newChat.populate(chatSchema.populate);

      socket.join(receiver_id.toString());

      handlers.logger.success({
        object_type,
        message: "New chat created successfully",
        data: newChat
      });

      this.io.to(receiver_id.toString()).emit(
        "response",
        handlers.event.success({
          object_type,
          message: "New chat created successfully.",
          data: newChat
        })
      );

      // await this.notificationManagement({ type: "chat", chat: newChat });
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      socket.emit(
        "error",
        handlers.event.error({ object_type, message: error.message })
      );
    }
  }

  async chatTyping(socket, data) {
    const object_type = "chat-typing";
    try {
      const { chat_id, sender_id } = data;

      socket.join(chat_id.toString());

      handlers.logger.success({
        object_type,
        message: "Typing event emitted",
        data: { sender_id }
      });

      this.io.to(chat_id.toString()).emit(
        "chat-typing",
        handlers.event.success({
          object_type,
          message: "Recipient is typing.",
          data: { is_typing: true, sender_id }
        })
      );
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      socket.emit(
        "error",
        handlers.event.error({ object_type, message: error.message })
      );
    }
  }

  async notificationManagement({ type, chat }) {
    const object_type = "notification-management";
    try {
      const sender = chat.sender_id;
      const receiver = chat.receiver_id;

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
              type,
              sender_id: {
                _id: sender._id?.toString() || null,
                email_address: sender.email_address || null,
                first_name: sender.first_name || sender.legal_name || null,
                last_name: sender.last_name || null,
                profile_picture: sender.profile_picture?.file_url || null
              },
              receiver_id: {
                _id: receiver._id?.toString() || null,
                email_address: receiver.email_address || null,
                first_name: receiver.first_name || receiver.legal_name || null,
                last_name: receiver.last_name || null,
                profile_picture: receiver.profile_picture?.file_url || null
              },
              text: chat.text || null,
              files: JSON.stringify(chat.files || [])
            })
          }
        }
      });

      await this.user.findByIdAndUpdate(
        receiver._id,
        { $inc: { notification_count: 1 } },
        { new: true }
      );

      await sendNotification(fcmPayload);

      await notificationService.createNotification({
        body: {
          user_id: sender._id,
          message: "New message.",
          type: "chat",
          model_id: chat._id,
          model_type: "Chat"
        }
      });

      handlers.logger.success({
        object_type,
        message: "Notification sent and saved successfully"
      });
    } catch (error) {
      handlers.logger.error({
        object_type,
        message: error
      });
    }
  }
}

module.exports = new Service();
