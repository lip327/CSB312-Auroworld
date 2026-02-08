import { useNavigate } from "react-router-dom";
function Login(){
    const navigate = useNavigate();

    function loginButton() {
        navigate("/posts");
    }
    return(
        <div id="login_page">
            <script src="https://accounts.google.com/gsi/client" async defer></script>
            <script type="module" src="backend/src/main/java/auroWorld/backend/Appmain.js"></script>
            <div id="g_id_onload"
                data-client_id="919556829980-k6sie1d5p630vb1m8uaa4a8ou34up51f.apps.googleusercontent.com"
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
            <h1>Login</h1>
            <button onClick={loginButton}>Click enter to go to homepage.</button>
        </div>
    );

}
export default Login;
// <!DOCTYPE html>
// <html>
// <head>
//     <meta charset="UTF-8">
//     <title>Sign In</title>

//     <!-- Google Identity Services -->
//     <script src="https://accounts.google.com/gsi/client" async defer></script>
//     <!-- YOUR auth.js MUST load BEFORE handleCredentialResponse uses saveToken() -->
//     <script type="module" src="js/auth.js"></script>

//     <script>
//         async function handleCredentialResponse(response) {
//             const idToken = response.credential;
//             const res = await fetch("/auth/login", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ idToken })
//             });
//             const data = await res.json();
//             console.log("Login response:", data);
//             if (data.mStatus !== "ok") {
//                 alert("Login failed: " + data.mMessage);
//                 return;
//             }
//             const payload = data.mData;

//             localStorage.setItem("sessionToken", payload.sessionToken);
//             localStorage.setItem("userId", payload.userId);
//             window.location.href = "/index.html";
//         }
//     </script>
// </head>

// <body>
//     <h1>Sign In</h1>

//     <div id="g_id_onload"
//         data-client_id="919556829980-k6sie1d5p630vb1m8uaa4a8ou34up51f.apps.googleusercontent.com"
//         data-context="signin"
//         data-ux_mode="popup"
//         data-callback="handleCredentialResponse"
//         data-auto_prompt="false">
//     </div>

//     <div class="g_id_signin"
//         data-type="standard"
//         data-size="large"
//         data-theme="outline">
//     </div>

// </body>
// </html>