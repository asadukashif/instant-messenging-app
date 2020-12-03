const groupTemplate = Handlebars.compile('<option value="{{ group_name }}">{{ group_name }}</option>')
const messageTemplateGeneral = Handlebars.compile('<div id="{{ id }}" class="message-wrapper container-fluid m-1 p-3"><div class="upper-layer"><div class="user text-muted">{{ user }}</div><div class="time text-muted"> {{ time }} </div></div><div class="message text-justify">{{ message }}</div></div>')
const messageTemplateMe = Handlebars.compile('<div id="{{ id }}" class="message-wrapper container-fluid m-1 p-3" style="align-self: flex-end;background-color: lightpink;"><div class="upper-layer"><div class="user text-muted">{{ user }}</div><div class="time text-muted"> {{ time }} </div></div><div class="message text-justify">{{{ message }}}</div></div>')

const socket = io.connect(location.protocol + "//" + document.domain + ":" + location.port)
socket.on('connect', () => {

    if (localStorage.getItem('userDisplayName') === null || localStorage.getItem('userDisplayName') === "null" || !localStorage.getItem('userDisplayName')) {

        $('#changeDisplayNameModal').modal('show')

        document.querySelector('#nameSaveBtn').onclick = () => {
            const newName = document.querySelector('#displayNameField').value.trim()

            if (newName.length >= 4) {

                const request = new XMLHttpRequest()
                request.open("POST", `/user_check/${newName}`)
                request.send()

                request.onload = () => {
                    const response = JSON.parse(request.responseText)
                    if (response.success) {
                        localStorage.setItem('userDisplayName', newName)
                        $('#changeDisplayNameModal').modal('hide')
                        alert('Display Name set!')
                        document.querySelector('#displayName').innerHTML = newName
                    } else document.querySelector('#nameErrorMessage').innerHTML = 'This display name is already in use';
                }
            } else document.querySelector('#nameErrorMessage').innerHTML = 'The length must be atleast 4 characters'
        }
    }


})

document.addEventListener('DOMContentLoaded', () => {
    // Setting up of display name on Navbar
    document.querySelector('#displayName').innerHTML = localStorage.getItem('userDisplayName')
    if (localStorage.getItem('activeGroup') === null || localStorage.getItem('activeGroup') === "null" || !localStorage.getItem('activeGroup'))
        localStorage.setItem('activeGroup', 'General')

    // REUSABLE FUNCTIONS  

    // Displaying Message on Output Div
    function displayMessage(data) {

        let content = ''
        let values = {
            'id': data.id,
            'user': data.user,
            'message': data.message,
            'time': data.time,
        }

        if (data.user === localStorage.getItem('userDisplayName'))
            content = messageTemplateMe(values)
        else
            content = messageTemplateGeneral(values)

        document.querySelector('.message-output').innerHTML += content

        if (data.deleted)
            document.querySelector(`#${data.id} .message`).innerHTML = `<span class="text-muted font-italic">${data.message}</span>`

        setAllMessageContextMenu()
    }

    // Ajax for getting indivisual group info
    function getGroupInfoAndDisplay(groupName) {

        const request = new XMLHttpRequest()
        try {
            request.open("POST", `/group_info/${groupName.trim()}`)
            request.send()
        } catch (error) {
            console.error(error)
        }
        request.onload = () => {
            const response = JSON.parse(request.responseText)
            if (response.name && response.owner) {

                document.querySelector('.message-output').innerHTML = ''

                for (i = 0; i < response.messages.length; i++) {

                    displayMessage(response.messages[i])
                }
            }
        }
    }

    function deleteMessage(messageId) {
        socket.emit('message_delete', { 'message_id': messageId.trim() })
    }

    function editMessage(messageId, prevText = '') {
        $('#editMessageModal').modal('show')

        const editField = document.querySelector('#editMessageModal input')
        editField.value = prevText

        document.querySelector('#editMessageSaveBtn').onclick = () => {

            const newMessage = editField.value

            if (newMessage.length > 0) {
                $('#editMessageModal').modal('hide')
                socket.emit("message_edit", { 'message_id': messageId, 'message_data': newMessage })
            } else
                document.querySelector('#editMessageErrorMessage').innerText = "This field can not be empty!"
        }
    }

    function setAllMessageContextMenu() {

        document.querySelectorAll('.message-wrapper').forEach((messageBox, index) => {
            messageBox.addEventListener('contextmenu', function (e) {
                e.preventDefault()
                const contextMenu = document.querySelector('#context-menu')
                contextMenu.style.display = 'flex'
                contextMenu.style.top = (e.y + window.scrollY + contextMenu.offsetHeight > window.innerHeight + window.scrollY) ? window.innerHeight + window.scrollY - contextMenu.offsetHeight + "px" : e.y + window.scrollY + "px"
                contextMenu.style.left = ((e.x + contextMenu.offsetWidth) > window.innerWidth) ? window.innerWidth - contextMenu.offsetWidth + "px" : e.x + "px"

                // Context Menu Selection
                document.querySelectorAll('.context-menu .item').forEach(function (item, index) {

                    item.onclick = function () {
                        switch (this.dataset.action) {
                            case 'edit':
                                try {
                                    if (document.querySelector(`#${messageBox.id.trim()} .user`).innerText === localStorage.getItem('userDisplayName')) {
                                        const temp = document.querySelector(`#${messageBox.id} .message`)
                                        if (temp.innerText === '**The message was deleted')
                                            alert('This message is already deleted!')
                                        else
                                            editMessage(messageBox.id, temp.innerText)

                                    }
                                    else alert('You can only edit your own messages')
                                } catch (e) { console.error(e) }
                                break;
                            case 'hide':
                                messageBox.remove()
                                break;
                            case 'delete':
                                try {
                                    if (document.querySelector(`#${messageBox.id.trim()} .user`).innerText == localStorage.getItem('userDisplayName')) deleteMessage(messageBox.id)
                                    else alert('You can only delete your own messages')
                                } catch (e) { console.error(e) }
                                break;
                            case 'close':
                                this.style.display = 'none';
                            default:
                                break;
                        }
                    }
                })
            })
        })


    }

    function registerUser(name) {
        const request = new XMLHttpRequest()
        request.open("POST", `/user_check/${name}`)
        request.send()

        request.onload = () => { }
    }

    function resetGroupIfNonExistant() {
        const req = new XMLHttpRequest()
        req.open('POST', '/get_groups')
        req.send()

        req.onload = () => {
            const response = JSON.parse(req.responseText)

            if (response.success) {

                if (!response.groups.includes(localStorage.getItem('activeGroup').trim()))
                    localStorage.setItem('activeGroup', 'General');
            }
        }
        document.querySelector('#groupList').value = localStorage.getItem('activeGroup')
    }

    getGroupInfoAndDisplay(localStorage.getItem('activeGroup'))
    registerUser(localStorage.getItem('userDisplayName'))
    resetGroupIfNonExistant()
    document.querySelector('#groupList').value = localStorage.getItem('activeGroup')

    // LISTENERS FOR SOCKETIO

    // Group Created
    socket.on('group_created', data => {

        const content = groupTemplate({ 'group_name': data.name })
        document.querySelector('#groupList').innerHTML += content
    })

    // Message Receiving
    socket.on('message_received', data => {
        if (data.group === localStorage.getItem('activeGroup'))
            displayMessage(data);
    })

    // Message Deletion Request
    socket.on('message_deleted', data => {
        try {
            const message_id = data.message_id
            if (message_id)
                document.querySelector(`#${message_id.trim()} .message`).innerHTML = "<i class='text-muted'>**The message was deleted</i>";
        } catch (e) { console.error(e) }
    })

    // Message Editted
    socket.on('message_editted', data => {
        try {
            const message_id = data.message_id
            const message_data = data.message_data
            if (message_id)
                document.querySelector(`#${message_id.trim()} .message`).innerHTML = message_data;
        } catch (e) { console.error(e) }
    })

    // Message Sending
    const messageField = document.querySelector('#messageField')
    messageField.focus()
    const sendMessage = document.querySelector('#sendMessage')

    sendMessage.onsubmit = () => {

        const message = messageField.value.trim()

        if (message.length > 0) {
            const data = {
                'group': localStorage.getItem('activeGroup'),
                'user': localStorage.getItem('userDisplayName'),
                'message': message,
                'time': (new Date).toString().slice(4, 21)
            }
            socket.emit('message_send', data)
            messageField.value = ''
            messageField.focus()
            setAllMessageContextMenu()
        }
        return false
    }

    // Group Creation
    document.querySelector('#groupSaveBtn').onclick = () => {

        const groupName = document.querySelector('#groupNameField').value.trim()

        if (groupName.length >= 4) {

            const request = new XMLHttpRequest()
            request.open("POST", `/group_check/${groupName}`)
            request.send()

            request.onload = () => {
                const response = JSON.parse(request.responseText)
                if (response.success) {
                    // Create a group with SocketIO
                    const data = {
                        'name': groupName,
                        'owner': localStorage.getItem('userDisplayName')
                    }
                    socket.emit('group_create', data)
                    localStorage.setItem('activeGroup', groupName)
                    $('#groupCreationModal').modal('hide')
                    alert('Group Created!')
                    document.querySelector('#groupNameField').value = ''
                } else document.querySelector('#groupErrorMessage').innerHTML = 'A group with this name already exists';
            }
        } else document.querySelector('#groupErrorMessage').innerHTML = 'The length must be atleast 4 characters'
    }

    // Group Selection Change
    document.querySelector('#groupList').onchange = function () {

        localStorage.setItem('activeGroup', this.value)

        // Ajax Req to Get all group data
        getGroupInfoAndDisplay(this.value)
    }

    const userInputField = document.querySelector('#userInputForm #userInput')
    document.querySelector('#userInputForm').onsubmit = function () {
        username = userInputField.value.trim()

        if (username === localStorage.getItem('userDisplayName')) { alert('You can\'t chat with yourself'); return; }


        const request = new XMLHttpRequest()
        request.open('POST', `/user_check/${username}`)
        request.send()

        request.onload = () => {
            const response = JSON.parse(request.responseText)
            if (!response.success) {

                $('#privateChatModal').modal('show')
                document.querySelector('#privateChatModal #privateChatModalTitle').innerText = 'Private Chat with ' + username

                const request_ = new XMLHttpRequest()
                arr = [username, localStorage['userDisplayName']]
                request_.open('POST', `/get_private/${arr}`)
                request_.send()

                const output = document.querySelector('#privateMessageOutput')
                output.innerHTML = ''

                request_.onload = () => {
                    const response = JSON.parse(request_.responseText)
                    if (response.success) {
                        response.messages.forEach((message, i) => {
                            let content = ''
                            if (message.user === localStorage.getItem('userDisplayName'))
                                content = messageTemplateMe({ 'user': message.user, 'time': message.time, 'message': message.message, 'id': message.id })
                            else
                                content = messageTemplateGeneral({ 'user': message.user, 'time': message.time, 'message': message.message, 'id': message.id })

                            output.innerHTML += content
                            setAllMessageContextMenu()
                        })
                    }
                }

                const messageField = document.querySelector('#privateChatModal #privateMessageField')

                document.querySelector('#privateChatModal #sendPrivateMessage').addEventListener('submit', () => {

                    if (messageField.value.trim().length > 0) {
                        const data = {
                            'users': [localStorage.getItem('userDisplayName'), username],
                            'message': messageField.value,
                            'time': (new Date).toString().slice(4, 21)
                        }
                        socket.emit('private_message_send', data)
                        messageField.value = ''
                    }
                    return false
                })

                socket.on('private_message_received', data => {

                    sender = localStorage.getItem('userDisplayName')
                    receiver = username
                    try {
                        if (data.users.includes(receiver) && data.users.includes(sender)) {
                            let content = ''
                            if (data.users[0] === sender)
                                content = messageTemplateMe({ 'id': data.id, 'time': data.time, 'message': data.message, 'user': sender })
                            else
                                content = messageTemplateGeneral({ 'id': data.id, 'time': data.time, 'message': data.message, 'user': receiver })

                            output.innerHTML += content
                            setAllMessageContextMenu()
                        }
                    } catch (e) { console.error(e) }
                })



            }
            else alert("No user with that name exists");
        }

        return false
    }

    // Private Chat 
    userInputField.onkeyup = function () {

        if (this.value.trim().length > 0) {
            const request = new XMLHttpRequest()

            try {
                request.open('POST', `/get_users/${this.value.trim()}`)
                request.send()
            } catch (e) { console.error(e) }

            request.onload = () => {
                const response = JSON.parse(request.responseText)
                if (response.success) {
                    document.querySelector('#usersList').innerHTML = ''
                    response.users.forEach((user, index) => {
                        if (user !== localStorage.getItem('userDisplayName'))
                            document.querySelector('#usersList').innerHTML += `<option value="${user.toString()}">`;
                    })
                }
            }
        }
    }

    window.onclick = () => { document.querySelector('#context-menu').style.display = "none" }
    setAllMessageContextMenu()
})