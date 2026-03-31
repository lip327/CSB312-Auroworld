import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'
import Button from './components/Button';
import Card from './components/Card';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MiniCalendar from './components/MiniCalendar';

function Posts(){
    const navigate=useNavigate();
    const supabase = createClient('https://rduempiojxizkwwbzaml.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo')

    async function getCurrentUserId(){
        const { data: { user } ,error} = await supabase.auth.getUser()
        if(error){
            console.log("problem grabbing uuid" +error.message)
            return
        }
        else if(user){
            console.log("current user's unique id: "+user.id)
            return user.id
        }
    }

    function mainpageButton(){
        navigate("/posts")
    }
    function coursesButton(){
        navigate("/courses")
    }
    async function signoutButton(){
        const { error } = await supabase.auth.signOut();
        if (!error) {
            console.log('User signed out successfully and session cleared.');
            navigate("/login")
        } else {
            console.error('Error signing out:', error.message);
        }
    }
    async function postButton(){
        console.log("hitting post button");
        document.getElementById("addPost").style.display="block";
    }
    async function addPostButton(){
        console.log("hitting add post button");
        try{
            const current_uuid = await getCurrentUserId()
            const postBody = {
                subject: document.getElementById("newTitle").value,
                message: document.getElementById("newPost").value,
                user_uuid: current_uuid
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
            console.log("addPost new message Id= "+data.mData.msgId)
            if(fileUpload) {
                addFileToTable(data.mData.msgId)
            }
            return
            
        } catch(error){
            console.error(error.message)
        }
        
       cancelPostButton();
    }
    function cancelPostButton(){
        console.log("hitting cancel post button");
        document.getElementById("addPost").style.display="none";
    }
    async function addFileToTable(msg_id){
        try{
            console.log("addFileToTable msgId: "+msg_id)
            const current_uuid = await getCurrentUserId()
            const fileBody={
                filename:fileUpload.name,
                msgId:msg_id,
                user_uuid:current_uuid
            }
            const response=await fetch("http://localhost:8080/files",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify(fileBody)
            });
            const fileData = await response.json()
            console.log("File Post response: ",fileData)
            if (fileData.mStatus!=="ok"){
                alert("File Post failed: "+fileData.mMessage)
                return
            }
            const {data} = await supabase.storage.from('community_feed_file_upload').upload('posts/'+msg_id+'/'+fileUpload.name, fileUpload)
            console.log(data)

        }catch (error){
            console.error(error.message)
        }
    }

    function editPostButton(msg_id){
        console.log("hitting edit post button");
        document.getElementById(`editPost-${msg_id}`).style.display="block";
    }
    async function sendEditPostButton(msg_id){
        console.log("hitting send edit post button ");
        try{
            const putBody={
                subject:document.getElementById(`editTitle-${msg_id}`).value,
                message:document.getElementById(`editMessage-${msg_id}`).value,
            };
            const response = await fetch(`http://localhost:8080/messages/${msg_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(putBody)
            });
            const data = await response.json()
            console.log("Edit post response: ",data)
            if (data.mStatus!=="ok"){ 
                alert("Edit post failed: "+data.mMessage);
                return
            }
        }catch(error){
            console.error(error.message)
        }
        cancelEditPostButton(msg_id);
    }
    function cancelEditPostButton(msg_id){
        console.log("hitting cancel edit post button");
        document.getElementById(`editPost-${msg_id}`).style.display="none";
    }

    function commentButton(msg_id){
        console.log("hitting comment button");
        document.getElementById(`addComment-${msg_id}`).style.display="block";
    }
    async function addCommentButton(msg_id){
        console.log("hitting add comment button:"+msg_id);
        try{
            const current_uuid = await getCurrentUserId()
            const commBody={
                user_uuid:current_uuid,
                comment:document.getElementById(`newComment-${msg_id}`).value
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
        cancelCommentButton(msg_id)
    }
    async function upvoteButton(msg_id){
        console.log("hitting upvote button for "+msg_id)
        try{
            const current_uuid = await getCurrentUserId()
            const stuff ={
                user_uuid:current_uuid,
            }
            const res = await fetch(`http://localhost:8080/vote_messages/${msg_id}`,{
                method:"PUT",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify(stuff)
            })
            const data=await res.json()
            console.log("Post upvoted: ",data);
            if(data.mStatus!=="ok"){
                return
            }
        }catch(error){
            console.error(error.message)
        }
    }
    async function upvoteCommentButton(comment_id){
        console.log("hitting comment upvote button for "+comment_id)
        try{
            const current_uuid = await getCurrentUserId()
            const stuff ={
                user_uuid:current_uuid,
            }
            const res=await fetch(`http://localhost:8080/vote_comments/${comment_id}`,{
                method:"PUT",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify(stuff)
            })
            const data = await res.json()
            console.log("Comment upvoted: ",data);
            if(data.mStatus!=="ok"){
                return
            }
        }catch(error){
            console.error(error.message)
        }
    }
    function cancelCommentButton(msg_id){
        console.log("hitting cancel comment button");
        document.getElementById(`addComment-${msg_id}`).style.display="none";
    }
    
    const [posts, setPosts] = useState([])
    const [commentsByPost,setCommentsByPost]=useState([])

    const [fileUpload,setFileUpload]=useState()
    const [previewUrl, setPreviewUrl] = useState();

    const [imageUrls, setImageUrls] = useState({});

    const [fileName, setFileName] = useState("No file chosen");

    function uploadImageHandler(e){
        const file = e.target.files[0];
        if (file) {
            setFileUpload(file);
            setPreviewUrl(URL.createObjectURL(file));
            setFileName(file.name);
        }else {
            setFileName("No file chosen"); 
        }
    }

    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("Loading...");

    useEffect(() => {
        async function fetchUserData() {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (user) {
                setCurrentUserId(user.id);
                try {
                    const { data: profileData, error: profileError } = await supabase
                        .from('users') 
                        .select('firstname, lastname, username')
                        .eq('email', user.email)
                        .single();

                    if (profileData) {
                        setCurrentUserName(`${profileData.firstname} ${profileData.lastname}`);
                    } else {
                        setCurrentUserName(user.email?.split('@')[0] || "User");
                    }
                } catch (err) {
                    console.error("查表报错:", err);
                    setCurrentUserName(user.email?.split('@')[0] || "User");
                }
            } else {
                setCurrentUserName("Guest");
            }
        }
        fetchUserData();
    }, []);

    useEffect(() => {
        fetch("http://localhost:8080/messages")
        .then(res => res.json())
        .then(data => {
            console.log("FULL RESPONSE:", data)
            console.log("Posts mData:", data.mData)
            setPosts(data.mData);
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

    useEffect(() => {
        async function loadImages() {
            if (!posts) return;
            const newUrls = {};
            for (const post of posts) {
                try {
                    console.log("retrieving image for post", post.msgId);
                    const filename_res = await fetch(
                        `http://localhost:8080/file/${post.msgId}`
                    );
                    const filename = await filename_res.json();

                    if (filename.mStatus !== "ok") {
                        newUrls[post.msgId] = null;
                        continue;
                    }
                    const { data} = supabase.storage
                        .from('community_feed_file_upload')
                        .getPublicUrl(
                            'posts/' + post.msgId + '/' + filename.mData
                        );
                    if (data && data.publicUrl) {
                        console.log('Public URL:', data.publicUrl);
                    }
                    newUrls[post.msgId] = data.publicUrl;
                } catch (err) {
                    console.error(err);
                    newUrls[post.msgId] = null;
                }
            }
            setImageUrls(newUrls);
        }
        loadImages();
    }, [posts]);

    console.log("usestate currentuserid: "+currentUserId)
   
    return(
        <div style={{ display: 'flex', height: '100vh', width: '100vw', margin: '0', overflow: 'hidden', backgroundColor: '#f0f2f5' }}>
            
            <Sidebar 
                onMainpage={mainpageButton} 
                onCourses={coursesButton} 
                onSignout={signoutButton} 
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                <Header username={currentUserName} />


                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', justifyContent: 'center', gap: '30px' }}>
                    

                    <div style={{ flex: 1, maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px' }}>                  
                        <Card style={{ padding: '15px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px' }} onClick={postButton}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#d9d9d9' }}></div>
                                <span style={{ color: '#888', fontSize: '15px' }}>Start a new post...</span>
                            </div>
                        </Card>

                        <div id="addPost" style={{display:"none"}}>
                            <Card>
                                <h3 style={{ marginTop: 0 }}>Add a New Entry</h3>
                                <label style={{ fontWeight: 'bold' }}>Title</label>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <input type="file" id="hiddenAddFileInput" onChange={uploadImageHandler} style={{ display: 'none' }}></input>
                                    <Button variant="secondary" onClick={() => document.getElementById("hiddenAddFileInput").click()}>Upload File</Button>
                                    <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>{fileName}</span>
                                </div>

                                <img src={previewUrl} style={{ maxWidth: '100%', borderRadius: '8px' }}></img>
                                {fileUpload &&(
                                    <div style={{ margin: '10px 0', fontSize: '14px', color: '#666' }}>
                                        <p>Selected File: {fileUpload.name}</p>
                                        <p>Size: {fileUpload.size} bytes</p>
                                        <p>Type: {fileUpload.type}</p>
                                    </div>
                                )}

                                <input type="text" id="newTitle" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }} />
                                <textarea id="newPost" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', minHeight: '80px', boxSizing: 'border-box' }}></textarea>
                                
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <Button onClick={addPostButton}>Send</Button>
                                    <Button variant="secondary" onClick={cancelPostButton}>Cancel</Button>
                                </div>
                            </Card>
                        </div>

                        <div id="messageList" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {posts?.map((post, i) => (
                            
                            <Card key={i}>
                                <div style={{ color: '#888', fontSize: '12px' }}>{post.msg_id}</div>

                                {imageUrls[post.msgId] && (
                                    <img
                                        src={imageUrls[post.msgId]}
                                        alt="Post attachment"
                                        width="200"
                                        style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px' }}
                                    />
                                )}

                                <h2 style={{ marginTop: '10px', marginBottom: '5px' }}>{post.subject}</h2>
                                <label style={{ display: 'block', marginBottom: '10px' }}>{post.message}</label>
                                <p style={{ fontSize: '14px', color: '#555' }}>By {post.username}</p>
                                
                                <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{post.upvote} Upvotes</p>
                                
                                {/* button */}
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                    {currentUserId && post.uuid === currentUserId && (
                                        <Button variant="secondary" onClick={() => editPostButton(post.msgId)}>Edit</Button>
                                    )}
                                    <Button variant="secondary" onClick={()=> upvoteButton(post.msgId)}>⬆️</Button>
                                    <Button variant="secondary" onClick={() => commentButton(post.msgId)}>Comment</Button>
                                </div>

                                <div id={`editPost-${post.msgId}`} style={{display:"none", marginTop: '15px'}}>
                                    <Card variant="dark">
                                        <h3 style={{ marginTop: 0 }}>Edit Entry</h3>
                                        <label style={{ fontWeight: 'bold' }}>Title</label>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <input type="file" id={`hiddenEditFileInput-${post.msgId}`} onChange={uploadImageHandler} style={{ display: 'none' }}></input>
                                            <Button variant="secondary" onClick={() => document.getElementById(`hiddenEditFileInput-${post.msgId}`).click()}>Upload File</Button>
                                            <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>{fileName}</span>
                                        </div>

                                        <img src={fileUpload} style={{ maxWidth: '100%', borderRadius: '8px' }}></img>

                                        <input type="text" id={`editTitle-${post.msgId}`} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }} />
                                        <textarea id={`editMessage-${post.msgId}`} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', minHeight: '80px', boxSizing: 'border-box' }}></textarea>
                                        
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <Button onClick={() => sendEditPostButton(post.msgId)}>Send</Button>
                                            <Button variant="secondary" onClick={() => cancelEditPostButton(post.msgId)}>Cancel</Button>
                                        </div>
                                    </Card>
                                </div>

                                <div id={`addComment-${post.msgId}`} style={{display:"none", marginTop: '15px'}}>
                                    <Card variant="dark">
                                        <h3 style={{ marginTop: 0 }}>Make a Comment</h3>
                                        <label style={{ fontWeight: 'bold' }}>Message</label>

                                        <textarea id={`newComment-${post.msgId}`} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', minHeight: '60px', boxSizing: 'border-box' }}></textarea>

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <Button onClick={() => addCommentButton(post.msgId)}>Send</Button>
                                            <Button variant="secondary" onClick={() => cancelCommentButton(post.msgId)}>Cancel</Button>
                                        </div>
                                    </Card>
                                </div>
                                    
                                {/* comments */}
                                {commentsByPost[post.msgId] && commentsByPost[post.msgId].length > 0 && (
                                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {(commentsByPost[post.msgId])?.map((comment,j)=>(
                                            <div key={j} style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px' }}>{comment.comment}</label>
                                                <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>By {comment.userId}</p>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>{comment.upvote} Upvotes</p>
                                                    <Button variant="secondary" onClick={()=> upvoteCommentButton(comment.commentId)}>⬆️</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                            ))}
                        </div>
                    </div>

                    <div style={{ width: '320px', minWidth: '320px' }}>
                        <MiniCalendar />
                    </div>

                </div>
            </div>
        </div>
    );
}
export default Posts;