import logo from './logo.svg';
import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";
// import './App.css';
import Posts from './posts.js'
import Courses from './courses.js'
import Login from './login.js'
import Signup from './signup.js'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { createClient } from '@supabase/supabase-js'
import Calendar from './Calendar.js';


const GOOGLE_CLIENT_ID="134970251770-d7nviqn0qn0p0qpll7ru770kf2ntqu1h.apps.googleusercontent.com"
function App() {
  const supabase = createClient('https://rduempiojxizkwwbzaml.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo')
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/signup" element={<Signup />}/>
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
