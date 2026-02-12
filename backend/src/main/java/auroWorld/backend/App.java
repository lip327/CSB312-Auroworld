package auroworld.backend;

/**
 * Hello world!
 *
 */
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.UploadedFile;
import io.javalin.http.staticfiles.Location;
import java.io.IOException;

import com.google.gson.Gson;

//DATABASE_URI="jdbc:postgresql://aws-0-us-west-2.pooler.supabase.com:6543/postgres?user=postgres.rduempiojxizkwwbzaml&password=[YOURPASSWORD]&sslmode=require" mvn exec:java
public class App 
{
    //google_client_id is the id for the google oauth from the google cloud project
    private static final Gson gson = new Gson();
    private static final String GOOGLE_CLIENT_ID=
    "134970251770-d7nviqn0qn0p0qpll7ru770kf2ntqu1h.apps.googleusercontent.com";

    //class for pulling information from google account
    private static final class SessionData {
        final String userId;
        final String email;
        final String firstName;
        final String lastName;
        final boolean isAdmin;   // you can wire this via env if you like

        SessionData(String userId, String email, String firstName, String lastName, boolean isAdmin) {
            this.userId = userId;
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
            this.isAdmin = isAdmin;
        }
    }
    //class for pulling together session data objects 
    private static final class SessionManager {
        private static final Map<String, SessionData> SESSIONS = new ConcurrentHashMap<>();

        static String create(SessionData data) {
            String token = UUID.randomUUID().toString();
            SESSIONS.put(token, data);
            return token;
        }

        static SessionData get(String token) {
            return SESSIONS.get(token);
        }
    }
    private static final class LoginRequest {
        public String idToken;
    }
    //class for grabbing infromation from google account you use to sign in 
    private static final class GoogleTokenInfo {
        public String aud;
        public String iss;
        public String email;
        public String hd;
        public String sub;
        public String given_name;
        public String family_name;
        public String email_verified;
    }
    //function for getting session token from window
    private static SessionData requireSession(Context ctx) {
        String token = ctx.header("X-Session-Token");
        if (token == null) {
            ctx.status(401);
            ctx.contentType("application/json");
            ctx.result(gson.toJson(new StructuredResponse(
                    "error", "missing session token", null)));
            return null;
        }
        SessionData s = SessionManager.get(token);
        if (s == null) {
            ctx.status(401);
            ctx.contentType("application/json");
            ctx.result(gson.toJson(new StructuredResponse(
                    "error", "invalid session", null)));
            return null;
        }
        return s;
    }
    //function for checking if you have a valid token
    private static GoogleTokenInfo verifyGoogleIdToken(String idToken) {
        System.out.println("verifyGoogleIdToken: starting HTTP call");
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken))
                .GET()
                .build();
        try {
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            System.out.println("verifyGoogleIdToken: HTTP status = " + resp.statusCode());
            if (resp.statusCode() != 200) {
                return null;
            }
            GoogleTokenInfo info = gson.fromJson(resp.body(), GoogleTokenInfo.class);
            if (info == null) return null;

            if (!GOOGLE_CLIENT_ID.equals(info.aud)) {
                System.out.println("verifyGoogleIdToken: aud mismatch: " + info.aud);
                return null;
            }
            // if (info.hd == null || !ALLOWED_DOMAIN.equalsIgnoreCase(info.hd)) {
            //     System.out.println("verifyGoogleIdToken: hd mismatch: " + info.hd);
            //     return null;
            // }
            return info;
        } catch (IOException | InterruptedException e) {
            System.out.println("verifyGoogleIdToken ERROR: " + e);
            e.printStackTrace();
            return null;
        }
    }

    public static void main(String[] args) throws Exception{
        main_uses_database(args);
    }
    public static void main_uses_database( String[] args ) throws Exception{
        Database db = Database.getDatabase();
        if (db == null) {
            System.err.println("Failed to connect to DB, exiting.");
            return;
        }
        Javalin app = Javalin.create(config -> {
            config.requestLogger.http((ctx, ms) -> {
                System.out.printf("%s%n", "=".repeat(42));
                System.out.printf(
                        "%s\t%s\t%s%nfull url: %s%n",
                        ctx.scheme(), ctx.method().name(), ctx.path(), ctx.fullUrl()
                );
            });

            config.staticFiles.add(files -> {
                files.hostedPath = "/";
                String override = System.getenv("STATIC_LOCATION");
                if (override == null) {
                    files.directory = "/public";
                    files.location  = Location.CLASSPATH;
                } else {
                    files.directory = override;
                    files.location  = Location.EXTERNAL;
                }
            });
            config.bundledPlugins.enableCors(cors -> {
                cors.addRule(it -> {
                    it.anyHost();
                });
            });
        });
        app.post("/auth/login", ctx -> {
            System.out.println("LOGIN: /auth/login hit");

            ctx.status(200);
            ctx.contentType("application/json");

            LoginRequest lr = gson.fromJson(ctx.body(), LoginRequest.class);
            System.out.println("LOGIN: Parsed body, idToken present? " + (lr != null && lr.idToken != null));

            if (lr == null || lr.idToken == null) {
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "missing idToken", null)));
                return;
            }

            System.out.println("LOGIN: About to call verifyGoogleIdToken");
            GoogleTokenInfo info = verifyGoogleIdToken(lr.idToken);
            System.out.println("LOGIN: verifyGoogleIdToken returned: " + (info != null));

            if (info == null) {
                ctx.status(401);
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "invalid or unauthorized token", null)));
                return;
            }

            // Determine if this user is admin (optional)
            boolean isAdmin = false;
            String adminList = System.getenv("ADMIN_EMAILS");
            if (adminList != null && info.email != null &&
                    adminList.toLowerCase().contains(info.email.toLowerCase())) {
                isAdmin = true;
            }

            // Ensure user exists in DB (with email)
            db.ensureUserWithEmail(info.sub, info.given_name, info.family_name, info.email);

            // Create server-side session
            SessionData sd = new SessionData(
                    info.sub,
                    info.email,
                    info.given_name,
                    info.family_name,
                    isAdmin
            );
            String sessionToken = SessionManager.create(sd);

            Map<String, Object> payload = new HashMap<>();
            payload.put("sessionToken", sessionToken);
            payload.put("userId", info.sub);
            payload.put("email", info.email);
            payload.put("firstName", info.given_name);
            payload.put("lastName", info.family_name);

            ctx.result(gson.toJson(new StructuredResponse("ok", null, payload)));
        });
        app.get("/messages", ctx -> {
            // Require login
            // SessionData session = requireSession(ctx);
            // // if (session == null) return;   // requireSession already sends error JSON
            // String userId = cache.get(ctx.header("X-Session-Token")).toString();
            // if(userId==null){
            //     return;
            // }

            ctx.status(200);
            ctx.contentType("application/json");

            ArrayList<Database.MessageData> msgs = db.selectAllMessages();

            StructuredResponse resp = new StructuredResponse(
                    "ok",
                    null,
                    msgs
            );

            ctx.result(gson.toJson(resp));
        });
        app.start(8080);
    }
    
}
