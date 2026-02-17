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
        document.getElementById("addElement").style.display="block";
    }
//     export async function apiPOST(url, body) {
//     return fetch(url, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "X-Session-Token": getToken()
//         },
//         body: JSON.stringify(body)
//     }).then(r => r.json());
// }
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

    }
    function cancelPostButton(){
        console.log("hitting cancel post button");
        document.getElementById("addElement").style.display="none";
    }

    const [posts, setPosts] = useState([])
    const [commentsByPost,setCommentsByPost]=useState([])
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
            <div id="addElement" style={{display:"none"}}>
                <h3>Add a New Entry</h3>
                <label>Title</label>
                <input type="text" id="newTitle" />

                <textarea id="newPost"></textarea>
                
                <button onClick={addPostButton}>Add</button>
                <button onClick={cancelPostButton}>Cancel</button>
            </div>
            <div id="messageList">
                {posts?.map((post, i) => (
                <div key={i}>{post.msg_id}
                    <h2>{post.subject}</h2>
                    <label>{post.message}</label>
                    <p>By {post.username}</p>
                    <div id="commentList">
                        {(commentsByPost[post.msgId])?.map((comment,j)=>(
                            <div key = {j}>
                                <label>{comment.comment}</label>
                                <p>By {comment.userId}</p>
                            </div>
                        ))}
                    </div>
                </div>
                ))}
            </div>
        </div>

    );
}
export default Posts;