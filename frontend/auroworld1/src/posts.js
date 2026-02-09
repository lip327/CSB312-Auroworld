import { useNavigate } from "react-router-dom";
function Posts(){
    const navigate=useNavigate();
    function mainpageButton(){
        navigate("/posts")
    }
    function coursesButton(){
        navigate("/courses")
    }
    function signoutButton(){
        navigate("/")
    }
    return(
        <div id="homepage">
            {/* <button id="mainpage">Mainpage</button>
            <button id="courses">Courses</button>
            <button id="messages">Messages</button> */}
            <button onClick={mainpageButton}>Mainpage</button>
            <button onClick={coursesButton}>Courses</button>
            <button onClick={signoutButton}>Sign Out</button>
                        
            <button id="postBtn">Post</button>

            <div id="addElement" style={{display:"none"}}>
                <h3>Add a New Entry</h3>
                <label>Title</label>
                <input type="text" id="newTitle" />

                    <label>Posts</label>
                    <textarea id="newPost"></textarea>

                    <button id="addButton">Add</button>
                    <button id="addCancel">Cancel</button>
            </div>

            <div id="showElements">
                    <h3>Feed</h3>
                    <div id="messageList"></div>
            </div>

        </div>

    );
}
export default Posts;