import { useNavigate } from "react-router-dom";
// import 'csb312-auroworld\backend\src\main\java\auroworld\backend\Appmain.js'

function Login(){
    const navigate = useNavigate();

    function loginButton() {
        navigate("/posts");
    }

    return(
        <div id="login_page">
            <h1>Login</h1>
            <script src="https://accounts.google.com/gsi/client" async defer></script>
            <script type="module" src="backend/src/main/java/auroWorld/backend/Appmain.js"></script>
            <div id="g_id_onload"
                data-client_id="134970251770-d7nviqn0qn0p0qpll7ru770kf2ntqu1h.apps.googleusercontent.com"
                data-context="signin"
                data-ux_mode="popup"
                data-callback="handleCredentialResponse"
                data-auto_prompt="false">
            </div>

            <div class="g_id_signin"
                data-type="standard"
                data-size="large"
                data-theme="outline">
            </div>
            <button onClick={loginButton}>Click enter to go to homepage.</button>
        </div>
    );

}
export default Login;