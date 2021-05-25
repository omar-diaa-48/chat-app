const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages'); 
const { addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users');

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {

    socket.on('join', ({ userName, room }, callback) => {
        const {error, user} = addUser({id:socket.id, userName, room})
        
        if(error)
            return callback(error)

        socket.join(user.room)

        socket.emit('message', generateMessage({text:'Welcome!', userName:user.userName}))
        socket.broadcast.to(user.room).emit('message', generateMessage({userName:user.userName, text:'has joined'}))
        
        io.to(user.room).emit('room-data', {
            room : user.room,
            users : getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('send-message', (message, callback) => {
        const filter = new Filter()
        if(filter.isProfane(message.text))
            return callback('Profanity is not allowed!!!!')

        const user = getUser(socket.id)

        io.to(user.room).emit('message', generateMessage(message))
        callback()
    })

    socket.on('send-location', (locationMsg, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('location-message', generateMessage(locationMsg))
        callback('Location shared!')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage({userName:user.userName, text:'has left'}))
            io.to(user.room).emit('room-data', {
                room : user.room,
                users : getUsersInRoom(user.room)
            })
        }
    })
})

app.get('/', (req,res) => {
    res.send('../public/index.html')
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log(`Listening on port ${PORT}`))