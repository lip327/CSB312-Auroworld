import logo from './logo.svg';
import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";
// import './App.css';
import Posts from './posts.js'
import Courses from './courses.js'
import Login from './login.js'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/courses" element={<Courses />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
