import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'

function Posts(){
    const navigate=useNavigate();
    //const supabase = createClient('your_project_url', 'your_supabase_api_key')
    const supabase = createClient('https://rduempiojxizkwwbzaml.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo')

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
        document.getElementById("addPost").style.display="block";
    }
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
            console.log("addPost new message Id= "+data.mData.msgId)
            addFileToTable(data.mData.msgId)
            
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
            //adding to file table
            //const { authData: userData } = await supabase.auth.getUser()
            //const userId = userData.user.id

            console.log("addFileToTable msgId: "+msg_id)
            const fileBody={
                filename:fileUpload.name,
                msgId:msg_id,
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
            const {data} = await supabase.storage.from('community_feed_file_upload').upload('posts/'+msg_id+'/'+fileUpload.name, fileUpload)
            console.log(data)

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
        }catch(error){
            console.error(error.message)
        }
       cancelEditPostButton();
    }
    function cancelEditPostButton(){
        console.log("hitting cancel edit post button");
        document.getElementById("editPOst").style.display="none";
    }

    function commentButton(){
        console.log("hitting comment button");
        document.getElementById("addComment").style.display="block";
    }
    async function addCommentButton(msg_id){
        console.log("hitting add comment button:"+msg_id);
        try{
            const commBody={
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
            const res = await fetch(`http://localhost:8080/vote_messages/${msg_id}`,{
                method:"PUT",
                headers:{"Content-Type":"application/json"},
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
            const res=await fetch(`http://localhost:8080/vote_comments/${comment_id}`,{
                method:"PUT",
                headers:{"Content-Type":"application/json"},
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
    const [commentsByPost,setCommentsByPost]=useState([])

    const [fileUpload,setFileUpload]=useState()
    const [previewUrl, setPreviewUrl] = useState();

    function uploadImageHandler(e){
        const file = e.target.files[0];
        if (file) {
            setFileUpload(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    }

    // async function displayImage(msg_id){
    //     console.log('retriveing image for a post')
    //     try{


    //         const { data } = supabase.storage
    //         .from('community_feed_file_upload')
    //         .getPublicUrl('posts/'+msg_id+'/'+file_name);
    //         console.log(data.publicUrl);
    //         return data.publicUrl

    //     } catch(error){
    //         console.error(error.message)
    //     }
    // }

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
            <div id="addPost" style={{display:"none"}}>
                <h3>Add a New Entry</h3>
                <label>Title</label>

                <input type="file" onChange={uploadImageHandler}></input>

                <img src={previewUrl} ></img>
                {fileUpload &&(
                    <div>
                        <p>Selected File: {fileUpload.name}</p>
                        <p>Size: {fileUpload.size} bytes</p>
                        <p>Type: {fileUpload.type}</p>
                    </div>
                )}

                <input type="text" id="newTitle" />
                <textarea id="newPost"></textarea>
                
                <button onClick={addPostButton}>Send</button>
                <button onClick={cancelPostButton}>Cancel</button>
            </div>
            <div id="messageList">
                {posts?.map((post, i) => (
                <div key={i}>{post.msg_id}

                    {/* <img src={displayImage(post.msg_id)}></img> */}

                    <h2>{post.subject}</h2>
                    <label>{post.message}</label>
                    <p>By {post.username}</p>
                    
                    <p>{post.upvote} Upvotes</p>

                    <button onClick={()=> editPostButton(post.msg_id)}>Edit</button>
                    <div id="editPost" style={{display:"none"}}>
                        <h3>Edit Entry</h3>
                        <label>Title</label>
                        <input type="file" onChange={uploadImageHandler}></input>

                        <img src={fileUpload} ></img>

                        <input type="text" id="editTitle" />
                        <textarea id="editMessage"></textarea>
                        
                        <button onClick={sendEditPostButton}>Send</button>
                        <button onClick={cancelEditPostButton}>Cancel</button>

                    </div>

                    <button onClick={()=> upvoteButton(post.msgId)}>⬆️</button>

                    <button onClick={commentButton}>Comment</button>

                    <div id="addComment" style={{display:"none"}}>
                        <h3>Make a Comment</h3>
                        <label>Message</label>

                        <textarea id="newComment"></textarea>

                        <button onClick={() => addCommentButton(post.msgId)}>Send</button>
                        <button onClick={cancelCommentButton}>Cancel</button>
                    </div>
                        {(commentsByPost[post.msgId])?.map((comment,j)=>(
                            <div key = {j}>
                                <label>{comment.comment}</label>
                                <p>By {comment.userId}</p>
                                <p>{comment.upvote} Upvotes</p>
                                <button onClick={()=> upvoteCommentButton(comment.commentId)}>⬆️</button>
                            </div>
                        ))}
                </div>
                ))}
            </div>
        </div>

    );
}
export default Posts;