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

    async function loginButton(credentialResponse) {
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

    return(
        <GoogleLogin onSuccess={(credentialResponse)=>{
            console.log(credentialResponse)
            console.log(jwtDecode(credentialResponse.credential))
            loginButton(credentialResponse)
        }} onError={()=>console.log("Login Failed")}></GoogleLogin>
       
    );

}
export default Login;