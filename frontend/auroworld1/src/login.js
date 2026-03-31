import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { createClient } from '@supabase/supabase-js';
import Button from './components/Button';
import Card from './components/Card';

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL      || 'https://rduempiojxizkwwbzaml.supabase.co',
    process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo'
);

function Spinner() {
    return (
        <span style={{
            display: 'inline-block', width: '12px', height: '12px',
            border: '2px solid currentColor', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.6s linear infinite',
            marginRight: '6px', verticalAlign: 'middle',
        }} />
    );
}

function Login() {
    const navigate = useNavigate();
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [loading,  setLoading]  = useState(false);

    async function googleLoginButton(credentialResponse) {
        setLoading(true);
        try {
            const idToken = credentialResponse.credential;
            const response = await fetch('https://auroworld.onrender.com/auth/login', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ idToken }),
            });
            const data = await response.json();
            if (data.mStatus !== 'ok') {
                alert('Login failed: ' + data.mMessage);
                return;
            }
            navigate('/posts');
        } catch (error) {
            console.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function userpassLoginButton() {
        if (!email || !password) {
            alert('Email and Password fields must not be empty.');
            return;
        }
        setLoading(true);
        try {
            const {  error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                if (error.message === 'Invalid login credentials') {
                    alert('Wrong email/password. Try again.');
                } else {
                    alert(error.message);
                }
                return;
            }
            navigate('/posts');
        } catch (error) {
            console.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
                      minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <Card style={{ width: '100%', maxWidth: '400px' }}>
                <GoogleLogin
                    onSuccess={(credentialResponse) => {
                        console.log(jwtDecode(credentialResponse.credential));
                        googleLoginButton(credentialResponse);
                    }}
                    onError={() => console.log('Login Failed')}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '15px' }}>
                    <label>Email</label>
                    <input
                        type="text"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                    <label>Password</label>
                    {/* FIX: was type="text" — password was shown in plain text */}
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <Button onClick={userpassLoginButton} disabled={loading}>
                        {loading && <Spinner />} Login
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/signup')}>Sign Up</Button>
                </div>
            </Card>
        </div>
    );
}

export default Login;
