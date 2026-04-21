import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'
import Button from './components/Button';
import Card from './components/Card';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MiniCalendar from './components/MiniCalendar';
import { useUser } from './UserContext';

function Posts(){
    const navigate=useNavigate();
    const supabase = createClient('https://rduempiojxizkwwbzaml.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo')
    const { displayName, email, avatarUrl } = useUser();

    function getInitials() {
        const name = displayName || email || '';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name[0]?.toUpperCase() || '?';
    }

    function getAvatarColor() {
        const colors = ['#6C63FF', '#FF6584', '#43B89C', '#F6B93B', '#E55039', '#2E86AB'];
        const str = email || '';
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }

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
            const {data,error} = await supabase.storage.from('community_feed_file_upload').upload('posts/'+msg_id+'/'+fileUpload.name, fileUpload)
            if(data){
                console.log(data)
            }
            else{
                console.log(error.message)
            }

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
        console.log("msg_id for editpost: "+msg_id)
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
            if(fileUpload){
                editFileInTable(msg_id)
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
    async function editFileInTable(msg_id){
        try{
            console.log("editFileInTable msgId: "+msg_id)
            const editFileBody={
                filename:fileUpload.name
            }
            const response=await fetch(`http://localhost:8080/files/${msg_id}`,{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify(editFileBody)
            });
            const fileData = await response.json()
            console.log("File Post response: ",fileData)
            if (fileData.mStatus!=="ok"){
                alert("File Post failed: "+fileData.mMessage)
                return
            }
        }catch (error){
            console.error(error.message)
        }
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

    useEffect(() => {
        async function gatherMyPosts(){
            const userId = await getCurrentUserId()
            console.log("userId is: "+userId)
            fetch(`http://localhost:8080/messages`)
            .then(res => res.json())
            .then(data => {
                console.log("FULL RESPONSE:", data)
                console.log("Posts mData:", data.mData)
                setPosts(data.mData);
            })
            .catch(err => console.error("FETCH ERROR for getting posts:", err))
        }
        gatherMyPosts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const [imageUrls, setImageUrls] = useState({});

    useEffect(() =>{
        async function loadImages(){
            if(!posts) return
            const newUrls={}

            for (const post of posts) {
                try{
                    const { data} = supabase.storage
                        .from('community_feed_file_upload')
                        .getPublicUrl(
                            post.filepath
                        );
                    console.log("data from community_feed: ",data)
                    if (data && data.publicUrl) {
                        console.log('Public URL:', data.publicUrl);
                    } else {
                        console.error('Error getting public URL or URL is undefined');
                    }
                    
                    newUrls[post.msgId] = data.publicUrl;

                }catch(err){
                    console.error(err)
                    newUrls[post.msgId]=null
                }
            }
            setImageUrls(newUrls);
        }
        loadImages()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[posts])

    const [fileUpload,setFileUpload]=useState()
    const [previewUrl, setPreviewUrl] = useState();
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
                    } else if(profileError){
                        setCurrentUserName(user.email?.split('@')[0] || "User");
                    }
                } catch (err) {
                    console.error("查表报错:", err);
                    setCurrentUserName(user.email?.split('@')[0] || "User");
                }
            } else if(authError){
                setCurrentUserName("Guest");
            }
        }
        fetchUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [data, setData] = useState([]);
    const [sortType, setSortType] = useState('sortByNewest');

    useEffect(() => {
        const sortArray = type =>{
            const types ={
                sortByNewest: 'msgId',
                sortByUpvotes: 'upvote',
            }
            const sortProperty=types[type]
            const sorted = [...posts].sort((a,b) => b[sortProperty]-a[sortProperty])
            console.log(sorted)
            setData(sorted)
        }
        sortArray(sortType)
    }, [sortType, posts])

    const[postUsernameQuery,setPostUsernameQuery] = useState("")

    console.log("usestate currentuserid: "+currentUserId)
   
    return(
        <div style={{ display: 'flex', height: '100vh', width: '100vw', margin: '0', overflow: 'hidden', backgroundColor: '#f0f2f5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontSize: '16px', color: '#111' }}>
            
            <Sidebar 
                onMainpage={mainpageButton} 
                onCourses={coursesButton}
                onSignout={signoutButton} 
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                <Header username={currentUserName} />

                <div style={{ flex: 1, overflow: 'hidden', padding: '20px', display: 'flex', gap: '20px' }}>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Post composer */}
                        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="avatar" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: getAvatarColor(), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                                    {getInitials()}
                                </div>
                            )}
                            <div
                                onClick={postButton}
                                style={{ flex: 1, padding: '10px 16px', borderRadius: '24px', backgroundColor: '#f0f2f5', color: '#888', fontSize: '15px', cursor: 'pointer' }}
                            >
                                What's on your mind?
                            </div>
                            <Button onClick={postButton}>Post</Button>
                        </div>

                        <div id="addPost" style={{display:"none"}}>
                            <Card>
                                <h3 style={{ marginTop: 0 }}>Add a New Entry</h3>
                                <label style={{ fontWeight: 'bold' }}>Title</label>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <input type="file" id="hiddenAddFileInput" onChange={uploadImageHandler} style={{ display: 'none' }}></input>
                                    <Button variant="secondary" onClick={() => document.getElementById("hiddenAddFileInput").click()}>Upload File</Button>
                                    <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>{fileName}</span>
                                </div>

                                <img src={previewUrl} alt="" style={{ maxWidth: '100%', borderRadius: '8px' }}></img>
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

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <select onChange={(e) => setSortType(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', backgroundColor: '#fff', fontSize: '14px' }}>
                                <option value="sortByNewest">Sort Posts By New</option>
                                <option value="sortByUpvotes">Sort Posts By Upvotes</option>
                            </select>
                            <input type="text" placeholder="Search by username..." onChange={(e) => setPostUsernameQuery(e.target.value)} style={{ flex: 2, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                        </div>

                        <div id="messageList" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {data.filter((post)=>post.username.toLowerCase().includes(postUsernameQuery))?.map((post, i) => (
                            
                            <div key={i} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

                                {/* Post header: avatar + username + timestamp */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                                        {post.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#111' }}>{post.username}</div>
                                        <div style={{ fontSize: '12px', color: '#aaa' }}>#{post.msgId}</div>
                                    </div>
                                    {currentUserId && post.uuid === currentUserId && (
                                        <button onClick={() => editPostButton(post.msgId)} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '4px 12px', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Edit</button>
                                    )}
                                </div>

                                {/* Post content */}
                                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#111' }}>{post.subject}</div>
                                <div style={{ fontSize: '15px', color: '#333', lineHeight: '1.5', marginBottom: '14px' }}>{post.message}</div>

                                {imageUrls[post.msgId] && (
                                    <img src={imageUrls[post.msgId]} alt="Post attachment" style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '14px' }} />
                                )}

                                {/* Upvote + Comment bar */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                                    <button onClick={() => upvoteButton(post.msgId)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#555', fontWeight: '600' }}>
                                        ⬆️ {post.upvote}
                                    </button>
                                    <button onClick={() => commentButton(post.msgId)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#555', fontWeight: '600' }}>
                                        💬 Comment
                                    </button>
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

                                        <img src={fileUpload} alt="" style={{ maxWidth: '100%', borderRadius: '8px' }}></img>

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
                                {post.commentdata && post.commentdata.length > 0 && (
                                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {(post.commentdata)?.map((comment,j)=>(
                                            <div key={j} style={{ backgroundColor: '#f7f7f7', padding: '12px 14px', borderRadius: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#43B89C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#fff' }}>
                                                        {comment.username?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#333' }}>{comment.username}</span>
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>{comment.comment}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <button onClick={() => upvoteCommentButton(comment.commentId)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#555', fontWeight: '600' }}>
                                                        ⬆️ {comment.upvote}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ width: '320px', minWidth: '320px' }}>
                        <MiniCalendar onDateChange={(date) => navigate('/calendar', { state: { selectedDate: date } })} />
                    </div>

                </div>
            </div>
        </div>
    );
}
export default Posts;