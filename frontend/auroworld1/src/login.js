import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin,googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
// import 'csb312-auroworld\backend\src\main\java\auroworld\backend\Appmain.js'

function Login(){
    const navigate = useNavigate();

    function handleLogout(){
        googleLogout()
    }
    function signup(){
        navigate("/signup")
    }

    async function googleLoginButton(credentialResponse) {
        const idToken=credentialResponse.credential
        try{
            const response = await fetch("http://localhost:8080/auth/login", {
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

    }

    return(
        <div>
            <GoogleLogin onSuccess={(credentialResponse)=>{
                console.log(credentialResponse)
                console.log(jwtDecode(credentialResponse.credential))
                googleLoginButton(credentialResponse)
            }} onError={()=>console.log("Login Failed")}></GoogleLogin>
            <label>Username</label>
            <input type="text" id="username"/>
            <label>Password</label>
            <input type="text" id="password"/>
            <button onClick={userpassLoginButton()}>Login</button>
            <button onClick={signup}>Sign Up</button>
        </div>
    );
}
export default Login;