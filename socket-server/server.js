const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const morgan = require('morgan')

require('dotenv').config()

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

io.on('connection', (socket) => {

    let username = null;

    socket.onAny((eventName, ...args) => {
        console.log('event fired:', eventName);
        console.log('event arguments:', args);
    });

    socket.on('join-set-username', (clientUsername) => {
        username = clientUsername.username;

        connectedUsers.add(username); // add user to the users set.
        io.emit('concurrent-users', connectedUsers.size); // send the number of concurrent users to the client.
        socket.emit('welcome', `Welcome, chatting as: ${username}`);
        socket.broadcast.emit('user-connected', `${username} has joined the chat.`);
    })

    // handle different chat channels
    socket.on('join-room', (roomName) => {
        socket.leave(socket.room);
        socket.join(roomName); // switch rooms/channels
        socket.room = roomName;
        socket.emit('joined-room', `You have joined the room: ${roomName}`);
    })

    socket.on('chat message', (msg) => {
       io.to(socket.room).emit('chat message', `${username} : ${msg}`);
    })

    socket.on('disconnect', () => {
        io.emit('user-disconnected', `${username} has disconnected.`)
        connectedUsers.delete(username); // remove user from the users set.
        io.emit('concurrent-users', connectedUsers.size);
    });
})

// our server is now listening for incoming websocket requests
server.listen(process.env.PORT || 3003, () => {
    console.log(`Server listening on localhost: ${process.env.PORT}`);
})