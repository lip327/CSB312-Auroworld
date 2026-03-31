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
        const { data: { user } ,error} = await supabase.auth.getUser()
        if(error){
            console.log("problem grabbing uuid" +error.message)
            return
        }
        else if(user){
            return user.id
        }
    }, [supabase])

    function mainpageButton(){
        navigate("/posts")
    }
    function coursesButton(){
        navigate("/courses")
    }
    async function signoutButton(){
        const { error } = await supabase.auth.signOut()
        if(!error){
            navigate("/login")
        }
    }

    function postButton(){
        document.getElementById("addPost").style.display="block"
    }

    // --- ADDED THIS TO FIX BUILD ERROR ---
    async function addFileToTable(msg_id) {
        try {
            const current_uuid = await getCurrentUserId();
            const fileBody = {
                filename: fileUpload.name,
                msgId: msg_id,
                user_uuid: current_uuid
            };
            await fetch("https://auroworld.onrender.com/files", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fileBody)
            });
            await supabase.storage
                .from('community_feed_file_upload')
                .upload(`${fileUpload.name}`, fileUpload);
        } catch (error) {
            console.error("File upload error:", error.message);
        }
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
                await addFileToTable(data.mData.msgId)
            }
            window.location.reload();
        } catch(error){
            console.error(error.message)
        }
    }

    function cancelPostButton(){
        document.getElementById("addPost").style.display="none"
    }

    // --- FIXED UNIQUE IDs FOR MODALS ---
    function editPostButton(msg_id){
        document.getElementById(`editPost-${msg_id}`).style.display="block"
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
            if (data.mStatus !== "ok"){
                alert("Edit post failed: " + data.mMessage);
                return
            }
            window.location.reload();
        }catch(error){
            console.error(error.message)
        }
    }

    function cancelEditPostButton(msg_id){
        document.getElementById(`editPost-${msg_id}`).style.display="none"
    }

    function commentButton(msg_id){
        document.getElementById(`addComment-${msg_id}`).style.display="block"
    }

    async function addCommentButton(msg_id){
        try{
            const current_uuid = await getCurrentUserId()
            const commBody={
                user_uuid: current_uuid,
                comment: document.getElementById(`newComment-${msg_id}`).value
            }
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
        document.getElementById(`addComment-${msg_id}`).style.display="none"
    }

    const [posts, setPosts] = useState([])
    const [commentsByPost,setCommentsByPost]=useState({})
    const [fileUpload,setFileUpload]=useState()
    const [previewUrl, setPreviewUrl] = useState();
    const [imageUrls, setImageUrls] = useState({});
    const [currentUserId, setCurrentUserId] = useState(null);

    function uploadImageHandler(e){
        const file = e.target.files[0];
        if (file) {
            setFileUpload(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    }

    async function upvotePostButton(msg_id){
        await fetch(`https://auroworld.onrender.com/messages/${msg_id}/upvote`, {method:"PUT"})
        window.location.reload()
    }

    async function upvoteCommentButton(comment_id){
        await fetch(`https://auroworld.onrender.com/comments/${comment_id}/upvote`, {method:"PUT"})
        window.location.reload()
    }

    useEffect(() => {
        async function loadData() {
            const id = await getCurrentUserId();
            setCurrentUserId(id);

            const res = await fetch("https://auroworld.onrender.com/messages");
            const data = await res.json();
            setPosts(data.mData || []);

            data.mData?.forEach(async (post) => {
                // Fetch Comments
                const cRes = await fetch(`https://auroworld.onrender.com/messages/${post.msgId}/comments`);
                const cData = await cRes.json();
                setCommentsByPost(prev => ({ ...prev, [post.msgId]: cData.mData }));

                // Fetch Files - FIXED PATH
                const fRes = await fetch(`https://auroworld.onrender.com/messages/${post.msgId}/files`);
                const fData = await fRes.json();
                if (fData.mData && fData.mData.length > 0) {
                    const fName = fData.mData[0].filename;
                    const { data: publicUrlData } = supabase.storage
                        .from('community_feed_file_upload')
                        .getPublicUrl(`${fName}`);
                    setImageUrls(prev => ({ ...prev, [post.msgId]: publicUrlData.publicUrl }));
                }
            });
        }
        loadData();
    }, [getCurrentUserId, supabase]);

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
                    <h3 style={{ marginTop: 0 }}>Add a New Entry</h3>
                    <input type="file" onChange={uploadImageHandler} style={{marginBottom: '10px'}} />
                    {previewUrl && <img src={previewUrl} alt="Preview" style={{ width: '100px', display: 'block', marginBottom: '10px' }} />}
                    <input type="text" id="newTitle" placeholder="Title" style={{ width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                    <textarea id="newPost" placeholder="What's on your mind?" style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px' }}></textarea>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button onClick={addPostButton}>Send</Button>
                        <Button variant="secondary" onClick={cancelPostButton}>Cancel</Button>
                    </div>
                </Card>
            </div>

            <div id="messageList" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {posts.map((post) => (
                <Card key={post.msgId}>
                    {imageUrls[post.msgId] && (
                        <img src={imageUrls[post.msgId]} alt="Post" style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }} />
                    )}
                    <h2 style={{ marginTop: 0 }}>{post.subject}</h2>
                    <label style={{ display: 'block', marginBottom: '10px' }}>{post.message}</label>
                    <p style={{ fontSize: '14px', color: '#555' }}>By {post.username || "Anonymous"}</p>
                    <p><b>{post.upvote} Upvotes</b></p>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button variant="secondary" onClick={()=> upvotePostButton(post.msgId)}>⬆️ Upvote</Button>
                        <Button variant="secondary" onClick={() => commentButton(post.msgId)}>Comment</Button>
                        {currentUserId === post.uuid && (
                            <Button variant="secondary" onClick={() => editPostButton(post.msgId)}>Edit</Button>
                        )}
                    </div>

                    <div id={`editPost-${post.msgId}`} style={{display:"none", marginTop: '15px'}}>
                        <Card variant="dark">
                            <h3>Edit Entry</h3>
                            <input type="text" id={`editTitle-${post.msgId}`} defaultValue={post.subject} style={{ width: '100%', padding: '8px', borderRadius: '4px' }} />
                            <textarea id={`editMessage-${post.msgId}`} defaultValue={post.message} style={{ width: '100%', marginTop: '10px', minHeight: '60px', padding: '8px', borderRadius: '4px' }}></textarea>
                            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                <Button onClick={() => sendEditPostButton(post.msgId)}>Save</Button>
                                <Button variant="secondary" onClick={() => cancelEditPostButton(post.msgId)}>Cancel</Button>
                            </div>
                        </Card>
                    </div>

                    <div id={`addComment-${post.msgId}`} style={{display:"none", marginTop: '15px'}}>
                        <Card variant="dark">
                            <textarea id={`newComment-${post.msgId}`} placeholder="Write a comment..." style={{ width: '100%', padding: '8px', borderRadius: '4px' }}></textarea>
                            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                <Button onClick={() => addCommentButton(post.msgId)}>Send</Button>
                                <Button variant="secondary" onClick={() => cancelCommentButton(post.msgId)}>Cancel</Button>
                            </div>
                        </Card>
                    </div>
                        
                    <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                        {commentsByPost[post.msgId]?.map((comment, j) => (
                            <div key={j} style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>{comment.comment}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <small>Upvotes: {comment.upvote}</small>
                                    <Button variant="secondary" onClick={()=> upvoteCommentButton(comment.commentId)}>⬆️</Button>
                                </div>
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