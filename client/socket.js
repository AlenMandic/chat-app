import { displayCurrentTime, joinRoom, getUsername } from "./utils.js";
const socket = io();

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("send-button");
const chatRoom = document.getElementById("chat-room");
const concurrentUsers = document.getElementById("concurrent-users");
const selectChannel = document.getElementById('roomDropdown')
const channelTitle = document.getElementById('channel-title');
channelTitle.textContent = selectChannel.value;

const username = getUsername();

socket.emit('join-set-username', { username });

joinRoom(socket, messages, selectChannel.value); // join default chat room

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const inputValue = input.value.trim();

  if (inputValue && inputValue.length > 0) {
    socket.emit("chat message", input.value);
    input.value = "";

    setTimeout(() => {
      chatRoom.scrollTop = chatRoom.scrollHeight;
    }, 10);
    sendButton.disabled = true;
    setTimeout(() => (sendButton.disabled = false), 3000);
  }

});

selectChannel.addEventListener('change', function () {
  const selectedRoom = selectChannel.value;
  channelTitle.textContent = selectedRoom;
  joinRoom(socket, messages, selectedRoom); // change into a different chatroom
});

socket.on('concurrent-users', (data) => {
  concurrentUsers.textContent = 'Users online:' + " " + data;
})

socket.on('welcome', (msg) => {
  const welcomeItem = document.createElement('h3');
  welcomeItem.textContent = msg;
  document.querySelector('body').prepend(welcomeItem);
})

socket.on('user-connected', (msg) => {
  const userConnectedItem = document.createElement('h3');
  userConnectedItem.setAttribute('id', 'user-connected');
  userConnectedItem.textContent = msg;
  messages.appendChild(userConnectedItem);
})

socket.on('chat message', (msg) => {
  const messageItem = document.createElement("li");
  messageItem.textContent = `[ ${displayCurrentTime()} ] ${msg}`;
  messages.appendChild(messageItem);
});

socket.on('joined-room', (msg) => {
  const joinRoomItem = document.createElement('h3');
  joinRoomItem.setAttribute('id', 'joined-room');
  joinRoomItem.textContent = msg;
  messages.appendChild(joinRoomItem);
})

socket.on('user-disconnected', (msg) => {
  const userDisconnectedItem = document.createElement('h3');
  userDisconnectedItem.setAttribute('id', 'user-disconnected');
  userDisconnectedItem.textContent = msg;
  messages.appendChild(userDisconnectedItem);
})