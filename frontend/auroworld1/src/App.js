import logo from './logo.svg';
import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";
// import './App.css';
import Posts from './posts.js'
import Courses from './courses.js'
import Login from './login.js'
import Signup from './signup.js'
import { GoogleOAuthProvider } from '@react-oauth/google';


const GOOGLE_CLIENT_ID="134970251770-d7nviqn0qn0p0qpll7ru770kf2ntqu1h.apps.googleusercontent.com"
function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/signup" element={<Signup />}/>
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
