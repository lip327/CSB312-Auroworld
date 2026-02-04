class CommentData{
    #username;
    #firstname;
    #lastname;
    #messageId;
    #commentId;
    #comment;
    #upvote;
    #downvote;
    #createdAt;
    constructor(username, firstname, lastname, 
        messageId, commentId, comment, upvote,downvote){
        this.#username=username;
        this.#firstname=firstname;
        this.#lastname=lastname;
        this.#messageId=messageId;
        this.#commentId=commentId;
        this.#comment=comment;
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
    getCommentId(){
        return this.#commentId;
    }
    getComment(){
        return this.#comment;
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