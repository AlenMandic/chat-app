const prefixMinutes = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

export function displayCurrentTime() {

  const date = new Date();
  const hours = date.getHours();
  let minutes = date.getMinutes();

  if (prefixMinutes.includes(minutes.toString().charAt(0)) && minutes.toString().length === 1) {
    minutes = `0${minutes}`;
    const currentTime = `${hours}:${minutes}`;
    return currentTime;
  } else {
    const currentTime = `${hours}:${minutes}`;
    return currentTime;
  }
}
// this function should clear out existing messages, switch to the selected room channel and fetch/load in current messages for that channel
export function joinRoom(websocket, messagesElement, roomName) {
  messagesElement.innerHTML = null;
  websocket.emit('join-room', roomName);
}

// get and set a username for the chat
export function getUsername() {
  let username = localStorage.getItem('chatUsername');

  if (!username) {
    username = prompt('Please enter your username:');
    localStorage.setItem('chatUsername', username);
  }

  return username;
}