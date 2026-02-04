class MessageData{
    #username;
    #firstname;
    #lastname;
    #messageId;
    #message;
    #upvote;
    #downvote;
    #createdAt;
    constructor(username, firstname, lastname, 
        messageId, message, upvote, downvote
    ){
        this.#username=username;
        this.#firstname=firstname;
        this.#lastname=lastname;
        this.#messageId=messageId;
        this.#message=message;
        this.#upvote=upvote;
        this.#downvote=downvote;
        this.#createdAt=Date.now();
    }
    getUsername(){
        this.#username;
    }
    getFirstname(){
        return this.#firstname;
    }
    getLastname(){
        return this.#lastname;
    }
    getMessageId(){
        return this.#messageId;
    }
    getMessage(){
        return this.#message;
    }
    getUpvote(){
        return this.#upvote;
    }
    getDownvote(){
        return this.#downvote;
    }
    getCreatedAt(){
        return this.#createdAt();
    }
    setDownvote(){
        this.#downvote=-1;
    }
    setUpvote(){
        this.#upvote=1;
    }
}