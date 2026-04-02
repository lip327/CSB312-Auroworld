import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin,googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { createClient } from '@supabase/supabase-js'
import Button from './components/Button';
import Card from './components/Card';
import { corsHeaders } from "@supabase/supabase-js/cors";
// import 'csb312-auroworld\backend\src\main\java\auroworld\backend\Appmain.js'

function Login(){
    const navigate = useNavigate();
    const supabase = createClient('https://rduempiojxizkwwbzaml.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo')

    function handleLogout(){
        googleLogout()
    }
    function signup(){
        navigate("/signup")
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
    async function googleLoginButton(credentialResponse) {
        try{
            const creds=credentialResponse.credential
            const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: creds,
            })
            console.log(error, data)

            const googleAccountInfo = jwtDecode(creds)
            const checkEmail = await fetch(`http://localhost:8080/user_email/${googleAccountInfo.email}`)
            const checkEmailRes = await checkEmail.json()

            if(checkEmailRes.mData!==true){
                const { data: { user } ,error} = await supabase.auth.getUser()
                if(error){
                    console.log("problem grabbing uuid" +error.message)
                    return
                }

                var userInput=null

                while (true){
                    userInput= window.prompt("Please enter a username:");

                    const hasSpace = /\s/.test(userInput);

                    if(hasSpace!==false){
                        window.alert("Usernames may not contain spaces. Please pick another")
                    }
                    else if(userInput===null){
                        window.alert("Cannot enter an empty username. Try again")
                    }
                    else if(userInput.length<5 || userInput.length>15){
                        window.alert("Usernames must be between 5 and 15 characters inclusive. Please pick another")
                    }
                    else{
                        const user_res =await fetch(`http://localhost:8080/user_username/${userInput}`)
                        const user_data = await user_res.json();

                        if(user_data.mData!==false){
                            window.alert("Username is taken. Please pick another")
                        }
                        else{
                            break
                        }
                    }
                }

                const accountInfo={
                    username:userInput,
                    email:googleAccountInfo.email,
                    user_uuid:user.id,
                    lastname:googleAccountInfo.family_name,
                    firstname:googleAccountInfo.given_name
                }

                console.log("accountInfo: ",accountInfo)

                const response = await fetch("http://localhost:8080/auth/newuser", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(accountInfo)
                });

                const data = await response.json();
                console.log("Signup response:",data)

                if(data.mStatus!=="ok"){
                    alert("Signup failed: "+data.mMessage);
                    return;
                }
            }

        } catch(error){
            console.error(error.message)
        }
        navigate("/posts");
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