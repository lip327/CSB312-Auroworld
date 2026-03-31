import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { createClient } from '@supabase/supabase-js';
import Button from './components/Button';
import Card from './components/Card';

function Posts() {
    const navigate = useNavigate();
    const supabase = createClient('https://rduempiojxizkwwbzaml.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo');

    // --- STATE ---
    const [posts, setPosts] = useState([]);
    const [commentsByPost, setCommentsByPost] = useState({});
    const [fileUpload, setFileUpload] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [imageUrls, setImageUrls] = useState({});
    // REMOVED unused 'fileName' to fix build error
    const [currentUserId, setCurrentUserId] = useState(null);

    // --- AUTH HELPER ---
    const getCurrentUserId = useCallback(async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return null;
        return user.id;
    }, [supabase]);

    // --- NAVIGATION ---
    const mainpageButton = () => navigate("/posts");
    const coursesButton = () => navigate("/courses");
    const signoutButton = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    // --- FILE & IMAGE LOGIC ---
    function uploadImageHandler(e) {
        const file = e.target.files[0];
        if (file) {
            setFileUpload(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    }

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
                .upload(`posts/${msg_id}/${fileUpload.name}`, fileUpload);
        } catch (error) {
            console.error("File upload error:", error.message);
        }
    }

    // --- POST LOGIC ---
    const postButton = () => { document.getElementById("addPost").style.display = "block"; };
    const cancelPostButton = () => { document.getElementById("addPost").style.display = "none"; };

    async function addPostButton() {
        try {
            const current_uuid = await getCurrentUserId();
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
            
            if (data.mStatus === "ok") {
                if (fileUpload) await addFileToTable(data.mData.msgId);
                window.location.reload();
            } else {
                alert("Post failed: " + data.mMessage);
            }
        } catch (error) {
            console.error(error.message);
        }
    }

    // --- EDIT LOGIC ---
    const editPostButton = (id) => { document.getElementById(`editPost-${id}`).style.display = "block"; };
    const cancelEditPostButton = (id) => { document.getElementById(`editPost-${id}`).style.display = "none"; };

    async function sendEditPostButton(msg_id) {
        try {
            const putBody = {
                subject: document.getElementById(`editTitle-${msg_id}`).value,
                message: document.getElementById(`editMessage-${msg_id}`).value,
            };
            const response = await fetch(`https://auroworld.onrender.com/messages/${msg_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(putBody)
            });
            const data = await response.json();
            if (data.mStatus === "ok") window.location.reload();
        } catch (error) { console.error(error); }
    }

    // --- COMMENT LOGIC ---
    const commentButton = (id) => { document.getElementById(`addComment-${id}`).style.display = "block"; };
    const cancelCommentButton = (id) => { document.getElementById(`addComment-${id}`).style.display = "none"; };

    async function addCommentButton(msg_id) {
        try {
            const current_uuid = await getCurrentUserId();
            const commBody = {
                user_uuid: current_uuid,
                comment: document.getElementById(`newComment-${msg_id}`).value
            };
            const res = await fetch(`https://auroworld.onrender.com/comments/${msg_id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(commBody)
            });
            const data = await res.json();
            if (data.mStatus === "ok") window.location.reload();
        } catch (error) { console.error(error); }
    }

    // --- UPVOTE LOGIC ---
    async function upvotePostButton(msg_id) {
        await fetch(`https://auroworld.onrender.com/messages/${msg_id}/upvote`, { method: "PUT" });
        window.location.reload();
    }

    async function upvoteCommentButton(comment_id) {
        await fetch(`https://auroworld.onrender.com/comments/${comment_id}/upvote`, { method: "PUT" });
        window.location.reload();
    }

    // --- DATA FETCHING ---
    useEffect(() => {
        async function fetchData() {
            const id = await getCurrentUserId();
            setCurrentUserId(id);

            const res = await fetch("https://auroworld.onrender.com/messages");
            const data = await res.json();
            const fetchedPosts = data.mData || [];
            setPosts(fetchedPosts);

            fetchedPosts.forEach(async (post) => {
                // Fetch Comments
                const cRes = await fetch(`https://auroworld.onrender.com/messages/${post.msgId}/comments`);
                const cData = await cRes.json();
                setCommentsByPost(prev => ({ ...prev, [post.msgId]: cData.mData }));

                // Fetch Files
                const fRes = await fetch(`https://auroworld.onrender.com/messages/${post.msgId}/files`);
                const fData = await fRes.json();
                if (fData.mData && fData.mData.length > 0) {
                    const fName = fData.mData[0].filename;
                    const { data: publicUrlData } = supabase.storage
                        .from('community_feed_file_upload')
                        .getPublicUrl(`posts/${post.msgId}/${fName}`);
                    setImageUrls(prev => ({ ...prev, [post.msgId]: publicUrlData.publicUrl }));
                }
            });
        }
        fetchData();
    }, [getCurrentUserId, supabase]);

    return (
        <div id="homepage" style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <Button onClick={mainpageButton}>Mainpage</Button>
                <Button onClick={coursesButton}>Courses</Button>
                <Button variant="secondary" onClick={signoutButton}>Sign Out</Button>
                <Button onClick={postButton}>Post</Button>
            </div>

            <div id="addPost" style={{ display: "none", marginBottom: '20px' }}>
                <Card>
                    <h3>Create Post</h3>
                    <input type="file" onChange={uploadImageHandler} style={{ marginBottom: '10px' }} />
                    {previewUrl && <img src={previewUrl} alt="Preview" style={{ width: '100px', marginBottom: '10px', display: 'block' }} />}
                    <input type="text" id="newTitle" placeholder="Title" style={{ width: '100%', marginBottom: '10px' }} />
                    <textarea id="newPost" placeholder="Message" style={{ width: '100%', minHeight: '80px' }} />
                    <Button onClick={addPostButton}>Send</Button>
                    <Button variant="secondary" onClick={cancelPostButton}>Cancel</Button>
                </Card>
            </div>

            <div id="messageList" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {posts.map((post) => (
                    <Card key={post.msgId}>
                        {imageUrls[post.msgId] && (
                            <img src={imageUrls[post.msgId]} alt="Post" style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }} />
                        )}
                        <h2>{post.subject}</h2>
                        <p>{post.message}</p>
                        <p>By {post.username || "Anonymous"}</p>
                        <p><b>{post.upvote} Upvotes</b></p>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button variant="secondary" onClick={() => upvotePostButton(post.msgId)}>⬆️ Upvote</Button>
                            <Button variant="secondary" onClick={() => commentButton(post.msgId)}>Comment</Button>
                            {currentUserId === post.uuid && (
                                <Button variant="secondary" onClick={() => editPostButton(post.msgId)}>Edit</Button>
                            )}
                        </div>

                        <div id={`editPost-${post.msgId}`} style={{ display: 'none', marginTop: '15px' }}>
                            <Card variant="dark">
                                <input type="text" id={`editTitle-${post.msgId}`} defaultValue={post.subject} style={{ width: '100%' }} />
                                <textarea id={`editMessage-${post.msgId}`} defaultValue={post.message} style={{ width: '100%', marginTop: '10px' }} />
                                <Button onClick={() => sendEditPostButton(post.msgId)}>Save</Button>
                                <Button variant="secondary" onClick={() => cancelEditPostButton(post.msgId)}>Cancel</Button>
                            </Card>
                        </div>

                        <div id={`addComment-${post.msgId}`} style={{ display: 'none', marginTop: '15px' }}>
                            <textarea id={`newComment-${post.msgId}`} placeholder="Write a comment..." style={{ width: '100%' }} />
                            <Button onClick={() => addCommentButton(post.msgId)}>Post Comment</Button>
                            <Button variant="secondary" onClick={() => cancelCommentButton(post.msgId)}>Cancel</Button>
                        </div>

                        <div style={{ marginTop: '15px' }}>
                            {commentsByPost[post.msgId]?.map((c, idx) => (
                                <div key={idx} style={{ background: '#f9f9f9', padding: '10px', marginTop: '5px' }}>
                                    <p>{c.comment}</p>
                                    <small>Upvotes: {c.upvote} <span style={{ cursor: 'pointer' }} onClick={() => upvoteCommentButton(c.commentId)}>⬆️</span></small>
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