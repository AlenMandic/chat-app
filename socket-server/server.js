const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const morgan = require('morgan')

const sqlite3 = require('sqlite3').verbose();
const queries = require('./queries.js');

require('dotenv').config()

const dbPath = process.env.DB_PATH

const app = express();
const server = createServer(app); // Creates a new server instance based on our express app, we can then listen on this server port.
const io = new Server(server, {
    connectionStateRecovery: {}
});   // new 'websocket server' based on 'server' from above.

app.use((error, req, res, next) => {
    console.error(error)
    res.status(500).send("Something went wrong!")
})

app.use(morgan('dev'));

app.use(express.static(join(__dirname, '../client')));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../client/index.html'));
});

const connectedUsers = new Set();

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the database file: ', err.message);
    } else {
        console.log(`Connected to the SQLite database`);
        // create the initial DB table if it doesn't already exist, for storing messages.
        db.run(queries.createMessagesTable);
    }
});

io.on('connection', (socket) => {

    let username = null;

    socket.onAny((eventName, ...args) => {
        console.log('event fired:', eventName);
        console.log('event arguments:', args);
    });

    socket.on('join-set-username', (clientUsername) => {
        username = clientUsername.username;

        connectedUsers.add(username); // add user to the users set.

        const userList = {
            size: connectedUsers.size,
            usernames: [...connectedUsers] 
          };

        io.emit('concurrent-users', userList); // send the number of concurrent users to the client.
        socket.emit('welcome', `Welcome, chatting as: ${username}`);
        socket.broadcast.emit('user-connected', `${username} has joined the chat.`);
    })

    // handle different chat channels
    socket.on('join-room', (roomName) => {
        socket.leave(socket.room);
        socket.join(roomName); // switch rooms/channels
        socket.room = roomName;

        const updatedMessages = getMessages(roomName);
        updatedMessages.then((messages) => {
            socket.emit('messages', messages);
        })
        socket.emit('joined-room', `You have joined the room: ${roomName}`);
    })

    socket.on('chat message', (msg) => {
        io.to(socket.room).emit('chat message', `${username} : ${msg}`);
        insertMessage(socket.room, username, msg); // save message to db.
    })

    socket.on('disconnect', () => {

        const disconnectData = {
            username: username,
            message: `${username} has disconnected.`
        }

        io.emit('user-disconnected', disconnectData)
        connectedUsers.delete(username); // remove user from the users set.

        const userList = {
            size: connectedUsers.size,
            usernames: [...connectedUsers] 
          };

        io.emit('concurrent-users', userList);
    });
})

async function insertMessage(room, username, message) {

    try {
        // if there's 20 or more messages stored per room, delete oldest message whenever a new message is received.
        const countTotalMessages = await new Promise((resolve, reject) => {
            db.get(queries.countTotalMessagesByRoom, [room], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        const messageCount = countTotalMessages.count;

        if (messageCount >= 20) {
            deleteOldestMessage(room);
        }
        // once the deleting of oldest message is resolved, attempt to insert message into db
        await new Promise((resolve, reject) => {
            db.run(queries.insertMessage, [room, username, message], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

    } catch (err) {
        console.log('Error:', err);
    }
}

function deleteOldestMessage(room) {
    db.run(queries.deleteOldestMessage, [room], (err) => {
        console.log('deleting oldest message in: ', room)
        if (err) {
            console.log('Couldnt delete message from db', err)
        }
    });
}

function getMessages(room) {
    return new Promise((resolve, reject) => {
        db.all(queries.getMessages, [room], (err, rows) => {
            if (err) {
                console.log('couldnt get all messages for a room', err)
                reject(err);
            } else {
                console.log('retreiving all messages for: ', room)
                resolve(rows.reverse());
            }
        });
    });
}

// our server is now listening for incoming websocket requests
server.listen(process.env.PORT || 3003, () => {
    console.log(`Server listening on localhost: ${process.env.PORT}`);
})