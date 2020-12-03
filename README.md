# Instant Messenging App

This app is an instant messenging app that allows the users to login for a session, create groups, join, send and receive messages, edit or even delete them.
___
## Getting Started
The setup is pretty simple all you need is to clone the repository and have the following installed.
1. First you need an installation of Python 3.5+. It can be downloaded from [Python Installation][python]
2. Then you need to install the dependencies listed in `requirements.txt`
        
        pip install -r requirements.txt
    *use pip3 for Linux and MacOS*
3. After that you simple need to run the server. By default the server runs on `localhost: 9999` with the debugging flags. To deploy in a production environment navigate to `application.py` > `if __name__ == "__main__":` and within that change the `port`, `host`, and set `debug` to `False` 
4. After that write the following command to run the server
   
        python application.py
    *use python3 for Linux and MacOS*

5. Voila you're done
____

## Gallery

### Logging In for the first time.
![Login][login]
___

### Sending and Receiving Messages
![Send and Receiving Messages][chatting]
___

### Editing and Deleting Messages
![Send and Receiving Messages][edit_del]
___

## Tech Stack and Technologies
- This application uses HTML5, CSS3 and vanilla modern JavaScript on the front end.
- On the backend it uses Flask, a Python based framework
- To acheive instant messaging, SocketIO is used. 

### Technical Working
- Whever you join the server for the first time. It asks for your user name and saves it in the local storage. Later whever you come back your previous display name is restored.
- First of all whenever the user types something, it gets sent to the server in form of an event, the server handles that event and thus broacasts that message to all the users that are connected to that group. If a new group is made then it's maessages will be restricted to only it's members. 
- When the server has to broadcast the message to all the memebers on the group, it fires up another event that is sent to the user, and it displays it only if the current user is present in that group.
- Whenever a user deletes or edits a message another event is fired that changes the specifics of that message and then broacast the changes to all the other users to that it can be updates to their screen in real-time
- This doesn't use any database just yet. But uses in program memory so the data is stored for a single session of the server's running.





[python]: https://www.python.org/downloads/
[login]: images/login.gif
[chatting]: images/chatting.gif
[edit_del]: images/edit_del.gif