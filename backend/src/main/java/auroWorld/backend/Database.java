package auroworld.backend;


import java.sql.*;
import java.util.*;

public class Database{
    //message class
    public static final class MessageData {
        public final int msgId;
        public final String username;
        public final String subject;
        public final String message;
        public final int upvote;
        public final int downvote;

        // NEW: author name fields
        // public final String firstName;
        // public final String lastName;

        public MessageData(int msgId, String username, String subject, String message,
                        int upvote, int downvote) {
            this.msgId = msgId;
            this.username = username;
            this.subject = subject;
            this.message = message;
            this.upvote = upvote;
            this.downvote = downvote;
            // this.createdAt = createdAt;
            // this.valid = valid;
            // this.firstName = firstName;
            // this.lastName = lastName;
        }
    }

    //database class attributes and constructor + helper methods
    private final String dbUri;

    private Database(String dbUri) {
        this.dbUri = dbUri;
    }
    private Connection getConnection() throws SQLException {
        return DriverManager.getConnection(dbUri);
    }
    public boolean disconnect() {
        // Nothing to close; each method closes its own connection
        return true;
    }
    //overloaded methods for getDatabase
    public static Database getDatabase(String dbUri) {
        try {
            // Optional: test initial connection so we fail fast if URI is bad
            try (Connection conn = DriverManager.getConnection(dbUri)) {
                System.out.println("Database: initial connection OK");
            }
            return new Database(dbUri);
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
    }

    public static Database getDatabase(String ip, String port, String dbname, String user, String pass) {
        String uri = "jdbc:postgresql://" + ip + ":" + port + "/" + dbname +
                     "?user=" + user + "&password=" + pass;
        return getDatabase(uri);
    }

    public static Database getDatabase() {
        Map<String, String> env = System.getenv();

        String dbUri = env.get("DATABASE_URI");
        if (dbUri != null && !dbUri.isEmpty()) {
            return getDatabase(dbUri);
        }

        String ip = env.get("POSTGRES_IP");
        String port = env.get("POSTGRES_PORT");
        String dbname = env.get("POSTGRES_DBNAME");
        String user = env.get("POSTGRES_USER");
        String pass = env.get("POSTGRES_PASS");

        if (ip != null && port != null && dbname != null &&
            user != null && pass != null) {
            return getDatabase(ip, port, dbname, user, pass);
        }

        return null;
    }

    public int ensureUserWithEmail(String username, String first, String last, String email) {
        String sql =
                "INSERT INTO \"Users\" (\"username\", first_name, last_name, email, role) " +
                "VALUES (?, ?, ?, ?, NOW(), true) " +
                "ON CONFLICT (\"userID\") DO UPDATE SET " +
                "first_name = EXCLUDED.first_name, " +
                "last_name = EXCLUDED.last_name, " +
                "email = EXCLUDED.email";

        try (Connection conn = getConnection();
             PreparedStatement q = conn.prepareStatement(sql)) {

            q.setString(1, username);
            q.setString(2, first);
            q.setString(3, last);
            q.setString(4, email);
            return q.executeUpdate();

        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    public ArrayList<MessageData> selectAllMessages() {
        ArrayList<MessageData> res = new ArrayList<>();

        String sql =
            "SELECT msg_id, username, subject, message, upvote, downvote " +
            "FROM messages " +
            "ORDER BY msg_id";
            // "SELECT m.msg_id, m.\"username\", m.subject, m.message, " +
            // "       m.upvote, m.downvote " +
            // "FROM messages m " + 
            // "LEFT JOIN \"Users\" u ON m.\"username\" = u.\"username\" " +
            // "ORDER BY m.msg_id";

        try (Connection conn = getConnection();
            PreparedStatement ps = conn.prepareStatement(sql);
            ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                res.add(new MessageData(
                        rs.getInt("msg_id"),
                        rs.getString("username"),
                        rs.getString("subject"),
                        rs.getString("message"),
                        rs.getInt("upvote"),
                        rs.getInt("downvote")
                        // rs.getString("first_name"),   // may be null if somehow missing
                        // rs.getString("last_name")
                ));
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return res;
    }


}