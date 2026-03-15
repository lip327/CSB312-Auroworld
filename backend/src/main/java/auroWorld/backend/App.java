package auroWorld.backend;

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
        // final String userId;
        final String email;
        final String firstName;
        final String lastName;
        final boolean isAdmin;   // you can wire this via env if you like

        SessionData(String email, String firstName, String lastName, boolean isAdmin) {
            // this.userId = userId;
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
    private static final class CreateAccountRequest{
        public String user;
        public String email;
    }
    public static final class LoginRequest {
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
    private static final class CreateFileRequest{
        public String filename;
        public int msgId;
    }

    //body class for creating a new post/message
    private static final class CreateMessageRequest {
        public String subject;
        public String message;
    }   

    //class for pulling comment body data from frontend
    private static final class CreateCommentRequest {
        public String comment;
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
                    // it.allowMethod(io.javalin.http.HttpMethod.POST);
                });
            });
        });
        app.post("/newuser",ctx->{
            ctx.status(200);
            ctx.contentType("application/json");
            System.out.println("ctx body for creating account  : "+ctx.body());

            CreateAccountRequest car = gson.fromJson(ctx.body(),CreateAccountRequest.class);

            if(car==null || car.email == null || car.user==null){
                System.out.println(car);
                System.out.println(car.email);
                System.out.println(car.user);
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "missing username or email", null)));
                return;
            }

            int result = db.insertNewAccount(car.user,car.email);

            System.out.println(result);

            if(result==0){
                ctx.result(gson.toJson(new StructuredResponse("adding to user table failed",null,result)));
            }
            else{
                ctx.result(gson.toJson(new StructuredResponse("ok",null,result)));
            }
        });
        app.get("/user_email/{email}",ctx->{
            ctx.status(200);
            ctx.contentType("application/json");
            System.out.println("ctx body for checking email : "+ctx.body());

            String email=ctx.pathParam("email");

            System.out.println("ABout to check if email already registered");

            //boolean result = db.emailExists(cer.email);
            boolean result=db.emailExists(email);

            System.out.println(result);

            if(result==true){
                ctx.result(gson.toJson(new StructuredResponse("account with "+email+" already exists",null,result)));
            }
            else{
                ctx.result(gson.toJson(new StructuredResponse("ok",null,result)));
            }
            
        });

        app.get("/user_username/{username}",ctx->{
            ctx.status(200);
            ctx.contentType("application/json");
            System.out.println("ctx body for checking username : "+ctx.body());

            String username=ctx.pathParam("username");

            System.out.println("ABout to check if username already registered");

            //boolean result = db.usernameExists(cur.username);
            boolean result=db.usernameExists(username);

            System.out.println(result);

            if(result==true){
                ctx.result(gson.toJson(new StructuredResponse("account with "+username+" already exists",null,result)));
            }
            else{
                ctx.result(gson.toJson(new StructuredResponse("ok",null,result)));
            }
            
        });

        app.post("/auth/login", ctx -> {

            ctx.status(200);
            ctx.contentType("application/json");
            System.out.println("ctx bdoy : "+ctx.body());
            LoginRequest lr = gson.fromJson(ctx.body(), LoginRequest.class);
            System.out.println("LOGIN: Parsed body, idToken present? " + (lr != null && lr.idToken != null));

            if (lr == null || lr.idToken == null) {
                System.out.println("you cant login");
                System.out.println(lr);
                System.out.println(lr.idToken);
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
            db.ensureUserWithEmail(info.given_name, info.family_name, info.email);
            // db.ensureUserWithEmail2(info.given_name,info.family_name,info.email);
            // db.ensureUserWithEmail(info.sub, info.given_name, info.family_name, info.email);

            // Create server-side session
            SessionData sd = new SessionData(
                    info.email,
                    info.given_name,
                    info.family_name,
                    isAdmin
            );
            String sessionToken = SessionManager.create(sd);

            Map<String, Object> payload = new HashMap<>();
            payload.put("sessionToken", sessionToken);
            // payload.put("username", info.sub);
            payload.put("email", info.email);
            payload.put("firstName", info.given_name);
            payload.put("lastName", info.family_name);

            ctx.result(gson.toJson(new StructuredResponse("ok", null, payload)));
        });


        app.get("/messages", ctx -> {
            // Require login
            // SessionData session = requireSession(ctx);
            // if (session == null) return;   // requireSession already sends error JSON
            // String userId = ctx.header("X-Session-Token").toString();
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

        app.post("/messages", ctx -> {
            SessionData session = requireSession(ctx);
            // // if (session == null) return;   // requireSession already sends error JSON
            // String userId = cache.get(ctx.header("X-Session-Token")).toString();
            // if(userId==null){
            //     return;
            // }

            ctx.contentType("application/json");

            CreateMessageRequest req = gson.fromJson(ctx.body(), CreateMessageRequest.class);

            if (req == null || req.subject == null || req.message == null ||
                req.subject.trim().isEmpty() || req.message.trim().isEmpty()) {

                ctx.status(400);
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "missing subject or message", null)));
                return;
            }
            int newId = db.insertMessage("Tester", req.subject.trim(), req.message.trim());

            // int newId = db.insertMessage(session.userId, req.subject.trim(), req.message.trim());

            if (newId < 0) {
                ctx.status(500);
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "failed to create message", null)));
                return;
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("msgId", newId);

            ctx.status(201);
            ctx.result(gson.toJson(new StructuredResponse("ok", null, payload)));
        });

        app.post("/files", ctx->{
            SessionData session = requireSession(ctx);

            ctx.contentType("application/json");

            CreateFileRequest req = gson.fromJson(ctx.body(),CreateFileRequest.class);

            System.out.println("CreateFileRequest req= "+req.filename+" "+req.msgId);

            if(req==null || req.filename==null || req.filename.trim().isEmpty() || req.msgId==0){
                ctx.status(400);
                ctx.result(gson.toJson(new StructuredResponse(
                    "error","missing filename",null)));
                return;
            }

            int newId=db.insertFileToTable("alice",req.filename.trim(),req.msgId,"posts/"+req.msgId+"/"+req.filename.trim());

            if(newId<0){
                ctx.status(500);
                ctx.result(gson.toJson(new StructuredResponse("error","failed to upload file",null)));
                return;
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("file_id",newId);
            
            ctx.status(201);
            ctx.result(gson.toJson(new StructuredResponse("ok",null,payload)));

        });

        app.post("/messages/{id}/comments", ctx -> {
            // // Require login
            SessionData session = requireSession(ctx);
            // // if (session == null) return;   // requireSession already sends error JSON
            // if (session == null) return;

            ctx.contentType("application/json");

            int msgId = Integer.parseInt(ctx.pathParam("id"));
            System.out.println("MESSAGE ID:"+msgId);
            CreateCommentRequest req = gson.fromJson(ctx.body(), CreateCommentRequest.class);

            if (req == null || req.comment == null || req.comment.trim().isEmpty()) {
                ctx.status(400);
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "missing comment", null)));
                return;
            }

            // int newId = db.insertComment(msgId, session.userId, req.comment.trim());
            int newId = db.insertComment(msgId, "Tester", req.comment.trim());
            
            if (newId < 0) {
                ctx.status(500);
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "failed to create comment", null)));
                return;
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("commentId", newId);

            ctx.status(201);
            ctx.result(gson.toJson(new StructuredResponse("ok", null, payload)));
        });

        // app.get("/file/{file_id}",ctx->{
        //     ctx.status(200);
        //     ctx.contentType("application/json");

        //     int fileI
        // });
        app.put("/vote_messages/{msg_id}", ctx->{
            ctx.status(200);
            ctx.contentType("application/json");

            int msgId= Integer.parseInt(ctx.pathParam("msg_id"));
            
            int result = db.voteMessageTable(msgId, "Tester", 1);

            StructuredResponse resp = (result == -1)
                    ? new StructuredResponse("error", "vote failed", null)
                    : new StructuredResponse("ok", "vote=" + result, null);
            
            ctx.result(gson.toJson(resp));
        });

        app.put("/vote_comments/{comment_id}", ctx->{
            ctx.status(200);
            ctx.contentType("application/json");

            int comment_id= Integer.parseInt(ctx.pathParam("comment_id"));
            
            int result = db.voteCommentTable(comment_id, "Tester", 1);

            StructuredResponse resp = (result == -1)
                    ? new StructuredResponse("error", "comment vote failed", null)
                    : new StructuredResponse("ok", "comment vote=" + result, null);
            
            ctx.result(gson.toJson(resp));
        });

        app.get("/messages/{msg_id}", ctx -> {
            // // Require login
            // SessionData session = requireSession(ctx);
            // // if (session == null) return;   // requireSession already sends error JSON
            // String userId = cache.get(ctx.header("X-Session-Token")).toString();
            // if(userId==null){
            //     return;
            // }

            ctx.status(200);
            ctx.contentType("application/json");

            int msgId = Integer.parseInt(ctx.pathParam("msg_id"));
            //String cacheKey = "message_" + msgId;

            //String cached = (String)cache.get(cacheKey);


            Database.MessageData msg = db.selectMessage(msgId);

            StructuredResponse resp = (msg == null)
                    ? new StructuredResponse("error", "Message not found", null)
                    : new StructuredResponse("ok", null, msg);

            String json = gson.toJson(resp);

            // if (msg != null) {
            //     cache.set(cacheKey, 3600, json);
            // }

            ctx.result(json);
        });

        // app.put("/messages/{id}",ctx->{
        //     ctx.status(200);
        //     ctx.contentType("application/json");

        //     int msgId=Integer.parseInt(ctx.pathParam("id"));

        //     CreateMessageRequest req = gson.fromJson(ctx.body(), CreateMessageRequest.class);

        //     if (req == null || req.subject || req.message == null) {
        //         ctx.result(gson.toJson(new StructuredResponse(
        //                 "error", "missing message subject or message", null)));
        //         return;
        //     }

        //     int result = db.updatePost(msgId, "Tester", req.message);

        //     StructuredResponse resp = (result == -1 || result == 0)
        //             ? new StructuredResponse("error", "post update failed (not owner?)", null)
        //             : new StructuredResponse("ok", null, "updated");

        //     ctx.result(gson.toJson(resp));
        // });


        app.get("/messages/{id}/comments", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");

            // SessionData session = requireSession(ctx);
            // // if (session == null) return;   // requireSession already sends error JSON
            // String userId = cache.get(ctx.header("X-Session-Token")).toString();
            // if(userId==null){
            //     return;
            // }

            int msgId = Integer.parseInt(ctx.pathParam("id"));

            // String cacheKey="messages_"+msgId+"_comments";
            // String cachedJson = (String) cache.get(cacheKey);

            // if (cachedJson != null) {
            //     System.out.println("CACHE HIT: messages-"+msgId+"-comments");
            //     ctx.result(cachedJson);
            //     return;
            // }

            ArrayList<Database.CommentData> comments = db.selectComments(msgId);

            StructuredResponse resp = new StructuredResponse("ok", null, comments);

            String json = gson.toJson(resp);
            // cache.set(cacheKey, 30, json);
            ctx.result(json);

            ctx.result(gson.toJson(resp));
        });

        app.get("/profile/{userId}", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");

            // you could require auth here; we'll do it to line up with "app use requires auth"
            //SessionData session = requireSession(ctx);
            // if (session == null) return;   // requireSession already sends error JSON
            //String userId = cache.get(ctx.header("X-Session-Token")).toString();
            // if(userId==null){
            //     return;
            // }

            String targetId = ctx.pathParam("userId");

            //String cacheKey = "public_profile_" + targetId;
            // String cachedJson = (String) cache.get(cacheKey);
            // if (cachedJson != null) {
            //     System.out.println("CACHE HIT: profile-"+targetId);
            //     ctx.result(cachedJson);
            //     return;
            // }

            Database.ProfilePublicData profile = db.selectPublicProfile(targetId);

            StructuredResponse resp = (profile == null)
                    ? new StructuredResponse("error", "profile not found", null)
                    : new StructuredResponse("ok", null, profile);
            
            String json = gson.toJson(resp);
            //cache.set(cacheKey, 300, json);

            ctx.result(gson.toJson(resp));
        });


        app.start(8080);
    }  
    
}
