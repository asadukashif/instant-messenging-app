
document.addEventListener('DOMContentLoaded', () => {
    const messageTemplateGeneral = Handlebars.compile('<div class="message-wrapper container-fluid m-1 p-3"><div class="upper-layer"><div class="user text-muted">{{ user }}</div><div class="time text-muted"> {{ time }} </div></div><div class="message text-justify">{{ message }}</div></div>')
    const messageTemplateMe = Handlebars.compile('<div class="message-wrapper container-fluid m-1 p-3" style="align-self: flex-start;background-color: lightpink;"><div class="upper-layer"><div class="user text-muted">{{ user }}</div><div class="time text-muted"> {{ time }} </div></div><div class="message text-justify">{{ message }}</div></div>')

    const groupTemplate = Handlebars.compile('<option value="{{ group_name }}">{{ group_name }}</option>')

    const resizeWindow = () => {
        document.querySelector('.secondary-wrapper').style.height = (parseInt(window.innerHeight) - parseInt(document.querySelector('nav').offsetHeight)) + "px"
    }

    resizeWindow()

    let socket = io.connect(location.protocol + "//" + document.domain + ":" + location.port)

    const nameDisplayNav = document.querySelector('#displayNameDisplay')

    const sendBtn = document.querySelector("#sendBtn")
    const msgField = document.querySelector("#messageField")
    const messageArea = document.querySelector('#messageArea')

    const groupContainer = document.querySelector('#groupSelector')

    window.addEventListener('resize', () => {

        resizeWindow()
    })

    function showMessages(data) {
        console.log(data)
        try {
            if (data.name === groupContainer.value.trim()) {
                let content = ""
                for (i = 0; i < data.messages.length; i++) {
                    console.log(data.messages[i])
                    if (data.messages[i].user !== localStorage.getItem('userDisplayName'))
                        content = messageTemplateGeneral({ 'user': data.messages[i].name, 'time': data.messages[i].time, 'message': data.messages[i].message })
                    else
                        content = messageTemplateMe({ 'user': data.messages[i].name, 'time': data.messages[i].time, 'message': data.messages[i].message })

                    console.log(content)
                    messageArea.innerHTML += content
                }
            }
        } catch (e) {

        }

    }

    function getGroupInfo(groupName) {
        //When a new menu is selected
        const request = new XMLHttpRequest()
        request.open("POST", `/get_group/${groupName.trim()}`)
        request.send()

        request.onload = () => {
            const data = JSON.parse(request.responseText)
            return data
        }
    }

    showMessages(getGroupInfo('main'))

    const saveDisplayNameBtn = document.getElementById('nameSaveBtn')
    const saveGroupNameBtn = document.getElementById('groupSaveBtn')

    const displayNameField = document.querySelector('#displayNameField')
    const groupNameField = document.querySelector('#groupNameField')

    //When a new menu is selected
    groupContainer.onchange = function () {
        localStorage.setItem('activeGroup', this.value.trim())
        const data = getGroupInfo(this.value)
        showMessages(data)
    }

    socket.on('connect', () => {
        console.log("Connected")
        sendBtn.onclick = () => {

            const message = msgField.value.trim()

            if (message.length > 0) {
                const d = new Date()
                let data = {
                    'user': localStorage.getItem('userDisplayName'),
                    'message': message,
                    'group': localStorage.getItem('activeGroup'),
                    'time': `${d.getHours()}:${d.getMinutes()} | ${d.getDate()}-${d.getMonth()}-${d.getFullYear()}`
                }
                msgField.value = ''
                socket.emit('message_send', data)
            }
        }
    })
    // When message is broadcasted
    socket.on('message_received', data => {
        let content = ''

        if (data.group === localStorage.getItem('activeGroup')) {
            if (data.user !== localStorage.getItem('userDisplayName'))
                content = messageTemplateGeneral({ 'user': data.name, 'time': data.time, 'message': data.message })
            else
                content = messageTemplateMe({ 'user': data.user, 'time': data.time, 'message': data.message })

            console.log(data)
            messageArea.innerHTML += content
        }

    })
    // When a new Group is created
    socket.on('group_created', data => {

        const content = groupTemplate({ 'group_name': data['group_name'] })
        console.log(content)
        groupContainer.innerHTML += content
    })


    // FOR NAME CHANGE
    saveDisplayNameBtn.disabled = true

    displayNameField.onkeyup = function () {

        if ((displayNameField.value).trim().length > 0)
            saveDisplayNameBtn.disabled = false;
        else
            saveDisplayNameBtn.disabled = true
    }

    saveDisplayNameBtn.onclick = () => {

        const newDisplayName = displayNameField.value.toString().trim()

        if (newDisplayName.trim().length !== 0) {

            if (localStorage.getItem('userDisplayName') !== null || localStorage.getItem('userDisplayName').length === 0) {

                socket.emit('user_create', { 'name': newDisplayName })

                socket.on('invalid_user', data => {
                    document.querySelector('#errorMsg').innerHTML = `Invalid Display Name, ${data.name} already exists`
                })
            } else {
                socket.emit('user_change', { 'new_name': newDisplayName, 'old_name': localStorage.getItem('userDisplayName') })
            }

            localStorage.setItem('userDisplayName', newDisplayName);
            saveDisplayNameBtn.dataset.dismiss = "modal"
            displayName = localStorage.getItem('userDisplayName')
            nameDisplayNav.innerHTML = displayName
        }
    }


    // FOR GROUP NAME
    saveGroupNameBtn.disabled = true

    groupNameField.onkeyup = function () {

        if ((groupNameField.value).trim().length > 0)
            saveGroupNameBtn.disabled = false;
        else
            saveGroupNameBtn.disabled = true
    }

    saveGroupNameBtn.onclick = () => {

        const newGroupName = groupNameField.value.toString().trim()

        if (newGroupName.length !== 0) {

            console.log(`${newGroupName} was created!`)
            saveGroupNameBtn.dataset.dismiss = 'modal'
            let data = {
                "group_name": newGroupName,
                "group_owner": localStorage.getItem('userDisplayName')
            }
            socket.emit("group_create", data)
        }
    }



})