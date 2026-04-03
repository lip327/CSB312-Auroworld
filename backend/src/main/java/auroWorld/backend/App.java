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
    private static final class GoogleAccountRequest{
        public String username;
        public String email;
        public String user_uuid;
        public String firstname;
        public String lastname;
    }
    private static final class CreateAccountRequest{
        public String username;
        public String email;
        public String user_uuid;
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
        public String user_uuid;
        public String filename;
        public int msgId;
    }
    private static final class ChangeFileRequest{
        public String filename;
    }
    private static final class CreateVoteRequest{
        public String user_uuid;
    }
    //body class for creating a new post/message
    private static final class CreateMessageRequest {
        public String user_uuid;
        public String subject;
        public String message;
    }   

    //class for pulling comment body data from frontend
    private static final class CreateCommentRequest {
        public String user_uuid;
        public String comment;
    }
    //class for updating message
    private static final class CreateUpdateRequest{
        public String subject;
        public String message;
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

            if(car==null || car.email == null || car.username==null || car.user_uuid==null){
                System.out.println(car);
                System.out.println(car.email);
                System.out.println(car.username);
                System.out.println(car.user_uuid);
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "missing username or email", null)));
                return;
            }

            int result = db.insertNewAccount(car.username,car.email, car.user_uuid,null,null);

            System.out.println(result);

            if(result==0){
                ctx.result(gson.toJson(new StructuredResponse("adding to user table failed",null,result)));
            }
            else{
                ctx.result(gson.toJson(new StructuredResponse("ok",null,result)));
            }
        });

        app.post("/profile_attributes", ctx->{
            ctx.status(200);
            ctx.contentType("application/json");
            System.out.println("ctx bdoy : "+ctx.body());

            CreateAccountRequest car = gson.fromJson(ctx.body(),CreateAccountRequest.class);
            if(car==null || car.email == null || car.username==null || car.user_uuid==null){
                System.out.println(car);
                System.out.println(car.email);
                System.out.println(car.username);
                System.out.println(car.user_uuid);
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "missing username or email", null)));
                return;
            }
            int  result = db.insertNewProfile(car.username,car.email,car.user_uuid);

            if(result==0){
                ctx.result(gson.toJson(new StructuredResponse("adding to profile table failed",null,result)));
            }
            else{
                ctx.result(gson.toJson(new StructuredResponse("ok",null,result)));
            }
        });

        app.get("/username/{uuid}", ctx->{
            ctx.status(200);
            ctx.contentType("application/json");
            System.out.println("ctx body for finding username from uuid : "+ctx.body());

            String user_uuid=ctx.pathParam("uuid");
            System.out.println("ABout to check which username is to that uuid");

            String username=db.grabUsernameFromUuid(user_uuid);
            System.out.println(username);
            if(username==null){
                ctx.result(gson.toJson(new StructuredResponse("cant find corresponding username",null,null)));
            }
            else{
                ctx.result(gson.toJson(new StructuredResponse("ok",null,username)));
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

        app.post("/auth/newuser", ctx->{
            ctx.status(200);
            ctx.contentType("application/json");

            System.out.println("ctx body: "+ctx.body());

            GoogleAccountRequest gar = gson.fromJson(ctx.body(),GoogleAccountRequest.class);

            if(gar==null || gar.username==null || gar.email==null || gar.lastname==null 
                || gar.firstname==null || gar.user_uuid==null ){
                System.out.println(gar);
                System.out.println(gar.username);
                System.out.println(gar.email);
                System.out.println(gar.lastname);
                System.out.println(gar.firstname);
                System.out.println(gar.user_uuid);
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "missing username or email", null)));
                return;
            }

            int result = db.insertNewAccount(gar.username,gar.email,gar.user_uuid,gar.lastname,gar.firstname);

            if(result==0){
                ctx.result(gson.toJson(new StructuredResponse("adding to user table failed",null,result)));
            }
            else{
                ctx.result(gson.toJson(new StructuredResponse("ok",null,result)));
            }
        });

        app.get("/users/{userId}/messages", ctx->{
            ctx.status(200);
            ctx.contentType("application/json");

            String userid=ctx.pathParam("userId");

            ArrayList<Database.MessageData> my_msgs = db.selectUserMessages(userid);

            StructuredResponse resp = new StructuredResponse(
                    "ok",
                    null,
                    my_msgs
            );

            ctx.result(gson.toJson(resp));

        });

        app.get("/messages", ctx ->{
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

            if (req == null || req.user_uuid ==null || req.subject == null || req.message == null ||
                req.subject.trim().isEmpty() || req.message.trim().isEmpty()) {
                ctx.status(400);
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "missing subject or message or uuid", null)));
                return;
            }
            System.out.println("user_uuid="+req.user_uuid);
            int newId = db.insertMessage(req.user_uuid, req.subject.trim(), req.message.trim());

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

            if(req==null || req.user_uuid ==null ||req.filename==null || req.filename.trim().isEmpty() || req.msgId==0){
                ctx.status(400);
                ctx.result(gson.toJson(new StructuredResponse(
                    "error","missing filename",null)));
                return;
            }

            int newId=db.insertFileToTable(req.user_uuid,req.filename.trim(),req.msgId,"posts/"+req.msgId+"/"+req.filename.trim());

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

        app.get("/file/{msg_id}",ctx->{
            ctx.status(200);
            ctx.contentType("application/json");

            int msg_id=Integer.parseInt(ctx.pathParam("msg_id"));
            System.out.println(msg_id);

            String filename=db.grabFilename(msg_id);

            if(filename==null){
                ctx.result(gson.toJson(new StructuredResponse("no filename entry for that message",null,null)));
            }
            else{
                ctx.result(gson.toJson(new StructuredResponse("ok",null,filename)));
            }
        });

        app.get("/files/mymessages/{user_uuid}", ctx->{
            ctx.status(200);
            ctx.contentType("application/json");

            String user_uuid = ctx.pathParam("user_uuid");

            ArrayList<Database.FileData> files = db.grabMyFilenames(user_uuid);

            StructuredResponse resp = new StructuredResponse(
                    "ok",
                    null,
                    files
            );

            ctx.result(gson.toJson(resp));
        });

        // app.put("/file/{msg_id}",ctx->{
        //     ctx.status(200);
        //     ctx.contentType("application/json");

        //     int msg_id=Integer.parseInt(ctx.pathParam("msg_id"));
        //     System.out.println(msg_id);

        //     ChangeFileRequest cfr = gson.fromJson(ctx.body(),ChangeFileRequest.class);
        //     if(cfr==null || cfr.filename==null || cfr.filename.trim().isEmpty()){
        //         ctx.status(400);
        //         ctx.result(gson.toJson(new StructuredResponse(
        //             "error","missing filepath",null)));
        //         return;
        //     }

        //     int success = db.editFileInTable(msg_id,cfr.filename);
        // });

        app.post("/messages/{id}/comments", ctx -> {
            // // Require login
            SessionData session = requireSession(ctx);
            // // if (session == null) return;   // requireSession already sends error JSON
            // if (session == null) return;

            ctx.contentType("application/json");

            int msgId = Integer.parseInt(ctx.pathParam("id"));
            System.out.println("MESSAGE ID:"+msgId);
            CreateCommentRequest req = gson.fromJson(ctx.body(), CreateCommentRequest.class);

            if (req == null || req.user_uuid==null ||req.comment == null || req.comment.trim().isEmpty()) {
                ctx.status(400);
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "missing comment", null)));
                return;
            }

            // int newId = db.insertComment(msgId, session.userId, req.comment.trim());
            int newId = db.insertComment(msgId, req.user_uuid, req.comment.trim());
            
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

        app.put("/vote_messages/{msg_id}", ctx->{
            ctx.status(200);
            ctx.contentType("application/json");

            CreateVoteRequest cvr = gson.fromJson(ctx.body(),CreateVoteRequest.class);

            if (cvr==null || cvr.user_uuid ==null){
                ctx.status(400);
                System.out.println("cvr:" +cvr);
                System.out.println("cvr useruuid: "+cvr.user_uuid);
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "missing uuid to do upvote for post", null)));
                return;
            }

            int msgId= Integer.parseInt(ctx.pathParam("msg_id"));
            
            int result = db.voteMessageTable(msgId, cvr.user_uuid, 1);

            StructuredResponse resp = (result == -1)
                    ? new StructuredResponse("error", "vote failed", null)
                    : new StructuredResponse("ok", "vote=" + result, null);
            
            ctx.result(gson.toJson(resp));
        });

        app.put("/vote_comments/{comment_id}", ctx->{
            ctx.status(200);
            ctx.contentType("application/json");

            CreateVoteRequest cvr = gson.fromJson(ctx.body(),CreateVoteRequest.class);

            if (cvr==null || cvr.user_uuid ==null){
                ctx.status(400);
                System.out.println("cvr:" +cvr);
                System.out.println("cvr useruuid: "+cvr.user_uuid);
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "missing uuid to do upvote for post", null)));
                return;
            }

            int comment_id= Integer.parseInt(ctx.pathParam("comment_id"));
            
            int result = db.voteCommentTable(comment_id, cvr.user_uuid, 1);

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

        app.put("/messages/{id}",ctx->{
            ctx.status(200);
            ctx.contentType("application/json");

            int msgId=Integer.parseInt(ctx.pathParam("id"));

            CreateUpdateRequest cur = gson.fromJson(ctx.body(), CreateUpdateRequest.class);

            if (cur == null || cur.subject ==null || cur.message == null) {
                ctx.result(gson.toJson(new StructuredResponse(
                        "error", "missing message subject or message", null)));
                return;
            }

            int result = db.updatePost(msgId, cur.subject, cur.message);

            StructuredResponse resp = (result == -1 || result == 0)
                    ? new StructuredResponse("error", "post update failed", null)
                    : new StructuredResponse("ok", null, "updated");

            ctx.result(gson.toJson(resp));
        });


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

            System.out.println("targetId = "+targetId);

            Database.ProfilePublicData profile = db.selectPublicProfile(targetId);

            System.out.println("profile: "+profile);

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
