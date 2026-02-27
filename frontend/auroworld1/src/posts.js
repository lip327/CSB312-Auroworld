import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Posts(){
    const navigate=useNavigate();
    function mainpageButton(){
        navigate("/posts")
    }
    function coursesButton(){
        navigate("/courses")
    }
    function signoutButton(){
        navigate("/login")
    }
    function postButton(){
        console.log("hitting post button");
        document.getElementById("addPost").style.display="block";
    }
    async function addPostButton(){
        console.log("hitting add post button");
        try{
            const postBody = {
                subject: document.getElementById("newTitle").value,
                message: document.getElementById("newPost").value
            };
            const response = await fetch("http://localhost:8080/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postBody)
            });
            const data = await response.json();
            console.log("Message Post response:",data)
            if(data.mStatus!=="ok"){
                alert("Message Post failed: "+data.mMessage);
                return;
            }
        } catch(error){
            console.error(error.message)
        }
       cancelPostButton();
    }
    function cancelPostButton(){
        console.log("hitting cancel post button");
        document.getElementById("addPost").style.display="none";
    }
    function commentButton(){
        console.log("hitting comment button");
        document.getElementById("addComment").style.display="block";
    }
    async function addCommentButton(msg_id){
        console.log("hitting add comment button:"+msg_id);
        try{
            const commBody={
                comment:document.getElementById("newComment").value
            }
            const res = await fetch(`http://localhost:8080/messages/${msg_id}/comments`,{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify(commBody)
            })
            const data =await res.json()
            console.log("Comment data posted:",data)
            if(data.mStatus!=="ok"){
                alert("Comment failed: "+data.mMessage)
                return
            }

        }catch(error){
            console.error(error.message)
        }
        cancelCommentButton()
    }
    async function upvoteButton(msg_id){
        console.log("hitting upvote button for "+msg_id)
        try{
            const res = await fetch(`http://localhost:8080/vote_messages/${msg_id}`,{
                method:"PUT",
                headers:{"Content-Type":"application/json"},
            })
            const data=await res.json()
            console.log("Post upvoted: ",data);
            if(data.mStatus!="ok"){
                return
            }
        }catch(error){
            console.error(error.message)
        }
    }
    function cancelCommentButton(){
        console.log("hitting cancel comment button");
        document.getElementById("addComment").style.display="none";
    }
    const [posts, setPosts] = useState([])
    const [commentsByPost,setCommentsByPost]=useState([])
    const [fileUpload,setFileUpload]=useState()

    function uploadImageHandler(e){
        setFileUpload(URL.createObjectURL(e.target.files[0]))
    }

    useEffect(() => {
        fetch("http://localhost:8080/messages")
        .then(res => res.json())
        .then(data => {
            console.log("FULL RESPONSE:", data)
            console.log("Posts mData:", data.mData)
            setPosts(data.mData);
            // console.log(data.mData.msg_id)
            data.mData.forEach(post => {
                fetch(`http://localhost:8080/messages/${post.msgId}/comments`)
                    .then(res => res.json())
                    .then(commentData => {
                        console.log("FULL RESPONSE FOR COMMENT GETTER:",commentData)
                        console.log("Comment mData:",commentData.mData)
                        setCommentsByPost(prev => ({
                            ...prev,
                            [post.msgId]: commentData.mData
                        }));
                    });
            });
        })
        .catch(err => console.error("FETCH ERROR for getting posts:", err))
    }, []);

    return(
        <div id="homepage">
            <button onClick={mainpageButton}>Mainpage</button>
            <button onClick={coursesButton}>Courses</button>
            <button onClick={signoutButton}>Sign Out</button>
                        
            <button onClick={postButton}>Post</button>
            <div id="addPost" style={{display:"none"}}>
                <h3>Add a New Entry</h3>
                <label>Title</label>
                <input type="file" onChange={uploadImageHandler}></input>

                <img src={fileUpload} ></img>

                <input type="text" id="newTitle" />
                <textarea id="newPost"></textarea>
                
                <button onClick={addPostButton}>Send</button>
                <button onClick={cancelPostButton}>Cancel</button>
            </div>
            <div id="messageList">
                {posts?.map((post, i) => (
                <div key={i}>{post.msg_id}
                    <h2>{post.subject}</h2>
                    <label>{post.message}</label>
                    <p>By {post.username}</p>
                    
                    <p>{post.upvote} Upvotes</p>
                    <button onClick={()=> upvoteButton(post.msgId)}>⬆️</button>
                    <button onClick={commentButton}>Comment</button>

                    <div id="addComment" style={{display:"none"}}>
                        <h3>Make a Comment</h3>
                        <label>Message</label>

                        <textarea id="newComment"></textarea>

                        <button onClick={() => addCommentButton(post.msgId)}>Send</button>
                        <button onClick={cancelCommentButton}>Cancel</button>
                    </div>
                        {(commentsByPost[post.msgId])?.map((comment,j)=>(
                            <div key = {j}>
                                <label>{comment.comment}</label>
                                <p>By {comment.userId}</p>
                            </div>
                        ))}
                </div>
                ))}
            </div>
        </div>

    );
}
export default Posts;