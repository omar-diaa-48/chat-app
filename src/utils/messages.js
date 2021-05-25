const generateMessage = (message) => {
    return {
        text: message.text,
        userName: message.userName,
        createdAt : new Date().getTime()
    }
}

module.exports = {
    generateMessage
}