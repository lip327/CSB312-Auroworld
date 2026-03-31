//import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
//import { GoogleLogin,googleLogout } from "@react-oauth/google";
import { GoogleLogin} from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { createClient } from '@supabase/supabase-js'
import Button from './components/Button';
import Card from './components/Card';
// import 'csb312-auroworld\backend\src\main\java\auroworld\backend\Appmain.js'

function Login(){
    const navigate = useNavigate();
    const supabase = createClient('https://rduempiojxizkwwbzaml.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo')

    // function handleLogout(){
    //     googleLogout()
    // }
    function signup(){
        navigate("/signup")
    }

    async function googleLoginButton(credentialResponse) {
        const idToken=credentialResponse.credential
        try{
            const response = await fetch(" https://auroworld.onrender.com/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken })
            });
            const data = await response.json();
            console.log("Login response:",data)
            if(data.mStatus!=="ok"){
                alert("Login failed: "+data.mMessage);
                return;
            }

        } catch(error){
            console.error(error.message)
        }
        navigate("/posts");
    }
    async function userpassLoginButton(){
        var email=document.getElementById("email").value
        var pass = document.getElementById("password").value
        if (!(email && pass)){
            alert("Email and Password fields must not be empty.")
            return null
        }
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: pass,
        });
        if(error){
            console.log(error.message)
            if (error.message==="Invalid login credentials"){
                alert("Wrong email/password. Try again")
            }
            return null
        }
        console.log(data)
        navigate("/posts")

    }
    return(
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <Card style={{ width: '100%', maxWidth: '400px' }}>
                <GoogleLogin onSuccess={(credentialResponse)=>{
                    console.log(credentialResponse)
                    console.log(jwtDecode(credentialResponse.credential))
                    googleLoginButton(credentialResponse)
                }} onError={()=>console.log("Login Failed")}></GoogleLogin>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '15px' }}>
                    <label>Email</label>
                    <input type="text" id="email" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                    <label>Password</label>
                    <input type="text" id="password" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <Button onClick={userpassLoginButton}>Login</Button>
                    <Button variant="secondary" onClick={signup}>Sign Up</Button>
                </div>
            </Card>
        </div>
    );
}
export default Login;