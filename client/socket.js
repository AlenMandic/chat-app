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

const openModalButton = document.getElementById('open-modal');
const closeModalButton = document.getElementById('closeModalButton');
const modal = document.getElementById('userListModal');
const modalUserList = document.getElementById('onlineUserList');

const userList = new Set();

openModalButton.addEventListener('click', () => {
  modal.style.display = 'flex';
  // TODO: Populate the user list dynamically
});

closeModalButton.addEventListener('click', () => {
  modal.style.display = 'none';
});

channelTitle.textContent = selectChannel.value;

const username = getUsername();

socket.emit('join-set-username', { username });

async function getMessages(currentRoom) {
  const db_messages = await joinRoom(socket, messages, currentRoom);

  db_messages.forEach(message => {
    messages.appendChild(message);
  });
}

getMessages(selectChannel.value); // get messages for the current room.

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const inputValue = input.value.trim();

  if (inputValue && inputValue.length > 0) {
    socket.emit("chat message", input.value);
    input.value = "";

    setTimeout(() => {
      chatRoom.scrollTop = chatRoom.scrollHeight;
    }, 10);
    //sendButton.disabled = true;
    //setTimeout(() => (sendButton.disabled = false), 3000);
  }
});

selectChannel.addEventListener('change', function () {
  const selectedRoom = selectChannel.value;
  channelTitle.textContent = selectedRoom;
  getMessages(selectedRoom); // get messages for the selected room.
});

socket.on('concurrent-users', (data) => {

  concurrentUsers.textContent = 'Users online:' + " " + data.size;

  modalUserList.innerHTML = '';

  if (data.usernames && data.usernames.length > 0) {

    for (let i = 0; i < data.usernames.length; i++) {
      const username = data.usernames[i];
      userList.add(username);

      const userItem = document.createElement('li');
      userItem.textContent = username;
      modalUserList.appendChild(userItem);
    }
  }

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
  const createUsername = document.createElement('p');
  createUsername.textContent = `${msg.split(":")[0].trim()}:`;
  createUsername.setAttribute('class', 'chatUsername');

  const createMessage = document.createElement('p');
  createMessage.textContent = msg.split(":")[1];
  createMessage.setAttribute('class', 'chatMessage');

  const messageItem = document.createElement("li");
  messageItem.innerHTML = `[ ${displayCurrentTime()} ]`;
  messageItem.setAttribute('class', 'messageItem');

  messageItem.appendChild(createUsername);
  messageItem.appendChild(createMessage);

  messages.appendChild(messageItem);

  setTimeout(() => {
    chatRoom.scrollTop = chatRoom.scrollHeight;
  }, 50);
});

socket.on('joined-room', (msg) => {
  const joinRoomItem = document.createElement('h3');
  joinRoomItem.setAttribute('id', 'joined-room');
  joinRoomItem.textContent = msg;
  messages.appendChild(joinRoomItem);
})

socket.on('user-disconnected', (disconnectData) => {
  const userDisconnectedItem = document.createElement('h3');
  userDisconnectedItem.setAttribute('id', 'user-disconnected');
  userDisconnectedItem.textContent = disconnectData.message;
  messages.appendChild(userDisconnectedItem);
})