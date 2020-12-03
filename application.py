import os

from flask import Flask, render_template, request, redirect, jsonify
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

groups = \
    [
        {
            'name': "General",
            "owner": "All",
            'messages': []  # [{id, name, message, time, deleted}, ...]
        },
        {
            'name': "Test",
            "owner": "All",
            'messages': []  # [{id, name, message, time, deleted}, ...]
        }
    ]
users = []
counter = 0

private_chats = \
    [
        # {
        #      'users'= [],  # sender, receiver
        #     'messages'= []  # [{id, name, message, time, deleted}, ...]
        # }
    ]


@app.route("/")
def index():
    to_send = []
    for group in groups:
        to_send.append({'name': group['name']})

    return render_template('index.html', groups=to_send)


@app.route('/group_info/<string:group_name>', methods=["POST"])
def group_info(group_name):
    for group in groups:
        if group_name == group['name']:
            return jsonify(group)

    return jsonify({})


@socketio.on('message_send')
def recv_mesg(data):
    global counter
    counter += 1

    message_id = f'message-{counter}'

    for group in groups:
        if group['name'] == data['group']:
            if len(group['messages']) > 100:
                group['messages'].remove(group['messages'][0])

            group['messages'].append(
                {"id": message_id, "user": data['user'], 'message': data['message'], 'time': data['time'], 'deleted': False})

    data.update({'id': message_id})
    emit('message_received', data, broadcast=True)


@socketio.on('group_create')
def create_group(data):
    if data['name'] not in groups:
        groups.append(
            {
                "name": data['name'],
                "owner": data['owner'],
                "messages": []
            }
        )
        emit('group_created', data, broadcast=True)
    else:
        pass


@socketio.on('message_edit')
def edit_message(data):
    message_id = data['message_id']
    message_data = data['message_data']

    for group in groups:
        for i in range(len(group['messages'])):
            if message_id == group['messages'][i]['id']:
                group['messages'][i]['message'] = message_data
                emit('message_editted', data, broadcast=True)

    for group in private_chats:
        for i in range(len(group['messages'])):
            if message_id == group['messages'][i]['id']:
                group['messages'][i]['message'] = message_data
                emit('message_editted', data, broadcast=True)


@socketio.on('message_delete')
def delete_message(data):
    message_id = data['message_id']
    for group in groups:
        for i in range(len(group['messages'])):
            if message_id == group['messages'][i]['id']:
                group['messages'][i]['message'] = r'**The message was deleted'
                group['messages'][i]['deleted'] = True
                emit('message_deleted', {
                     'message_id': message_id}, broadcast=True)

    for group in private_chats:
        for i in range(len(group['messages'])):
            if message_id == group['messages'][i]['id']:
                group['messages'][i]['message'] = r'**The message was deleted'
                group['messages'][i]['deleted'] = True
                emit('message_deleted', {
                    'message_id': message_id}, broadcast=True)


@app.route('/group_check/<string:group_name>', methods=['POST'])
def check_group(group_name):
    is_success = True
    for group in groups:
        if group_name == group['name']:
            is_success = False

    return jsonify({'success': is_success})


@app.route('/user_check/<string:display_name>', methods=["POST"])
def user_create(display_name):
    is_success = True

    is_success = False if display_name in users else True

    if is_success:
        users.append(display_name)

    return jsonify({'success': is_success})


@app.route('/get_groups', methods=['POST'])
def get_groups():
    response = []

    for group in groups:
        response.append(group['name'])

    return jsonify({'success': True, 'groups': response})


@app.route('/get_users/<string:keyword>', methods=['POST'])
def get_users(keyword):
    global users

    response = []
    for user in users:
        if keyword.lower() in user.lower():
            response.append(user)

    return jsonify({'success': True, 'users': response})


@socketio.on('private_message_send')
def private_message_send(data):
    global private_chats, counter
    sender = data['users'][0]
    existing_group = False
    is_already_group = False
    counter += 1
    message_id = f'message-{counter}'

    message = \
        {
            'id': message_id,
            'user': sender,
            'message': data['message'],
            'time': data['time'],
            'deleted': False
        }

    try:
        for group in private_chats:
            if set(group['users']) == set(data['users']):
                is_already_group = True
                existing_group = group

    except KeyError as e:
        is_already_group = False

    if is_already_group:
        existing_group['messages'].append(message)
    else:
        new_group = {
            'users': data['users'],
            'messages': [message]
        }
        private_chats.append(new_group)

    message = \
        {
            'id': message_id,
            'users': [sender, data['users'][1]],
            'message': data['message'],
            'time': data['time'],
            'deleted': False
        }
    emit('private_message_received', message, broadcast=True)


@app.route('/get_private/<string:user_array>', methods=['POST'])
def get_private_messages(user_array):
    global private_chats
    users_array = user_array.split(',')
    for private_chat in private_chats:
        if set(private_chat['users']) == set(users_array):
            to_send = \
                {
                    'success': True,
                    'messages': private_chat['messages']
                }
            return jsonify(to_send)

    return jsonify({'success': False})


if __name__ == "__main__":
    app.run(host='localhost', port=9999, debug=True)
