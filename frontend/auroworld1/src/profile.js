import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'
import Button from './components/Button';
import Card from './components/Card';

function Profile(){
    const navigate=useNavigate();
    //const supabase = createClient('your_project_url', 'your_supabase_api_key')
    const supabase = createClient('https://rduempiojxizkwwbzaml.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo')
    function mainpageButton(){
        navigate("/posts")
    }
    function coursesButton(){
        navigate("/courses")
    }
    async function getCurrentUserId(){
        const { data: { user } ,error} = await supabase.auth.getUser()
        if(error){
            console.log("problem grabbing uuid" +error.message)
            return
        }
        else if(user){
            return user.id
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

    async function signoutButton(){
        const { error } = await supabase.auth.signOut();
        if (!error) {
            navigate("/login")
        } else {
            console.error('Error signing out:', error.message);
        }
    }
    async function editProfile(){
        document.getElementById("editProf").style.display="block"
    }
    function cancelEditProfile(){
        console.log("hitting cancel edit profile button");
        document.getElementById("editProf").style.display="none";
    }
    async function saveEditProfile(){

    }
    function commentButton(){
        console.log("hitting comment button");
        document.getElementById("addComment").style.display="block";
    }
    async function addCommentButton(msg_id){
        // console.log("hitting add comment button:"+msg_id);
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
            //console.log("Comment data posted:",data)
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
        }catch(error){
            console.error(error.message)
        }
    }
    async function upvoteCommentButton(comment_id){
        //console.log("hitting comment upvote button for "+comment_id)
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
            //console.log("Comment upvoted: ",data);
            if(data.mStatus!=="ok"){
                return
            }
        }catch(error){
            console.error(error.message)
        }
    }
    function cancelCommentButton(){
        //console.log("hitting cancel comment button");
        document.getElementById("addComment").style.display="none";
    }
     function editPostButton(){
        //console.log("hitting edit post button");
        document.getElementById("editPost").style.display="block";
    }
    async function sendEditPostButton(msg_id){
        //console.log("hitting send edit post button ");
        //console.log("msg_id for editpost: "+msg_id)
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
            //console.log("Edit post response: ",data)
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
        //console.log("hitting cancel edit post button");
        document.getElementById("editPost").style.display="none";
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
            //adding file to bucket
            //const { data, error } = await supabase.storage.from('bucket_name').upload('file_path', file)
            //const {data} = await supabase.storage.from('community_feed_file_upload').upload('posts/'+msg_id+'/'+fileUpload.name, fileUpload)
            //console.log(data)

        }catch (error){
            console.error(error.message)
        }
    }

    const [fileUpload,setFileUpload]=useState()
    const [previewUrl, setPreviewUrl] = useState();
    const [fileName, setFileName] = useState("No file chosen");


    const [posts, setPosts] = useState([])

    useEffect(() => {
        async function gatherMyPosts(){
            const userId = await getCurrentUserId()
            console.log("userId is: "+userId)
            fetch(`http://localhost:8080/users/${userId}/messages`)
            .then(res => res.json())
            .then(data => {
                console.log("FULL RESPONSE:", data)
                console.log("Posts mData:", data.mData)
                setPosts(data.mData);
            })
            .catch(err => console.error("FETCH ERROR for getting posts:", err))
        }
        gatherMyPosts()
        
        async function loadImages(){

        }
    }, []);

    const [imageUrls, setImageUrls] = useState({});

    useEffect(() =>{
        async function loadImages(){
            if(!posts) return
            const newUrls={}

            // const user_uuid = await getCurrentUserId()
            // const allMyFiles = await fetch(`http://localhost:8080/files/mymessages/${user_uuid}`)
            // const allMyFileData = await allMyFiles.json()

            // if (allMyFileData.mStatus!=="ok"){
            //     return null
            // }
            //var i=0
            // console.log(allMyFileData.mData)
            //console.log("allMyFileData[0]: "+allMyFileData.mData[0].filepath)

            for (const post of posts) {
                try{
                    // console.log("allMyFileData[i].msgId: "+allMyFileData.mData[i].msgId)
                    // if (post.msgId === allMyFileData.mData[i].msgId){
                        //console.log("allMyFileData[i].filepath: ",allMyFileData.mData[i].filepath)
                        const { data} = supabase.storage
                            .from('community_feed_file_upload')
                            .getPublicUrl(
                                // allMyFileData.mData[i].filepath
                                post.filepath
                            );
                        console.log("data from community_feed: ",data)
                        if (data && data.publicUrl) {
                            console.log('Public URL:', data.publicUrl);
                        } else {
                            console.error('Error getting public URL or URL is undefined');
                        }
                        //console.log("data.public url =",data.publicUrl)
                        
                        newUrls[post.msgId] = data.publicUrl;
                        //i+=1
                    //}

                }catch(err){
                    console.error(err)
                    newUrls[post.msgId]=null
                }
            }
            setImageUrls(newUrls);
        }
        loadImages()
    },[posts])

    const [profileInfo, setProfileInfo] = useState(null);

    useEffect(() =>{
        async function fetchProfileInfo(){
            const userId= await getCurrentUserId()
            const profile_res = await fetch(`http://localhost:8080/profile/${userId}`)
            const prof = await profile_res.json()
            console.log(prof.mData)
            if (prof.mStatus!=="ok"){
                return
            }
            setProfileInfo(prof.mData)
        }
        fetchProfileInfo()
    },[]);

    const [profileImageUrl, setProfileImageUrl] = useState(null);
    useEffect(() =>{
        async function loadProfilePhoto(){
            try{
                console.log("retrieving photo for profile")
                const userId = getCurrentUserId()
                const { data} = supabase.storage
                    .from('profile_pics')
                    .getPublicUrl(
                        'profile/' +
                        userId +
                        '/' +
                        profilePicUpload.name
                    );
                console.log("data from profile_pics: ",data)
                if (data && data.publicUrl) {
                    console.log('Public URL:', data.publicUrl);
                    setProfileImageUrl(data.publicUrl)
                } else {
                    console.error('Error getting public URL or URL is undefined');
                    setProfileImageUrl(null)
                }
            } catch (err) {
                console.error(err);
                setProfileImageUrl(null)
            }
        }
        loadProfilePhoto()
        setProfileImageUrl(profileImageUrl)
    },)
    
    const [profilePicUpload,setProfilePicUpload]=useState()
    const [profilePreviewUrl, setProfilePreviewUrl] = useState();
    const [profilePicName, setProfilePicName] = useState("No file chosen");

    function uploadProfileImageHandler(e){
        const file = e.target.files[0];
        if (file) {
            setProfilePicUpload(file);
            setProfilePreviewUrl(URL.createObjectURL(file));
            setProfilePicName(file.name);
        }else {
            setProfilePicName("No file chosen"); 
        }
    }

    const [data, setData] = useState([]);
    //const [sortPreference, setSortPreference] = useState([])
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
            //setSortPreference(sorted)
            setData(sorted)
        }
        sortArray(sortType)
    }, [sortType])

    return(
        <div id="profile" style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <Button variant="secondary" onClick={signoutButton}>Sign Out</Button>
                <Button onClick={mainpageButton}>⌂ Mainpage</Button>
                <Button onClick={coursesButton}>🕮 Courses</Button>
                <Button onClick={editProfile}>✎ Edit Profile</Button>
            </div>
            <label style={{ fontWeight: 'bold', textAlign: 'center', display: 'block', fontSize: '40px' }}>
                Your Profile
            </label>

            <h1 style={{padding: '50px',marginLeft:'25%',display:'block',fontSize:'30px'}}>Profile Photo</h1>

            {profileImageUrl && (
                <img src={profileImageUrl} alt="Post attachment" style={{border: "5px solid #000000", padding: "3px"}}/>
            )}

            <div id="names" style={{fontSize:'30px',padding:'10px',marginLeft:'12%',display:'flex', gap:'200px',marginBotton:'20px'}}>
                <pre>Firstname:</pre>
                {profileInfo && (
                    <text id="firstname">{profileInfo.firstName} </text>
                )}
                <pre>Lastname:</pre>
                {profileInfo && (
                    <text id="lastname">{profileInfo.lastName}</text>
                )}
            </div>
            <hr></hr>
            <div id="username_and_email" style={{fontSize:'30px',padding:'20px',marginLeft:'11%',display:'flex',gap:'200px',marginBotton:'20px'}}>
                <pre>Username:</pre>
                {profileInfo && (
                    <text id="username">{profileInfo.userId}</text>
                )}
                <pre>Email:</pre>
                {profileInfo && (
                    <text id="email">{profileInfo.email}</text>
                )}
            </div>
            <hr></hr>
            <div id="note" style={{marginLeft:'11%',fontSize:'30px'}}>
                <pre>Note About Yourself:</pre>
                {profileInfo && (
                    <text id="text">
                    {profileInfo.note}
                    </text>
                )}
            </div>

            <div id="editProf" style={{display:"none", marginBottom: '20px'}}>
                {/*<Card>*/}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <input type="file" id="hiddenAddFileInput" onChange={uploadProfileImageHandler} style={{ display: 'none' }}></input>
                        <Button variant="secondary" onClick={() => document.getElementById("hiddenAddFileInput").click()}>Upload File</Button>
                        <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>{profilePicName}</span>
                    </div>

                    <img src={profilePreviewUrl} style={{ maxWidth: '100%', borderRadius: '8px' }}></img>
                    {profilePicUpload &&(
                        <div style={{ margin: '10px 0', fontSize: '14px', color: '#666' }}>
                            <p>Selected File: {profilePicUpload.name}</p>
                            <p>Size: {profilePicUpload.size} bytes</p>
                            <p>Type: {profilePicUpload.type}</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button onClick={saveEditProfile}>Save</Button>
                        <Button variant="secondary" onClick={cancelEditProfile}>Cancel</Button>
                    </div>
                {/*</Card>*/}
            </div>
            <label style={{ fontSize: '30px', color: '#000000', fontWeight: 'normal', padding:'20px' }} >All Your Posts: </label>
            <select onChange={(e) => setSortType(e.target.value)}>
                <option value="sortByNewest">Sort Posts By New</option>
                <option value="sortByUpvotes">Sort Posts By Upvotes</option>
            </select>
            <div id="messageList" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {data?.map((post, i) => (
                
                <Card key={i}>
                    <div style={{ color: '#888', fontSize: '12px' }}>{post.msg_id}</div>

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
                    <button onClick={()=>upvoteButton(post.msgId)}>⬆️</button>

                    {currentUserId && post.uuid === currentUserId && (
                        <button onClick={() => editPostButton(post.msgId)}>Edit</button>
                    )}
                    <button onClick={()=>commentButton}>Comment</button>

                    <div id="editPost" style={{display:"none", marginTop: '15px'}}>
                        <Card variant="dark">
                            <h3 style={{ marginTop: 0 }}>Edit Entry</h3>
                            <label style={{ fontWeight: 'bold' }}>Title</label>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <input type="file" id={`hiddenEditFileInput-${post.msgId}`} onChange={uploadImageHandler} style={{ display: 'none' }}></input>
                                <Button variant="secondary" onClick={() => document.getElementById(`hiddenEditFileInput-${post.msgId}`).click()}>Upload File</Button>
                                <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>{fileName}</span>
                            </div>

                            <img src={previewUrl} style={{ maxWidth: '100%', borderRadius: '8px' }}></img>
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
                    {post.commentdata && (post.commentdata.length > 0) && (
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {post.commentdata?.map((comment,j)=>(
                                <div key={j} style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>{comment.comment}</label>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>By {comment.username}</p>
                                    
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
    )
}
export default Profile;