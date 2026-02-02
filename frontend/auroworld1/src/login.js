import { useNavigate } from "react-router-dom";
function Login(){
    const navigate = useNavigate();

    function loginButton() {
        navigate("/posts");
    }
    return(
        <div id="login_page">
            <h1>Login</h1>
            <button onClick={loginButton}>Click enter to go to homepage.</button>
        </div>
    );

}
export default Login;