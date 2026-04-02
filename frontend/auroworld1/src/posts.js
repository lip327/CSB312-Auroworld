import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'
import Button from './components/Button';
import Card from './components/Card';

function Posts(){
    const navigate=useNavigate();
    //const supabase = createClient('your_project_url', 'your_supabase_api_key')
    const supabase = createClient('https://rduempiojxizkwwbzaml.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo')
    //const { data: { session }, error } = await supabase.auth.getSession();

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
    function profileButton(){
        navigate("/profile")
    }
    function mainpageButton(){
        navigate("/posts")
    }
    function coursesButton(){
        navigate("/courses")
    }
    function signinButton(){
        navigate("/login")
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
        // const { data: { session }, error } = await supabase.auth.getSession();
        // if (session) {
        //     console.log('User is logged in:', session.user);
        // } else {
        //     console.log('No user session.');
        //     console.error(error.message)
        //     alert("You are not signed in so you cant post")
        //     return
        // }
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
            //adding file to bucket
            //const { data, error } = await supabase.storage.from('bucket_name').upload('file_path', file)
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

    function editPostButton(){
        console.log("hitting edit post button");
        document.getElementById("editPost").style.display="block";
    }
    async function sendEditPostButton(msg_id){
        console.log("hitting send edit post button ");
        console.log("msg_id for editpost: "+msg_id)
        try{
            const putBody={
                subject:document.getElementById("editTitle").value,
                message:document.getElementById("editMessage").value,
            };
            const response = await fetch(`http://localhost:8080/messages/${msg_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(putBody)
            });
            const data = await response.json()
            console.log("Edit post response: ",data)
            if (data.mStatues!=="ok"){
                alert("Edit post failed: "+data.mMessage);
                return
            }
            if(fileUpload){
                editFileInTable(msg_id)
            }
        }catch(error){
            console.error(error.message)
        }
       cancelEditPostButton();
    }
    function cancelEditPostButton(){
        console.log("hitting cancel edit post button");
        document.getElementById("editPost").style.display="none";
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
            //adding file to bucket
            //const { data, error } = await supabase.storage.from('bucket_name').upload('file_path', file)
            //const {data} = await supabase.storage.from('community_feed_file_upload').upload('posts/'+msg_id+'/'+fileUpload.name, fileUpload)
            //console.log(data)

        }catch (error){
            console.error(error.message)
        }
    }
    function commentButton(){
        console.log("hitting comment button");
        document.getElementById("addComment").style.display="block";
    }
    async function addCommentButton(msg_id){
        console.log("hitting add comment button:"+msg_id);
        try{
            const current_uuid = await getCurrentUserId()
            const commBody={
                user_uuid:current_uuid,
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
    function cancelCommentButton(){
        console.log("hitting cancel comment button");
        document.getElementById("addComment").style.display="none";
    }

    const [posts, setPosts] = useState([])

    useEffect(() => {
        async function gatherMyPosts(){
            const userId = await getCurrentUserId()
            console.log("userId is: "+userId)
            fetch(`http://localhost:8080/messages2`)
            .then(res => res.json())
            .then(data => {
                console.log("FULL RESPONSE:", data)
                console.log("Posts mData:", data.mData)
                setPosts(data.mData);
            })
            .catch(err => console.error("FETCH ERROR for getting posts:", err))
        }
        gatherMyPosts()
    
    }, []);

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
    useEffect(() => {
        async function fetchUserId() {
            const id = await getCurrentUserId();
            setCurrentUserId(id);
        }
        fetchUserId();
    }, []);

    const [data, setData] = useState([]);
    const [sortType, setSortType] = useState('msgId');

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
    }, [sortType])

    const[postUsernameQuery,setPostUsernameQuery] = useState("")

    return(
        <div id="homepage" style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {currentUserId && (
                    <Button variant="secondary" onClick={signoutButton}>Sign Out</Button>
                )}
                {!currentUserId && (
                    <Button variant="secondary" onClick={signinButton}>Sign in</Button>
                )}
                <Button onClick={mainpageButton}>⌂ Mainpage</Button>
                <Button onClick={coursesButton}>🕮 Courses</Button>
                {currentUserId && (
                    <Button onClick={postButton}>📝 Post</Button>
                )}
            </div>
            {currentUserId && (
                <div id="profileBtn" style={{float:'right'}}>
                    <Button onClick={profileButton}>Profile</Button>
                </div>
            )}
                  
            <div id="addPost" style={{display:"none", marginBottom: '20px'}}>
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
            <select onChange={(e) => setSortType(e.target.value)}>
                <option value="sortByNewest">Sort Posts By New</option>
                <option value="sortByUpvotes">Sort Posts By Upvotes</option>
            </select>
            <input type ="text" placeholder="Search Posts By User..." className="search" onChange={(e) => setPostUsernameQuery(e.target.value)}/>
            <div id="messageList" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {data.filter((post)=>post.username.toLowerCase().includes(postUsernameQuery))?.map((post, i) => (
                
                <Card key={i}>
                    <div style={{ color: '#888', fontSize: '12px' }}></div>

                    {imageUrls[post.msgId] && (
                        <img
                            src={imageUrls[post.msgId]}
                            alt="Post attachment"
                        />
                    )}

                    <h2 style={{ marginTop: '10px', marginBottom: '5px' }}>{post.subject}</h2>
                    <label style={{ display: 'block', marginBottom: '10px' }}>{post.message}</label>
                    <p style={{ fontSize: '14px', color: '#555' }}>By {post.username}</p>
                    
                    <p>{post.upvote} Upvotes</p>
                    {currentUserId && (
                        <button onClick={()=>upvoteButton(post.msgId)}>⬆️</button>
                    )}

                    {currentUserId && post.uuid === currentUserId && (
                        <button onClick={() => editPostButton(post.msgId)}>Edit</button>
                    )}

                    {currentUserId && (
                        <button onClick={()=>commentButton()}>Comment</button>
                    )}

                    <div id="editPost" style={{display:"none", marginTop: '15px'}}>
                        <Card variant="dark">
                            <h3 style={{ marginTop: 0 }}>Edit Entry</h3>
                            <label style={{ fontWeight: 'bold' }}>Title</label>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <input type="file" id={`hiddenEditFileInput-${post.msgId}`} onChange={uploadImageHandler} style={{ display: 'none' }}></input>
                                <Button variant="secondary" onClick={() => document.getElementById(`hiddenEditFileInput-${post.msgId}`).click()}>Upload File</Button>
                                <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>{fileName}</span>
                            </div>

                            <img src={fileUpload} style={{ maxWidth: '100%', borderRadius: '8px' }}></img>

                            <input type="text" id="editTitle" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }} />
                            <textarea id="editMessage" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', minHeight: '80px', boxSizing: 'border-box' }}></textarea>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Button onClick={sendEditPostButton}>Send</Button>
                                <Button variant="secondary" onClick={cancelEditPostButton}>Cancel</Button>
                            </div>
                        </Card>
                    </div>

                    <div id="addComment" style={{display:"none", marginTop: '15px'}}>
                        <Card variant="dark">
                            <h3 style={{ marginTop: 0 }}>Make a Comment</h3>
                            <label style={{ fontWeight: 'bold' }}>Message</label>

                            <textarea id="newComment" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', minHeight: '60px', boxSizing: 'border-box' }}></textarea>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Button onClick={() => addCommentButton(post.msgId)}>Send</Button>
                                <Button variant="secondary" onClick={cancelCommentButton}>Cancel</Button>
                            </div>
                        </Card>
                    </div>
                        
                    {/* comments */}
                    {post.commentdata && post.commentdata.length > 0 && (
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {post.commentdata?.map((comment,j)=>(
                                <div key={j} style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>{comment.comment}</label>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>By {comment.username}</p>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>{comment.upvote} Upvotes</p>
                                        {currentUserId && (
                                            <Button variant="secondary" onClick={()=> upvoteCommentButton(comment.commentId)}>⬆️</Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
                ))}
            </div>
        </div>
    );
}
export default Posts;