import { useNavigate } from "react-router-dom";
import Button from './components/Button';
import Card from './components/Card';

function Courses(){
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
        <div id="courses_page" style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <Button onClick={mainpageButton}>Mainpage</Button>
                <Button onClick={coursesButton}>Courses</Button>
                <Button variant="secondary" onClick={signoutButton}>Sign Out</Button>
            </div>
            
            <Card>
                <h1 style={{ marginTop: 0 }}>Courses</h1>
            </Card>
            
        </div>
    );
}

export default Courses;