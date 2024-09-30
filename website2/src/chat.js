// src/chat.js

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const apiKey = process.env.MONGO_URI;

const client = new MongoClient(apiKey, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

module.exports = function(io) {
  client.connect().then(() => {
    console.log('Connected to MongoDB for Chat');
    const database = client.db("Dormie");
    const messagesCollection = database.collection("messages");
    const chatsCollection = database.collection("chats");

    io.on('connection', (socket) => {
      const session = socket.handshake.session;
      const username = session.username;

      if (!username) {
        console.log('User not logged in. Disconnecting socket.');
        socket.disconnect(true);
        return;
      }

      console.log(`User ${username} connected via Socket.IO`);

      // Join the user to a room named after their username
      socket.join(username);

      // Handle joining a chat room
      socket.on('joinChat', async ({ chatId }) => {
        if (!chatId) {
          socket.emit('error', { message: 'Chat ID is required to join a chat.' });
          return;
        }

        try {
          const chat = await chatsCollection.findOne({ _id: new ObjectId(chatId), participants: username });
          if (!chat) {
            socket.emit('error', { message: 'Chat not found or access denied.' });
            return;
          }

          socket.join(chatId);
          console.log(`User ${username} joined chat ${chatId}`);
        } catch (error) {
          console.error('Error joining chat:', error);
          socket.emit('error', { message: 'Internal server error while joining chat.' });
        }
      });

      // Handle sending a message
      socket.on('sendMessage', async ({ chatId, message }) => {
        if (!chatId || !message) {
          socket.emit('error', { message: 'Chat ID and message are required.' });
          return;
        }

        try {
          const chat = await chatsCollection.findOne({ _id: new ObjectId(chatId), participants: username });
          if (!chat) {
            socket.emit('error', { message: 'Chat not found or access denied.' });
            return;
          }

          // Determine the recipient(s)
          const recipients = chat.participants.filter(participant => participant !== username);

          // Create the message document
          const msgDoc = {
            chatId: new ObjectId(chatId),
            from: username,
            to: recipients,
            message,
            timestamp: new Date()
          };

          // Insert the message into the database
          await messagesCollection.insertOne(msgDoc);

          // Emit the message to the recipient(s)
          recipients.forEach(recipient => {
            io.to(recipient).emit('receiveMessage', msgDoc);
          });

          // Emit the message back to the sender to confirm it's sent
          socket.emit('messageSent', msgDoc);

          // Update the lastMessageAt in chats
          await chatsCollection.updateOne(
            { _id: new ObjectId(chatId) },
            { $set: { lastMessageAt: new Date() } }
          );

        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Internal server error while sending message.' });
        }
      });

      // Handle fetching chat history
      socket.on('getChatHistory', async ({ chatId }) => {
        if (!chatId) {
          socket.emit('error', { message: 'Chat ID is required to fetch history.' });
          return;
        }

        try {
          const chat = await chatsCollection.findOne({ _id: new ObjectId(chatId), participants: username });
          if (!chat) {
            socket.emit('error', { message: 'Chat not found or access denied.' });
            return;
          }

          const chatMessages = await messagesCollection.find({ chatId: new ObjectId(chatId) })
            .sort({ timestamp: 1 })
            .toArray();

          socket.emit('chatHistory', { chatId, messages: chatMessages });

        } catch (error) {
          console.error('Error fetching chat history:', error);
          socket.emit('error', { message: 'Internal server error while fetching chat history.' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${username} disconnected from Socket.IO`);
      });
    });

  }).catch((err) => {
    console.error('Failed to connect to MongoDB for Chat:', err);
  });
};
