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

    const [posts, setPosts] = useState([]);

    useEffect(() => {
        fetch("http://localhost:8080/messages")
        .then(res => res.json())
        .then(data => {
            console.log("FULL RESPONSE:", data);
            console.log("mData:", data.mData);
            setPosts(data.mData);
        })
        .catch(err => console.error("FETCH ERROR:", err));
    }, []);

    function postButton(){
        console.log("hitting post button");
        return(
            <div id="addElement" style={{display:"none"}}>
                <h3>Add a New Entry</h3>
                <label>Title</label>
                <input type="text" id="newTitle" />

                <textarea id="newPost"></textarea>

                <button id="addButton">Add</button>
                <button id="addCancel">Cancel</button>
            </div>
        );
    }
    return(
        <div id="homepage">
            <button onClick={mainpageButton}>Mainpage</button>
            <button onClick={coursesButton}>Courses</button>
            <button onClick={signoutButton}>Sign Out</button>
                        
            <button onClick={postButton}>Post</button>
            <div id="messageList">
                {posts.map((post, i) => (
                <div key={i}>{post.msg_id}
                    <h3>{post.subject}</h3>
                    <p>{post.message}</p>
                    <small>By {post.username}</small>
                </div>
                ))}
            </div>
        </div>

    );
}
export default Posts;