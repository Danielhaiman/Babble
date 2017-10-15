var crypto = require('crypto');


// Constructor
function Messages() {
    this.messagesData = [];
    this.clients = [];
    this.numbering = 0;


    /*
    Adds a message to the messages array and returns the id of the last message (literally the array length)
     */
    this.addMessage = function (message) {


        //add the ID of the message to the objet itself
        message.id = this.numbering++;

        //convert unix timestamp to noraml timestamp
        // Create a new JavaScript Date object based on the timestamp
        // multiplied by 1000 so that the argument is in milliseconds, not seconds.
        var date = new Date(message.timestamp * 1000);
        // Hours part from the timestamp
        var hours = date.getHours();
        // Minutes part from the timestamp
        var minutes = "0" + date.getMinutes();
        // Seconds part from the timestamp
        var seconds = "0" + date.getSeconds();

        // Will display time in 10:30:23 format
        message.timestamp = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

        if (message.name == null) {
            message.name = "Anonymous User";
        }
        if (message.email == null) {
            message.email = "anonymous@anonymous.com"
        }

        //add md5 mail to the message
        message.md5email = crypto.createHash('md5').update(message.email).digest("hex");

        //add the message to the array of messages
        this.messagesData.push(message);

        //the length of the array of the messages literally denotes the id of the last messages
        return message.id;
    };

    /*
    Returns all the messages starting from a given counter
    */
    this.getMessages = function (messageCount) {
        //return the array of messages starting from the given counter to the end of the array

        //create a new array for the messages to return
        var idx = 0;
        for (message in this.messagesData) {
            realMessage = this.messagesData[message];
            if (realMessage.id == messageCount) {
                console.log("FOUND YOUR MESSAGE AT INDEX: " + idx);
                break;
            }
            idx++;
        }
        var messagesToReturn = this.messagesData.slice(idx);
        return messagesToReturn;
    };

    /*
    Deletes a given message from the messages array
     */
    this.deleteMessage = function (id) {
        var indexInAray = 0;
        for (var index in this.messagesData) {
            if (this.messagesData[index].id == id) {
                this.messagesData.splice(indexInAray, 1);
                return;
            }
            indexInAray++;
        }
    };

    /*
    Returns whether there are new messages available for the client
     */
    this.areNewMessagesAvailable = function (messageCount) {
        return this.numbering > messageCount;
    };

    /*
    Saves the client for a later response whether there are new messages available for the client
     */
    this.saveClientForLater = function (messageCounter, res) {
        var pendingClient = {"messageCounter": messageCounter, "res": res};
        this.clients.push(pendingClient);
    };

    /*
    Saves the client for a later response whether there are new messages available for the client
     */
    this.releaseAllPendingClients = function () {
        var unprocessedClients = [];

        while (this.clients.length > 0) {

            //peek at the first client
            var client = this.clients.pop();

            //check whether there are new messages available
            var newMessagesAvailable = this.areNewMessagesAvailable(client.messageCounter);

            //if there are new messages available for the client - respond
            if (newMessagesAvailable) {

                //get the messages to return
                var responseForClient = this.getMessages(client.messageCounter);

                //respond to the request
                client.res.json(responseForClient).send().end();

            } else {
                //return the client to the array
                unprocessedClients.push(client);
            }
        }

        //return all the unprocessed clients to the clients array
        while (unprocessedClients.length > 0) {
            this.clients.push(unprocessedClients.pop());
        }
    };

    /*
    Returns the total number of messages in the chat
     */
    this.getTotalNumberOfMessages = function () {
        return this.messagesData.length;
    };

    /*
    Returns the total number of messages in the chat
     */
    this.getTotalNumberOfConnectedUsers = function () {
        return this.clients.length;
    };
}

// export the class
    module.exports = new Messages();
