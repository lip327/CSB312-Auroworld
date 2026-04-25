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
            //console.log("problem grabbing uuid" +error.message)
            return
        }
        else if(user){
            //console.log("current user's unique id: "+user.id)
            return user.id
        }
    }
    async function getUsername(uuid){
        try{
            const usernameResponse = await fetch(`http://localhost:8080/username/${uuid}`)
            const usernameData = await usernameResponse.json()
            if (usernameData.mStatus!=="ok"){
                alert("Problem grabbing username")
            }
            return usernameData.mData
        }catch(error){
            console.log(error.message)
        }
        return
    }

    function mainpageButton(){
        navigate("/posts")
    }
    function coursesButton(){
        navigate("/courses")
    }
    function adminButton(){
        navigate("/admin")
    }
    // function signinButton(){
    //     navigate("/login")
    // }
    async function signoutButton(){
        const { error } = await supabase.auth.signOut();
        if (!error) {
            //console.log('User signed out successfully and session cleared.');
            navigate("/login")
        } else {
            console.error('Error signing out:', error.message);
        }
    }
    async function postButton(){
        //console.log("hitting post button");
        document.getElementById("addPost").style.display="block";
    }
    async function addPostButton(){
        //console.log("hitting add post button");
        try{
            const current_uuid = await getCurrentUserId()
            const username = await getUsername(current_uuid)
            console.log("username: "+username)
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
                alert("Message Post failed some fields are empty");
                return;
            }
            console.log("addPost new message Id= "+data.mData.msgId)
            if(fileUpload) {
                addFileToTable(data.mData.msgId)
            }
            testDomButton(
                document.getElementById("newTitle").value, document.getElementById("newPost").value,
                0, username, data.mData.msgId, []
            )
        } catch(error){
            console.error(error.message)
        }
        cancelPostButton();
    }
    function testDomButton(title, message, upvote, username, msg_id,comments){
        const newPost=[
            {msgId:msg_id,
            subject:title,
            message: message,
            upvote: upvote,
            username: username,
            commentdata: comments,}
        ]
        setPosts((prevPosts)=>{
            return [...prevPosts,...newPost]
        })
    }
    function cancelPostButton(){
        //console.log("hitting cancel post button");
        document.getElementById("addPost").style.display="none";
    }

    async function addFileToTable(msg_id){
        try{
            //console.log("addFileToTable msgId: "+msg_id)
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
            //console.log("File Post response: ",fileData)
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
    function editCommentButton(com_id){
        document.getElementById(`editComment-${com_id}`).style.display="block"
    }
    async function sendEditCommentButton(msg_id,com_id){
        try{
            const comBody={
                comment:document.getElementById(`editCommentText-${com_id}`).value,
            }
            const response = await fetch(`http://localhost:8080/put/comment/${com_id}`,{
                method:"PUT",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify(comBody)
            })
            const editCommentData = await response.json()
            if(editCommentData.mStatus!=="ok"){
                alert("Editing comment failed. Try again later")
                return
            }
            editCommentDom(msg_id,com_id,document.getElementById(`editCommentText-${com_id}`).value)
            cancelEditCommentButton(com_id)
            return
        }catch(error){
            console.log(error.message)
        }
        return
    }
    function editCommentDom(msgId, comId, text){
        const updatedPosts = posts.map((post)=>{
            if(post.msgId===msgId){
                const editedComment=post.commentdata.map((c)=>{
                    if(c.commentId===comId){
                        return{
                            ...c,
                            comment:text
                        }
                    }
                    return c
                })
                return{
                    ...post,
                    commentdata:editedComment
                }
            }
            return post
        })
        setPosts(updatedPosts)
    }
    function cancelEditCommentButton(com_id){
        document.getElementById(`editComment-${com_id}`).style.display="none"
    }

    function editPostButton(msg_id){
        //console.log("hitting edit post button");
        document.getElementById(`editPost-${msg_id}`).style.display="block";
    }
    async function sendEditPostButton(msg_id){
        // console.log("hitting send edit post button ");
        // console.log("msg_id for editpost: "+msg_id)
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
            //console.log("Edit post response: ",data)
            if (data.mStatus!=="ok"){ 
                alert("Edit post failed: "+data.mMessage);
                return
            }
            if(fileUpload){
                editFileInTable(msg_id)
            }
            editDomButton(msg_id,document.getElementById(`editTitle-${msg_id}`).value,document.getElementById(`editMessage-${msg_id}`).value)
        }catch(error){
            console.error(error.message)
        }
        cancelEditPostButton(msg_id);
    }
    function editDomButton(msgId,sub,msg){
        const updatedPost=posts.map((post)=>{
            if(post.msgId===msgId){
                return{
                    ...post,
                    subject:sub,
                    message:msg,
                }
            }
            return post
        })
        setPosts(updatedPost)
    }
    function cancelEditPostButton(msg_id){
        //console.log("hitting cancel edit post button");
        document.getElementById(`editPost-${msg_id}`).style.display="none";
    }
    async function editFileInTable(msg_id){
        try{

            //console.log("editFileInTable msgId: "+msg_id)
            const editFileBody={
                filename:fileUpload.name
            }
            const response=await fetch(`http://localhost:8080/files/${msg_id}`,{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify(editFileBody)
            });
            const fileData = await response.json()
            //console.log("File Post response: ",fileData)
            if (fileData.mStatus!=="ok"){
                alert("File Post failed: "+fileData.mMessage)
                return
            }
        }catch (error){
            console.error(error.message)
        }
    }
    function commentButton(msg_id){
        //console.log("hitting comment button");
        const p = posts.find((item) => item.msgId === msg_id);
        
        //console.log("p: "+p.msgId)
        if(p.commentdata && p.commentdata.length>0 && document.getElementById(`commentList-${msg_id}`).style.display==="none"){
            document.getElementById(`commentList-${msg_id}`).style.display="block"
        }
        else if(p.commentdata && p.commentdata.length>0 && document.getElementById(`commentList-${msg_id}`).style.display==="block"){
            document.getElementById(`commentList-${msg_id}`).style.display="none"
        }
        if( document.getElementById(`addComment-${msg_id}`).style.display==="none"){
            document.getElementById(`addComment-${msg_id}`).style.display="block";
        }
        else if( document.getElementById(`addComment-${msg_id}`).style.display==="block"){
            document.getElementById(`addComment-${msg_id}`).style.display="none";
        }
        return
    }
    async function addCommentButton(msg_id){
        //console.log("hitting add comment button:"+msg_id);
        try{
            const current_uuid = await getCurrentUserId()
            const username = await getUsername(current_uuid)
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
            //console.log("Comment data posted:",data)
            if(data.mStatus!=="ok"){
                alert("Comment failed: "+data.mMessage)
                return
            }
            //console.log("data.mData: "+data.mData)
            commentDomButton(document.getElementById(`newComment-${msg_id}`).value,msg_id,data.mData,username,current_uuid)
        }catch(error){
            console.error(error.message)
        }
        // cancelCommentButton(msg_id)
    }
    function commentDomButton(comment_text, msg_id,c_id,username,uuid){
        const updatedPosts = posts.map((post)=>{
            if (post.msgId===msg_id){
                return {
                    ...post,
                    commentdata:[...post.commentdata, {
                        comment:comment_text,
                        commentId:c_id,
                        username:username,
                        upvote:0,
                        uuid:uuid
                    }]
                }
            }
            return post
        })
        // setPosts((newPosts)=>{
        //     return [...newPosts]
        // })
        setPosts(updatedPosts)
    }
    async function upvoteButton(msg_id){
        //console.log("hitting upvote button for "+msg_id)
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
            //console.log("Post upvoted: ",data);
            if(data.mStatus!=="ok"){
                return
            }
            //console.log("data.mData: "+data.mData)
            if(data.mData===0){
                messageUpvoteDom(msg_id,-1)
            }
            else{
                messageUpvoteDom(msg_id,1)
            }

        }catch(error){
            console.error(error.message)
        }
    }
    function messageUpvoteDom(msg_id,change){
        //console.log("messageUpvoteDom msg_id: "+msg_id)
        const newPosts = posts.map((post)=>{
            if (post.msgId===msg_id){
                return {
                    ...post,
                    upvote:post.upvote+change,
                }
            }
            else{
                return post
            }
        })
        // setPosts((newPosts)=>{
        //     return [...newPosts]
        // })
        setPosts(newPosts)

        // const p = likedPosts.find((item) => item.msgId === msg_id);
        const num = likedPosts.find((item) => item===msg_id);
        if(num===msg_id){
            console.log("messageUpvoteDom num: "+num)
            setLikedPosts(
                likedPosts.filter(p=>
                    p!==msg_id
                )
            )
            return
        }
        else{
            setLikedPosts((prevPosts)=>{
                return [...prevPosts,msg_id]
            })
        }
    }
    async function upvoteCommentButton(comment_id, msg_id){
        //console.log("hitting comment upvote button for "+comment_id)
        try{
            const current_uuid = await getCurrentUserId()
            const stuff ={
                user_uuid:current_uuid,
            }
            const res=await fetch(`http://localhost:8080/vote_comments/comment/${comment_id}/msg/${msg_id}`,{
                method:"PUT",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify(stuff)
            })
            const data = await res.json()
            //console.log("Comment upvoted: ",data);
            if(data.mStatus!=="ok"){
                alert("Upvoting comment failed. Try again later")
                return
            }
            console.log("comment data.mData: "+data.mData)
            if(data.mData===0){
                commentUpvoteDom(msg_id,comment_id,-1)
            }
            else{
                commentUpvoteDom(msg_id,comment_id,1)
            }

        }catch(error){
            console.error(error.message)
        }
    }
    function commentUpvoteDom(msg_id,com_id,change){
        const updatedPosts = posts.map((post)=>{
            if (post.msgId===msg_id){
                const upvotedComment=post.commentdata.map((c)=>{
                    if(c.commentId===com_id){
                        //console.log(c)
                        return{
                            ...c,
                            upvote:c.upvote+change,
                        }
                    }
                    return c
                })
                return {
                    ...post,
                    commentdata:upvotedComment
                }
            }
            return post
        })
        // setPosts((newPosts)=>{
        //     return [...newPosts]
        // })
        setPosts(updatedPosts)
        const num = likedComments.find((item) => item===com_id);
        if(num===com_id){
            console.log("commentUpvoteDom num: "+num)
            setLikedComments(
                likedComments.filter(com=>
                    com!==com_id
                )
            )
            return
        }
        else{
            setLikedComments((prevComments)=>{
                return [...prevComments,com_id]
            })
        }
    }
    function cancelCommentButton(msg_id){
        document.getElementById(`commentList-${msg_id}`).style.display="none"
        //console.log("hitting cancel comment button");
        document.getElementById(`addComment-${msg_id}`).style.display="none";
    }

    async function downloadFile(msg_id){
        const downloadFilename = imageUrls[msg_id].split('/').pop()
        //console.log(downloadFilename)

        const { data, error } = await supabase
            .storage
            .from('community_feed_file_upload')
            .download('posts/'+msg_id+'/'+downloadFilename)
        if(error){
            console.log("downloadFile: "+error)
            alert("Problem downloading file, try again later")
            return
        }
        else if(data){
            //console.log(data)
            const url = URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.download = downloadFilename;
            link.click();
            return
        }
    }
    async function deleteCommentButton(msgId,commentId){
        try{
            const deleteCommentResponse = await fetch(`http://localhost:8080/delete/comment/${commentId}`,{
                method:"DELETE",
                headers:{"Content-Type": "application/json"},
            })
            const deleteCommentData = await deleteCommentResponse.json()
            console.log(deleteCommentData.mData)
            if(deleteCommentData.mStatus!=="ok"){
                alert("Deleting comment failed. Try again later")
                return
            }
            alert("Comment deleted")
            deleteCommentDom(msgId,commentId)
        }catch(error){
            console.log(error.message)
            return
        }
    }
    function deleteCommentDom(msgId,commentId){
    //const result = questionFilter.map(item => 
    //     item.questions.filter(qitem => qitem.question.includes('Question 1'))
    // )
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.msgId === msgId) {
                    return {
                        ...post,
                        commentdata: post.commentdata.filter(
                            cItem => cItem.commentId !== commentId
                        )
                    }
                }
                return post;
            })
        )
    }

    async function deletePostButton(msgId, uuid){
        console.log(msgId)
        try{
            const deleteBody={
                userUuid:uuid,
            }
            const deleteMessageResponse = await fetch(`http://localhost:8080/delete/message/${msgId}`,{
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(deleteBody)
            })
            const deleteMessageData = await deleteMessageResponse.json()
            //console.log(deleteMessageData.mData)
            if (deleteMessageData.mStatus!=="ok"){
                console.log(deleteMessageData.mMessage)
                alert("Deleting post failed")
                return
            }
            else if(deleteMessageData.mData!==null){
                console.log("file to delete")
                const { data, error } = await supabase
                    .storage
                    .from('community_feed_file_upload')
                    .remove([deleteMessageData.mData])
                if(data){
                    console.log(data)
                }
                else if (error){
                    console.log(error.message)
                }
            }
            testDeleteDom(msgId)
            alert("Post deleted")
            return
        }catch(error){
            console.log(error.message)
            return
        }
    }
    function testDeleteDom(msg_id){
        setPosts(
            posts.filter(p=>
                p.msgId!==msg_id
            )
        )
    }
    const [likedPosts,setLikedPosts]=useState([])
    useEffect(()=>{
        async function getLikedPosts(){
            const userId = await getCurrentUserId()
            fetch(`http://localhost:8080/likedmessages/${userId}`)
            .then(res=>res.json())
            .then(data=>{
                console.log("likedPosts data: "+data.mData)
                setLikedPosts(data.mData)
            })
            .catch(err=>console.error("fetch error for liked posts: ",err))
        }
        getLikedPosts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])

    const [likedComments,setLikedComments]=useState([])
    useEffect(()=>{
        async function getLikedComments(){
            const userId = await getCurrentUserId()
            fetch(`http://localhost:8080/likedcomments/${userId}`)
            .then(res=>res.json())
            .then(data=>{
                console.log("likedPosts data: "+data.mData)
                setLikedComments(data.mData)
            })
            .catch(err=>console.error("fetch error for liked posts: ",err))
        }
        getLikedComments()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])
    useEffect(() => {
        console.log("likedComments:", likedComments);
    }, [likedComments]);
    
    const [posts, setPosts] = useState([])

    useEffect(() => {
        async function gatherMyPosts(){
            const userId = await getCurrentUserId()
            console.log("userId is: "+userId)
            fetch(`http://localhost:8080/messages`)
            .then(res => res.json())
            .then(data => {
                // console.log("FULL RESPONSE:", data)
                // console.log("Posts mData:", data.mData)
                setPosts(data.mData);
            })
            .catch(err => console.error("FETCH ERROR for getting posts:", err))
            
        }
        gatherMyPosts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    useEffect(()=>{
        // console.log("psots updated", posts)
    },[posts])

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
                    //console.log("data from community_feed: ",data)
                    if (data && data.publicUrl) {
                        //console.log('Public URL:', data.publicUrl);
                    } else {
                        console.error('Error getting public URL or URL is undefined');
                    }
                    
                    newUrls[post.msgId] = data.publicUrl;

                }catch(error){
                    console.log(error.message)
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
            //console.log(sorted)
            setData(sorted)
        }
        sortArray(sortType)
    }, [sortType, posts])

    const[postUsernameQuery,setPostUsernameQuery] = useState("")

    // for(const post of posts){
    //     if(post.commentdata.length!==0){
    //         console.log("post"+post.msgId+": "+post.commentdata)
    //     }
    // }

    // console.log("usestate currentuserid: "+currentUserId)
   
    return(
        <div style={{ display: 'flex', height: '100vh', width: '100vw', margin: '0', overflow: 'hidden', backgroundColor: '#E3C7E6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontSize: '16px', color: '#111' }}>
            
            <Sidebar 
                onMainpage={mainpageButton} 
                onCourses={coursesButton}
                onSignout={signoutButton} 
                onAdmin={adminButton}
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
                            {data.filter((post)=>post.username?.toLowerCase().includes(postUsernameQuery))?.map((post) => (
                            
                            <div key={post.msgId} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

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
                                        <button onClick={() => editPostButton(post.msgId)} style={{ float:"right",marginLeft: 'auto', background: 'none', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', color: '#555' }}>
                                            Edit <i className="fas fa-edit"></i>
                                        </button>
                                    )}
                                    {currentUserId && post.uuid === currentUserId && (
                                        <button onClick={() => deletePostButton(post.msgId,currentUserId)} style={{float:"right", background: 'none', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', color: '#555' }}>
                                            Delete <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                    )}
                                </div>

                                {/* Post content */}
                                <div style={{ fontSize: '25px', fontWeight: '700', marginBottom: '8px', color: '#111' }}>{post.subject}</div>
                                <div style={{ fontSize: '20px', color: '#333', lineHeight: '1.5', marginBottom: '14px' }}>{post.message}</div>

                                {imageUrls[post.msgId] && (
                                    <img src={imageUrls[post.msgId]} alt="Post attachment" style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '14px' }} />
                                )}
                                
                                <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{post.upvote} Upvotes</p>
                                
                                {imageUrls[post.msgId]&& (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                        <Button variant="secondary" onClick={()=> downloadFile(post.msgId)}>
                                            Download <i className="fa-solid fa-download"></i>
                                        </Button>
                                    </div>
                                )}
                                
                                {/* button */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                                    {likedPosts.find((item) => item===post.msgId) && (
                                        <button onClick={() => upvoteButton(post.msgId)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '40px', color: '#555', fontWeight: '600' }}>
                                            <i className="fa-solid fa-thumbs-up" style={{color:" rgb(177, 151, 252)"}}></i>
                                        </button>
                                    )}
                                    {!(likedPosts.find((item) => item===post.msgId)) && (
                                        <button onClick={() => upvoteButton(post.msgId)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '40px', color: '#555', fontWeight: '600' }}>
                                           <i className="fa-regular fa-thumbs-up"></i>
                                        </button>
                                    )}
                                    {/* <button onClick={() => upvoteButton(post.msgId)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#555', fontWeight: '600' }}>
                                        ⬆️ {post.upvote}
                                    </button> */}
                                    <button onClick={() => commentButton(post.msgId)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '35px', color: '#555', fontWeight: '600' }}>
                                        💬 Comment
                                    </button>
                                </div>

                                <div id={`editPost-${post.msgId}`} style={{display:"none", marginTop: '15px'}}>
                                    <Card variant="dark">
                                        <h3 style={{ marginTop: 0 }}>Edit Entry</h3>
                                        <label style={{ fontWeight: 'bold' }}>Title</label>
                                        
                                        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <input type="file" id={`hiddenEditFileInput-${post.msgId}`} onChange={uploadImageHandler} style={{ display: 'none' }}></input>
                                            <Button variant="secondary" onClick={() => document.getElementById(`hiddenEditFileInput-${post.msgId}`).click()}>Upload File</Button>
                                            <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>{fileName}</span>
                                        </div> */}

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
                                    <div id = {`commentList-${post.msgId}`} style={{display:"none"}} >
                                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {/* {(post.commentdata)?.reverse().map((comment)=>( */}
                                            {[...post.commentdata]?.reverse().map((comment)=>(
                                                <div key={comment.commentId} style={{ backgroundColor: '#f7f7f7', padding: '12px 14px', borderRadius: '10px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#43B89C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#fff' }}>
                                                            {comment.username?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <span style={{ fontSize: '20px', fontWeight: '700', color: '#333' }}>{comment.username}</span>
                                                    </div>
                                                    <div style={{ fontSize: '25px', color: '#333', marginBottom: '8px' }}>{comment.comment}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {likedComments.find((item) => item===comment.commentId) && (
                                                            <button onClick={() => upvoteCommentButton(comment.commentId,post.msgId)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '30px', color: '#555', fontWeight: '600' }}>
                                                                <i className="fa-solid fa-thumbs-up" style={{color:" rgb(177, 151, 252)"}}></i>
                                                            </button>
                                                        )}
                                                        {!(likedComments.find((item) => item===comment.commentId)) && (
                                                            <button onClick={() => upvoteCommentButton(comment.commentId,post.msgId)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '30px', color: '#555', fontWeight: '600' }}>
                                                                <i className="fa-regular fa-thumbs-up"></i>
                                                            </button>
                                                        )}
                                                        {/* <button onClick={() => upvoteCommentButton(comment.commentId,post.msgId)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#555', fontWeight: '600' }}>
                                                            ⬆️ {comment.upvote}
                                                        </button> */}
                                                        {currentUserId && comment.uuid=== currentUserId && (
                                                            <button onClick={()=>editCommentButton(comment.commentId)}>
                                                                Edit <i className="fas fa-edit"></i>
                                                            </button>
                                                        )}
                                                        {currentUserId && comment.uuid === currentUserId && (
                                                            <button onClick={()=>deleteCommentButton(post.msgId, comment.commentId)}>
                                                                Delete <i className="fa-solid fa-trash-can"></i>
                                                            </button>
                                                        )}
                                                        <div id={`editComment-${comment.commentId}`} style={{display:"none", marginTop: '15px'}}>
                                                            <Card variant="dark">
                                                                <h3 style={{ marginTop: 0 }}>Edit Comment</h3>
                                                                <label style={{ fontWeight: 'bold' }}>Message</label>
                                                                
                                                                {/* <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                                    <input type="file" id={`hiddenEditFileInput-${post.msgId}`} onChange={uploadImageHandler} style={{ display: 'none' }}></input>
                                                                    <Button variant="secondary" onClick={() => document.getElementById(`hiddenEditFileInput-${post.msgId}`).click()}>Upload File</Button>
                                                                    <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>{fileName}</span>
                                                                </div> */}

                                                                <textarea id={`editCommentText-${comment.commentId}`} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', minHeight: '80px', boxSizing: 'border-box' }}></textarea>
                                                                
                                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                                    <Button onClick={() => sendEditCommentButton(post.msgId,comment.commentId)}>Send</Button>
                                                                    <Button variant="secondary" onClick={() => cancelEditCommentButton(comment.commentId)}>Cancel</Button>
                                                                </div>
                                                            </Card>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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