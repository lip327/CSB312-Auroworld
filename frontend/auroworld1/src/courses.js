import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react"; 
import { createClient } from '@supabase/supabase-js'; 
import Card from './components/Card';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function Courses(){
    const navigate = useNavigate();
    
    const supabase = createClient('https://rduempiojxizkwwbzaml.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo');
    
    const [currentUserName, setCurrentUserName] = useState("Loading...");

    useEffect(() => {
        async function fetchUserData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                try {
                    const { data: profileData } = await supabase
                        .from('users') 
                        .select('firstname, lastname')
                        .eq('email', user.email)
                        .single();

                    if (profileData) {
                        setCurrentUserName(`${profileData.firstname} ${profileData.lastname}`);
                    } else {
                        setCurrentUserName(user.email?.split('@')[0] || "User");
                    }
                } catch (err) {
                    setCurrentUserName(user.email?.split('@')[0] || "User");
                }
            } else {
                setCurrentUserName("Guest");
            }
        }
        fetchUserData();
    }, []);

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
        <div style={{ display: 'flex', height: '100vh', width: '100vw', margin: '0', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
            
            <Sidebar 
                onMainpage={mainpageButton} 
                onCourses={coursesButton} 
                onSignout={signoutButton} 
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header username={currentUserName} />
                <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', justifyContent: 'center' }}>
                    

                    <div style={{ width: '100%', maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <Card>
                            <h1 style={{ marginTop: 0 }}>Courses</h1>
                        </Card>
                        
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Courses;