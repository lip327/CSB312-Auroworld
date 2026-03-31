import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCallback } from "react";
import { createClient } from '@supabase/supabase-js'
import Button from './components/Button';
import Card from './components/Card';

function Posts(){
    const navigate=useNavigate();
    const supabase = createClient('https://rduempiojxizkwwbzaml.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo')

    const getCurrentUserId = useCallback(async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            console.log("problem grabbing uuid " + error.message);
            return;
        }
        if (user) {
            return user.id;
        }
    }, [supabase]);

    function mainpageButton(){
        navigate("/posts")
    }
    function coursesButton(){
        navigate("/courses")
    }
    async function signoutButton(){
        const { error } = await supabase.auth.signOut();
        if (!error) {
            navigate("/login")
        }
    }

    // --- POST LOGIC ---
    function postButton(){
        document.getElementById("addPost").style.display="block";
    }

    async function addPostButton(){
        try{
            const current_uuid = await getCurrentUserId()
            const postBody = {
                subject: document.getElementById("newTitle").value,
                message: document.getElementById("newPost").value,
                user_uuid: current_uuid
            };
            const response = await fetch("https://auroworld.onrender.com/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postBody)
            });
            const data = await response.json();
            if(data.mStatus !== "ok"){
                alert("Message Post failed: " + data.mMessage);
                return;
            }
            if(fileUpload) {
                addFileToTable(data.mData.msgId)
            }
            window.location.reload(); // Refresh to show new post
        } catch(error){
            console.error(error.message)
        }
    }

    function cancelPostButton(){
        document.getElementById("addPost").style.display="none";
    }

    // --- EDIT LOGIC ---
    // CHANGE: Pass msg_id to identify which specific modal to show
    function editPostButton(msg_id){
        document.getElementById(`editPost-${msg_id}`).style.display="block";
    }

    async function sendEditPostButton(msg_id){
        try{
            const putBody={
                subject: document.getElementById(`editTitle-${msg_id}`).value,
                message: document.getElementById(`editMessage-${msg_id}`).value,
            };
            const response = await fetch(`https://auroworld.onrender.com/messages/${msg_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(putBody)
            });
            const data = await response.json()
            // CHANGE: Fixed typo mStatues -> mStatus
            if (data.mStatus !== "ok"){
                alert("Edit post failed: " + data.mMessage);
                return
            }
            window.location.reload();
        }catch(error){
            console.error(error.message)
        }
    }

    // CHANGE: Pass msg_id to close the correct modal
    function cancelEditPostButton(msg_id){
        // CHANGE: Fixed typo editPOst -> editPost
        document.getElementById(`editPost-${msg_id}`).style.display="none";
    }

    // --- COMMENT LOGIC ---
    // CHANGE: Pass msg_id to show the specific comment box for this post
    function commentButton(msg_id){
        document.getElementById(`addComment-${msg_id}`).style.display="block";
    }

    async function addCommentButton(msg_id){
        try{
            const current_uuid = await getCurrentUserId()
            // CHANGE: Targeted specific textarea for this post
            const commBody={
                user_uuid: current_uuid,
                comment: document.getElementById(`newComment-${msg_id}`).value
            }
            // CHANGE: Path matched to standard backend routes
            const res = await fetch(`https://auroworld.onrender.com/comments/${msg_id}`,{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify(commBody)
            })
            const data = await res.json()
            if(data.mStatus !== "ok"){
                alert("Comment failed: " + data.mMessage)
                return
            }
            window.location.reload();
        }catch(error){
            console.error(error.message)
        }
    }

    function cancelCommentButton(msg_id){
        document.getElementById(`addComment-${msg_id}`).style.display="none";
    }

    // --- DATA LOADING & STATE ---
    const [posts, setPosts] = useState([])
    const [commentsByPost,setCommentsByPost]=useState([])
    const [fileUpload,setFileUpload]=useState()
    const [previewUrl, setPreviewUrl] = useState();
    const [imageUrls, setImageUrls] = useState({});
    const [fileName, setFileName] = useState("No file chosen");
    const [currentUserId, setCurrentUserId] = useState(null);

    function uploadImageHandler(e){
        const file = e.target.files[0];
        if (file) {
            setFileUpload(file);
            setPreviewUrl(URL.createObjectURL(file));
            setFileName(file.name);
        }
    }

    useEffect(() => {
        async function fetchUserId() {
            const id = await getCurrentUserId();
            setCurrentUserId(id);
        }
        fetchUserId();
    }, [getCurrentUserId]);

    useEffect(() => {
        fetch("https://auroworld.onrender.com/messages")
        .then(res => res.json())
        .then(data => {
            setPosts(data.mData);
            data.mData.forEach(post => {
                fetch(`https://auroworld.onrender.com/messages/${post.msgId}/comments`)
                    .then(res => res.json())
                    .then(commentData => {
                        setCommentsByPost(prev => ({
                            ...prev,
                            [post.msgId]: commentData.mData
                        }));
                    });
            });
        })
        .catch(err => console.error("FETCH ERROR:", err))
    }, []);

    // ... (upvote functions and addFileToTable remain same)

    return(
        <div id="homepage" style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <Button onClick={mainpageButton}>Mainpage</Button>
                <Button onClick={coursesButton}>Courses</Button>
                <Button variant="secondary" onClick={signoutButton}>Sign Out</Button>
                <Button onClick={postButton}>Post</Button>
            </div>
                        
            <div id="addPost" style={{display:"none", marginBottom: '20px'}}>
                <Card>
                    <h3>Add a New Entry</h3>
                    <input type="text" id="newTitle" placeholder="Title" style={{ width: '100%', marginBottom: '10px' }} />
                    <textarea id="newPost" placeholder="What's on your mind?" style={{ width: '100%', minHeight: '80px' }}></textarea>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button onClick={addPostButton}>Send</Button>
                        <Button variant="secondary" onClick={cancelPostButton}>Cancel</Button>
                    </div>
                </Card>
            </div>

            <div id="messageList" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {posts?.map((post, i) => (
                <Card key={post.msgId}>
                    <h2>{post.subject}</h2>
                    <label>{post.message}</label>
                    <p style={{ fontSize: '14px', color: '#555' }}>By {post.username}</p>
                    <p><b>{post.upvote} Upvotes</b></p>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {currentUserId && post.uuid === currentUserId && (
                            <Button variant="secondary" onClick={() => editPostButton(post.msgId)}>Edit</Button>
                        )}
                        <Button variant="secondary" onClick={() => commentButton(post.msgId)}>Comment</Button>
                    </div>

                    {/* CHANGE: Unique ID for Edit Modal */}
                    <div id={`editPost-${post.msgId}`} style={{display:"none", marginTop: '15px'}}>
                        <Card variant="dark">
                            <h3>Edit Entry</h3>
                            <input type="text" id={`editTitle-${post.msgId}`} defaultValue={post.subject} style={{ width: '100%' }} />
                            <textarea id={`editMessage-${post.msgId}`} defaultValue={post.message} style={{ width: '100%', marginTop: '10px' }}></textarea>
                            <Button onClick={() => sendEditPostButton(post.msgId)}>Save</Button>
                            <Button variant="secondary" onClick={() => cancelEditPostButton(post.msgId)}>Cancel</Button>
                        </Card>
                    </div>

                    {/* CHANGE: Unique ID for Comment Modal */}
                    <div id={`addComment-${post.msgId}`} style={{display:"none", marginTop: '15px'}}>
                        <Card variant="dark">
                            <textarea id={`newComment-${post.msgId}`} placeholder="Write a comment..." style={{ width: '100%' }}></textarea>
                            <Button onClick={() => addCommentButton(post.msgId)}>Send</Button>
                            <Button variant="secondary" onClick={() => cancelCommentButton(post.msgId)}>Cancel</Button>
                        </Card>
                    </div>
                        
                    {/* Comments List */}
                    <div style={{ marginTop: '15px' }}>
                        {commentsByPost[post.msgId]?.map((comment, j) => (
                            <div key={j} style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px', marginBottom: '5px' }}>
                                <p>{comment.comment}</p>
                                <small>By {comment.userId}</small>
                            </div>
                        ))}
                    </div>
                </Card>
                ))}
            </div>
        </div>
    );
}
export default Posts;