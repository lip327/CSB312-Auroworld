import { useNavigate } from "react-router-dom";
function Courses(){
    const navigate=useNavigate();
    function mainpageButton(){
        navigate("/posts")
    }
    function coursesButton(){
        navigate("/courses")
    }
    function signoutButton(){
        navigate("/login")
    }
    return(
        <div id="courses_page">
            {/* <button id="mainpage">Mainpage</button>
            <button id="courses">Courses</button>
            <button id="messages">Messages</button> */}
            <button onClick={mainpageButton}>Mainpage</button>
            <button onClick={coursesButton}>Courses</button>
            <button onClick={signoutButton}>Sign Out</button>
            <h1>Courses</h1>
            {/* <button onClick={messagesButton}>Messages</button> */}
        </div>
    );
}

export default Courses;