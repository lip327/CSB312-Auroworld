import { useNavigate } from "react-router-dom";
import { createClient } from '@supabase/supabase-js'

function Signup(){
    const navigate = useNavigate();
    const supabase = createClient('https://rduempiojxizkwwbzaml.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo')

    async function createAccount( ){
        console.log("hit create account button");

        try{
            console.log("checking username valid")

            const user_res =await fetch(`http://localhost:8080/user_username/${document.getElementById("username").value}`)
            const user_data = await user_res.json();
            console.log("Check user response:",user_data)

            if(user_data.mData!==false){
                alert("Account with that username already exists. Pick a new one");
                return;
            }

            console.log("checking email validity")
            const email_res =await fetch(`http://localhost:8080/user_email/${document.getElementById("email").value}`)
            const email_data = await email_res.json();
            console.log("Check email response:",email_data)

            if(email_data.mData!==false){
                alert("Account with that email already exists. Pick a new one");
                return;
            }
            console.log("username and email valid")

            const { data, error } = await supabase.auth.signUp({
                email: document.getElementById("email").value,
                password: document.getElementById("password").value,
            })

            const account_vals={
                email:document.getElementById("email").value,
                username:document.getElementById("username").value
            }

            const create_res=await fetch("http://localhost:8080/newuser",{
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(account_vals)
            })
            const create_data=await create_res.json()
            console.log("create_data response "+create_data)

            if(data.mStatus!=="ok"){
                alert("Adding new username and email to users table failed: "+data.mMessage);
                return;
            }

            console.log("account created.")
            alert("Congratulations, you are registered! Welcome!")

            navigate("/posts")
        } catch(error){
            console.error(error.message)
        }
    }

    return(
        <div>
            <h1>Welcome to Auroworld! Sign up here.</h1>
            <label>Email</label>
            <input type="text" id="email"/>
            <label>Username</label>
            <input type="text" id="username"/>
            <label>Password</label>
            <input type="text" id="password"/>
            <button onClick={createAccount}>Create my Account</button>
        </div>
    );
}

export default Signup;
