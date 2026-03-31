import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

function Signup() {
    const navigate = useNavigate();
    const [email,    setEmail]    = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading,  setLoading]  = useState(false);

    async function createAccount() {
        if (!email || !username || !password) {
            alert('All fields are required.');
            return;
        }
        setLoading(true);
        try {
            // Check username availability
            const userRes  = await fetch(`https://auroworld.onrender.com/user_username/${username}`);
            const userData = await userRes.json();
            if (userData.mData === true) {
                alert('Username already taken. Pick a new one.');
                return;
            }

            // Check email availability
            const emailRes  = await fetch(`https://auroworld.onrender.com/user_email/${email}`);
            const emailData = await emailRes.json();
            if (emailData.mData === true) {
                alert('An account with that email already exists.');
                return;
            }

            // Create Supabase auth account
            const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
            if (authError) {
                alert('Problem signing up: ' + authError.message);
                return;
            }

            // Register in backend users table — pass the new supabase uuid
            const uuid       = authData.user?.id;
            const createRes  = await fetch('https://auroworld.onrender.com/newuser', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, username, user_uuid: uuid }),
            });
            const createData = await createRes.json();

            // FIX: was checking data.mStatus (Supabase object) instead of createData.mStatus
            if (createData.mStatus !== 'ok') {
                alert('Failed to save account: ' + createData.mMessage);
                return;
            }

            alert('Congratulations, you are registered! Welcome!');
            navigate('/posts');
        } catch (error) {
            console.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    const inputStyle = {
        width: '100%', padding: '10px', borderRadius: '8px',
        border: '1px solid #ccc', boxSizing: 'border-box',
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
                      minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <Card style={{ width: '400px' }}>
                <h2 style={{ marginTop: 0, textAlign: 'center' }}>Welcome to Auroworld!</h2>
                <p style={{ color: '#666', textAlign: 'center', marginBottom: '20px' }}>Sign up here.</p>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                    <input type="text" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
                </div>

                <Button style={{ width: '100%' }} onClick={createAccount} disabled={loading}>
                    {loading && <Spinner />} Create my Account
                </Button>
            </Card>
        </div>
    );
}

export default Signup;
