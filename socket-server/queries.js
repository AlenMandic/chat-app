// SQL queries for our database
module.exports = {
    createMessagesTable: `
     CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room TEXT NOT NULL,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
     )
    `,
    insertMessage: `
     INSERT INTO messages (room, username, message) VALUES (?, ?, ?)
    `,
    deleteOldestMessage: `
    DELETE FROM messages
     WHERE id = (
        SELECT id
        FROM messages
        WHERE room = ?
        ORDER BY timestamp ASC
        LIMIT 1
       );
    `,
    countTotalMessagesByRoom: `
     SELECT Count(*) as count FROM messages WHERE room = ?
    `,
    getMessages: `
     SELECT * FROM messages WHERE room = ? ORDER BY timestamp DESC LIMIT 20
    `
}