import { useNavigate } from "react-router-dom";
import { createClient } from '@supabase/supabase-js'
import Button from './components/Button';
import Card from './components/Card';

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
            if(error){
                console.log("error signing up: "+error.message)
                alert("Problem with signing up.")
                return
            }

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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <Card style={{ width: '400px' }}>
                <h2 style={{ marginTop: 0, textAlign: 'center' }}>Welcome to Auroworld!</h2>
                <p style={{ color: '#666', textAlign: 'center', marginBottom: '20px' }}>Sign up here.</p>
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                    <input type="text" id="email" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}/>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username</label>
                    <input type="text" id="username" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}/>
                </div>
                
                <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
                    <input type="password" id="password" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}/>
                </div>
                
                <Button style={{ width: '100%' }} onClick={createAccount}>Create my Account</Button>
            </Card>
        </div>
    );
}

export default Signup;
