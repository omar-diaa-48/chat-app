// const user = prompt('Enter your user')
// const user = 'Omar'

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input[type="text"]')
const $messageFormButton = $messageForm.querySelector('input[type="submit"]')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-templated').innerHTML
const messageLocationTemplate = document.querySelector('#message-location-templated').innerHTML
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {userName, room} = Qs.parse(location.search, {ignoreQueryPrefix : true});
// document.querySelector('.chat__main>h1').innerHTML = room
 
const autoScroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

const socket = io()

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {message : message.text, userName : message.userName, createdAt : moment(message.createdAt).format('h:mm a')})
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('location-message', (message) => {
    const html = Mustache.render(messageLocationTemplate, {locationLink : message.text, userName : message.userName, createdAt : moment(message.createdAt).format('h:mm a')})
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('room-data', ({room, users}) => {
    const html = Mustache.render(sideBarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const text = e.target.elements.text.value
    socket.emit('send-message', {userName,text}, (error) => {
        if(error)
            return console.log(error)

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        console.log('Message Delivered');
    })
})

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation)
        return alert('You cant use this feature, geolocation is not supported by your browser :(')

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('send-location',
        {
            userName,
            text: `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
        },
        (message) => {
            console.log(message)
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', {userName, room}, error => {
    if(error)
        console.log(error);
})