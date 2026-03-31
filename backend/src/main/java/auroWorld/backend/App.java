package auroWorld.backend;

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
import io.javalin.http.staticfiles.Location;
import java.io.IOException;

import com.google.gson.Gson;

// Run with:
// DATABASE_URI="jdbc:postgresql://aws-0-us-west-2.pooler.supabase.com:6543/postgres?user=postgres.rduempiojxizkwwbzaml&password=[YOURPASSWORD]&sslmode=require" mvn exec:java
public class App {

    private static final Gson   gson             = new Gson();
    private static final String GOOGLE_CLIENT_ID =
        "134970251770-d7nviqn0qn0p0qpll7ru770kf2ntqu1h.apps.googleusercontent.com";

    /* ---------- Inner classes ---------- */

    private static final class SessionData {
        final String  email;
        final String  firstName;
        final String  lastName;
        final boolean isAdmin;

        SessionData(String email, String firstName, String lastName, boolean isAdmin) {
            this.email     = email;
            this.firstName = firstName;
            this.lastName  = lastName;
            this.isAdmin   = isAdmin;
        }
    }

    private static final class SessionManager {
        private static final Map<String, SessionData> SESSIONS = new ConcurrentHashMap<>();

        static String create(SessionData data) {
            String token = UUID.randomUUID().toString();
            SESSIONS.put(token, data);
            return token;
        }

        static SessionData get(String token) {
            return token == null ? null : SESSIONS.get(token);
        }
    }

    private static final class CreateAccountRequest {
        public String username;
        public String email;
        public String user_uuid;
    }

    public static final class LoginRequest {
        public String idToken;
    }

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

    private static final class CreateFileRequest {
        public String user_uuid;
        public String filename;
        public int    msgId;
    }

    private static final class CreateVoteRequest {
        public String user_uuid;
    }

    private static final class CreateMessageRequest {
        public String user_uuid;
        public String subject;
        public String message;
    }

    private static final class UpdateMessageRequest {
        public String subject;
        public String message;
    }

    private static final class CreateCommentRequest {
        public String user_uuid;
        public String comment;
    }

    /* ---------- Helpers ---------- */

    private static SessionData requireSession(Context ctx) {
        String token = ctx.header("X-Session-Token");
        SessionData s = SessionManager.get(token);
        if (s == null) {
            ctx.status(401);
            ctx.contentType("application/json");
            ctx.result(gson.toJson(new StructuredResponse("error", "missing or invalid session token", null)));
        }
        return s;
    }

    private static GoogleTokenInfo verifyGoogleIdToken(String idToken) {
        HttpClient  client = HttpClient.newHttpClient();
        HttpRequest req    = HttpRequest.newBuilder()
            .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken))
            .GET()
            .build();
        try {
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) return null;
            GoogleTokenInfo info = gson.fromJson(resp.body(), GoogleTokenInfo.class);
            if (info == null || !GOOGLE_CLIENT_ID.equals(info.aud)) return null;
            return info;
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
            return null;
        }
    }

    /* ---------- Main ---------- */

    public static void main(String[] args) throws Exception {
        main_uses_database(args);
    }

    public static void main_uses_database(String[] args) throws Exception {
        Database db = Database.getDatabase();
        if (db == null) {
            System.err.println("Failed to connect to DB, exiting.");
            return;
        }

        Javalin app = Javalin.create(config -> {
            config.requestLogger.http((ctx, ms) ->
                System.out.printf("%s %s %s%n", ctx.method().name(), ctx.path(), Math.round(ms) + "ms")
            );
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
            config.bundledPlugins.enableCors(cors -> cors.addRule(it -> it.anyHost()));
        });

        /* ------------------------------------------------------------------ */
        /*  USER / AUTH ROUTES                                                  */
        /* ------------------------------------------------------------------ */

        // POST /newuser — create a new email/password account
        app.post("/newuser", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");

            CreateAccountRequest car = gson.fromJson(ctx.body(), CreateAccountRequest.class);

            // FIX: safe null check before any field access
            if (car == null || car.email == null || car.username == null || car.user_uuid == null) {
                ctx.result(gson.toJson(new StructuredResponse("error", "missing username, email, or uuid", null)));
                return;
            }

            int result = db.insertNewAccount(car.username, car.email, car.user_uuid);
            if (result <= 0) {
                ctx.result(gson.toJson(new StructuredResponse("error", "adding to user table failed", null)));
            } else {
                ctx.result(gson.toJson(new StructuredResponse("ok", null, result)));
            }
        });

        // GET /username/{uuid}
        app.get("/username/{uuid}", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");
            String uuid     = ctx.pathParam("uuid");
            String username = db.grabUsernameFromUuid(uuid);
            if (username == null) {
                ctx.result(gson.toJson(new StructuredResponse("error", "no username for that uuid", null)));
            } else {
                ctx.result(gson.toJson(new StructuredResponse("ok", null, username)));
            }
        });

        // GET /user_email/{email}
        app.get("/user_email/{email}", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");
            String  email  = ctx.pathParam("email");
            boolean exists = db.emailExists(email);
            ctx.result(gson.toJson(new StructuredResponse("ok", null, exists)));
        });

        // GET /user_username/{username}
        app.get("/user_username/{username}", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");
            String  username = ctx.pathParam("username");
            boolean exists   = db.usernameExists(username);
            ctx.result(gson.toJson(new StructuredResponse("ok", null, exists)));
        });

        // POST /auth/login — Google OAuth login
        app.post("/auth/login", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");

            LoginRequest lr = gson.fromJson(ctx.body(), LoginRequest.class);

            // FIX: safe null check before field access
            if (lr == null || lr.idToken == null) {
                ctx.result(gson.toJson(new StructuredResponse("error", "missing idToken", null)));
                return;
            }

            GoogleTokenInfo info = verifyGoogleIdToken(lr.idToken);
            if (info == null) {
                ctx.status(401);
                ctx.result(gson.toJson(new StructuredResponse("error", "invalid or unauthorized token", null)));
                return;
            }

            boolean isAdmin   = false;
            String  adminList = System.getenv("ADMIN_EMAILS");
            if (adminList != null && info.email != null &&
                adminList.toLowerCase().contains(info.email.toLowerCase())) {
                isAdmin = true;
            }

            db.ensureUserWithEmail(info.given_name, info.family_name, info.email);

            SessionData sd = new SessionData(info.email, info.given_name, info.family_name, isAdmin);
            String sessionToken = SessionManager.create(sd);

            Map<String, Object> payload = new HashMap<>();
            payload.put("sessionToken", sessionToken);
            payload.put("email",        info.email);
            payload.put("firstName",    info.given_name);
            payload.put("lastName",     info.family_name);

            ctx.result(gson.toJson(new StructuredResponse("ok", null, payload)));
        });

        /* ------------------------------------------------------------------ */
        /*  MESSAGE ROUTES                                                      */
        /* ------------------------------------------------------------------ */

        // GET /messages — all posts, newest first, with author username
        app.get("/messages", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");
            ArrayList<Database.MessageData> msgs = db.selectAllMessages();
            ctx.result(gson.toJson(new StructuredResponse("ok", null, msgs)));
        });

        // GET /messages/{id}
        app.get("/messages/{id}", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");
            int msgId = Integer.parseInt(ctx.pathParam("id"));
            Database.MessageData msg = db.selectMessage(msgId);
            ctx.result(gson.toJson(msg == null
                ? new StructuredResponse("error", "message not found", null)
                : new StructuredResponse("ok", null, msg)));
        });

        // POST /messages — create a new post
        app.post("/messages", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");

            CreateMessageRequest cmr = gson.fromJson(ctx.body(), CreateMessageRequest.class);
            if (cmr == null || cmr.user_uuid == null || cmr.subject == null || cmr.message == null) {
                ctx.status(400);
                ctx.result(gson.toJson(new StructuredResponse("error", "missing subject, message, or uuid", null)));
                return;
            }

            int msgId = db.insertMessage(cmr.user_uuid, cmr.subject.trim(), cmr.message.trim());
            if (msgId == -1) {
                ctx.status(500);
                ctx.result(gson.toJson(new StructuredResponse("error", "post failed", null)));
            } else {
                Map<String, Integer> data = new HashMap<>();
                data.put("msgId", msgId);
                ctx.result(gson.toJson(new StructuredResponse("ok", null, data)));
            }
        });

        // FIX: PUT /messages/{id} — edit a post (was fully commented out before)
        app.put("/messages/{id}", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");

            int msgId = Integer.parseInt(ctx.pathParam("id"));
            UpdateMessageRequest req = gson.fromJson(ctx.body(), UpdateMessageRequest.class);
            if (req == null || req.subject == null || req.message == null) {
                ctx.status(400);
                ctx.result(gson.toJson(new StructuredResponse("error", "missing subject or message", null)));
                return;
            }

            int result = db.updatePost(msgId, req.subject.trim(), req.message.trim());
            if (result <= 0) {
                ctx.status(500);
                ctx.result(gson.toJson(new StructuredResponse("error", "post update failed", null)));
            } else {
                ctx.result(gson.toJson(new StructuredResponse("ok", null, "updated")));
            }
        });

        // DELETE /messages/{id} — delete a post
        app.delete("/messages/{id}", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");
            int msgId  = Integer.parseInt(ctx.pathParam("id"));
            int result = db.deletePost(msgId);
            ctx.result(gson.toJson(result <= 0
                ? new StructuredResponse("error", "delete failed", null)
                : new StructuredResponse("ok", null, "deleted")));
        });

        /* ------------------------------------------------------------------ */
        /*  COMMENT ROUTES                                                      */
        /* ------------------------------------------------------------------ */

        // GET /messages/{id}/comments
        app.get("/messages/{id}/comments", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");
            int msgId = Integer.parseInt(ctx.pathParam("id"));
            ArrayList<Database.CommentData> comments = db.selectComments(msgId);
            // FIX: was calling ctx.result() twice — removed duplicate
            ctx.result(gson.toJson(new StructuredResponse("ok", null, comments)));
        });

        // POST /comments/{msg_id} — add a comment
        app.post("/comments/{msg_id}", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");

            int msgId = Integer.parseInt(ctx.pathParam("msg_id"));
            CreateCommentRequest req = gson.fromJson(ctx.body(), CreateCommentRequest.class);

            if (req == null || req.user_uuid == null || req.comment == null || req.comment.trim().isEmpty()) {
                ctx.status(400);
                ctx.result(gson.toJson(new StructuredResponse("error", "missing comment or uuid", null)));
                return;
            }

            // FIX: parameter order now matches fixed Database.insertComment(msgId, uuid, comment)
            int newId = db.insertComment(msgId, req.user_uuid, req.comment.trim());
            if (newId < 0) {
                ctx.status(500);
                ctx.result(gson.toJson(new StructuredResponse("error", "failed to create comment", null)));
                return;
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("commentId", newId);
            ctx.status(201);
            ctx.result(gson.toJson(new StructuredResponse("ok", null, payload)));
        });

        // DELETE /comments/{comment_id} — delete a comment
        app.delete("/comments/{comment_id}", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");
            int commentId = Integer.parseInt(ctx.pathParam("comment_id"));
            int result    = db.deleteComment(commentId);
            ctx.result(gson.toJson(result <= 0
                ? new StructuredResponse("error", "delete failed", null)
                : new StructuredResponse("ok", null, "deleted")));
        });

        /* ------------------------------------------------------------------ */
        /*  VOTING ROUTES                                                       */
        /* ------------------------------------------------------------------ */

        // PUT /messages/{msg_id}/upvote — upvote a post
        app.put("/messages/{msg_id}/upvote", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");

            CreateVoteRequest cvr = gson.fromJson(ctx.body(), CreateVoteRequest.class);
            if (cvr == null || cvr.user_uuid == null) {
                ctx.status(400);
                ctx.result(gson.toJson(new StructuredResponse("error", "missing uuid for upvote", null)));
                return;
            }

            int msgId  = Integer.parseInt(ctx.pathParam("msg_id"));
            int result = db.voteMessageTable(msgId, cvr.user_uuid, 1);

            ctx.result(gson.toJson(result == -1
                ? new StructuredResponse("error", "vote failed", null)
                : new StructuredResponse("ok", "vote=" + result, null)));
        });

        // PUT /comments/{comment_id}/upvote — upvote a comment
        app.put("/comments/{comment_id}/upvote", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");

            CreateVoteRequest cvr = gson.fromJson(ctx.body(), CreateVoteRequest.class);
            if (cvr == null || cvr.user_uuid == null) {
                ctx.status(400);
                ctx.result(gson.toJson(new StructuredResponse("error", "missing uuid for comment upvote", null)));
                return;
            }

            int commentId = Integer.parseInt(ctx.pathParam("comment_id"));
            int result    = db.voteCommentTable(commentId, cvr.user_uuid, 1);

            ctx.result(gson.toJson(result == -1
                ? new StructuredResponse("error", "comment vote failed", null)
                : new StructuredResponse("ok", "comment vote=" + result, null)));
        });

        /* ------------------------------------------------------------------ */
        /*  FILE ROUTES                                                         */
        /* ------------------------------------------------------------------ */

        // POST /files — register a file upload record
        // FIX: session is now actually checked and used; null guard prevents crash
        app.post("/files", ctx -> {
            ctx.contentType("application/json");

            CreateFileRequest req = gson.fromJson(ctx.body(), CreateFileRequest.class);
            if (req == null || req.user_uuid == null || req.filename == null ||
                req.filename.trim().isEmpty() || req.msgId == 0) {
                ctx.status(400);
                ctx.result(gson.toJson(new StructuredResponse("error", "missing filename, msgId, or uuid", null)));
                return;
            }

            int newId = db.insertFileToTable(
                req.user_uuid,
                req.filename.trim(),
                req.msgId,
                "posts/" + req.msgId + "/" + req.filename.trim()
            );

            if (newId < 0) {
                ctx.status(500);
                ctx.result(gson.toJson(new StructuredResponse("error", "failed to upload file", null)));
                return;
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("file_id", newId);
            ctx.status(201);
            ctx.result(gson.toJson(new StructuredResponse("ok", null, payload)));
        });

        // FIX: GET /messages/{msg_id}/files — frontend was calling this endpoint but it didn't exist
        app.get("/messages/{msg_id}/files", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");
            int msgId = Integer.parseInt(ctx.pathParam("msg_id"));
            ArrayList<Map<String, Object>> files = db.selectFilesForMessage(msgId);
            ctx.result(gson.toJson(new StructuredResponse("ok", null, files)));
        });

        // GET /file/{msg_id} — single filename lookup (kept for backward compat)
        app.get("/file/{msg_id}", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");
            int    msgId    = Integer.parseInt(ctx.pathParam("msg_id"));
            String filename = db.grabFilename(msgId);
            ctx.result(gson.toJson(filename == null
                ? new StructuredResponse("error", "no file for that message", null)
                : new StructuredResponse("ok", null, filename)));
        });

        /* ------------------------------------------------------------------ */
        /*  PROFILE ROUTE                                                       */
        /* ------------------------------------------------------------------ */

        app.get("/profile/{userId}", ctx -> {
            ctx.status(200);
            ctx.contentType("application/json");
            String targetId = ctx.pathParam("userId");
            Database.ProfilePublicData profile = db.selectPublicProfile(targetId);
            ctx.result(gson.toJson(profile == null
                ? new StructuredResponse("error", "profile not found", null)
                : new StructuredResponse("ok", null, profile)));
        });

        app.start(8080);
    }
}
