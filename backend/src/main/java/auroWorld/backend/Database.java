package auroWorld.backend;


import java.sql.*;
import java.util.*;

public class Database{

    /* -------------------------------------------------------------
     *                       DATA CLASSES
     * ------------------------------------------------------------- */
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

    public static final class CommentData {
        public final int commentId;
        public final int msgId;
        public final String userId;
        public final String comment;
        //public final int upvote;
        //public final int downvote;
        //public final Timestamp createdAt;
        public final boolean valid;

        //public final String userFirst;
       // public final String userLast;

        public CommentData(int commentId, int msgId, String userId, String comment, boolean valid){
                           //int upvote, int downvote, Timestamp createdAt, boolean valid,
                           //String userFirst, String userLast) {
            this.commentId = commentId;
            this.msgId = msgId;
            this.userId = userId;
            this.comment = comment;
            //this.upvote = upvote;
            //this.downvote = downvote;
            //this.createdAt = createdAt;
            this.valid = valid;
            //this.userFirst = userFirst;
            //this.userLast = userLast;
        }
    }

    public static final class ProfilePublicData {
        public final String userId;
        public final String firstName;
        public final String lastName;
        public final String email;
        public final String note;

        public ProfilePublicData(String userId, String firstName, String lastName,
                                 String email, String note) {
            this.userId = userId;
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.note = note;
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
                "INSERT INTO \"users\" (\"username\", firstname, lastname, email, role) " +
                "VALUES (?, ?, ?, ?, NULL) " +
                "ON CONFLICT (\"username\") DO UPDATE SET " +
                "firstname = EXCLUDED.firstname, " +
                "lastname = EXCLUDED.lastname, " +
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

    public MessageData selectMessage(int msg_Id) {
        String sql =
            "SELECT m.msg_id, m.\"username\", m.subject, m.message, " +
            "       m.upvote, m.downvote, " +
            "       u.firstname, u.lastname " +
            "FROM messages m " +
            "LEFT JOIN \"users\" u ON m.\"username\" = u.\"username\" " +
            "WHERE m.msg_id=?";

        try (Connection conn = getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, msg_Id);

            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;

                return new MessageData(
                        rs.getInt("msg_id"),
                        rs.getString("username"),
                        rs.getString("subject"),
                        rs.getString("message"),
                        rs.getInt("upvote"),
                        rs.getInt("downvote")
                        //rs.getTimestamp("created_at"),
                        //rs.getBoolean("valid"),
                        //rs.getString("first_name"),
                        //rs.getString("last_name")
                );
            }

        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
    }

    // insert a new message, return msg_id 
    public int insertMessage(String userId, String subject, String message) {
        String sql =
                "INSERT INTO messages (username, subject, message, upvote, downvote) " +
                "VALUES (?, ?, ?, 0, 0) " +
                "RETURNING msg_id";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, userId);
            ps.setString(2, subject);
            ps.setString(3, message);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("msg_id");
                return -1;
            }

        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    public int insertFile(String userId, String file, int msgId){
        String sql=
            "INSERT INTO files (username, filename, msg_id) "+
            "VALUES (?, ?, ?)" +
            "RETURNING file_id";
        try(Connection conn = getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)){
                ps.setString(1,userId);
                ps.setString(2,file);
                ps.setInt(3,msgId);
            
            try (ResultSet rs = ps.executeQuery()){
                if (rs.next()) return rs.getInt("file_id");
                return -1;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
        
    }

    public int voteMessageTable(int msgId,String username, int upvote){
        Integer oldVote=null;
        int newVote=-1;
        int change=0;
        String text="";

        // String selectSql = "SELECT vote FROM votes WHERE \"userID\"=? AND message_id=?";
        // String deleteSql = "DELETE FROM votes WHERE \"userID\"=? AND message_id=?";
        // String insertSql = "INSERT INTO votes (\"userID\", message_id, vote) VALUES (?, ?, ?)";
        // String updateSql = "UPDATE votes SET vote=? WHERE \"userID\"=? AND message_id=?";
        String selectUpvoteSql="SELECT upvote FROM vote_messages WHERE msg_id=? AND \"username\"=?";
        String deleteUpvoteSql="DELETE upvote FROM vote_messages WHERE msg_id=? AND \"username\"=?";
        String insertUpvoteSql = "INSERT INTO vote_messages (msg_id, \"username\", upvote) VALUES (?, ?, ?)";
        String updateUpvoteSql = "UPDATE vote_messages SET upvote=? WHERE msg_id=? AND \"username\"=?";

        try(Connection conn = getConnection()){
            try (PreparedStatement ps = conn.prepareStatement(selectUpvoteSql)){
                ps.setInt(1,msgId);
                ps.setString(2,username);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        oldVote = rs.getInt("upvote");
                    }
                }
                System.out.println(ps);
            }
            if (oldVote==null){
                text="Inserting upvote.";
                newVote=1;
                try(PreparedStatement ins=conn.prepareStatement(insertUpvoteSql)){
                    ins.setInt(1,msgId);
                    ins.setString(2,username);
                    ins.setInt(3,newVote);
                    ins.executeUpdate();
                }
                System.out.println("Successfully inserted upvote");
                change=1;
            }
            else if (oldVote==1){
                newVote=0;
                text="Updating upvote takeback";

                try(PreparedStatement upd = conn.prepareStatement(updateUpvoteSql)){
                    upd.setInt(1,newVote);
                    System.out.println(upd);
                    upd.setInt(2,msgId);
                    System.out.println(upd);
                    upd.setString(3,username);
                    System.out.println(upd);
                    upd.executeUpdate();
                }
                System.out.println("Successfully took back your upvote");
                change=-1;
            }
            else if (oldVote==0){
                text="Updating upvote regive";
                newVote=1;
                try(PreparedStatement upd = conn.prepareStatement(updateUpvoteSql)){
                    upd.setInt(1,newVote);
                    System.out.println(upd);
                    upd.setInt(2,msgId);
                    System.out.println(upd);
                    upd.setString(3,username);
                    System.out.println(upd);
                    upd.executeUpdate();
                }
                System.out.println("Successfully regave your upvote");
                change=1;
            }
            changeMessageUpvote(conn, msgId,change);
            return newVote;

        } catch (SQLException e) {
            System.out.println(text);
            e.printStackTrace();
            return -1;
        }

    }

    private void changeMessageUpvote(Connection conn, int msgId, int change) throws SQLException{
        System.out.println("modifying upvotes for post "+msgId);
        int newUpvotes=0;
        String selectUpvote = "SELECT upvote FROM messages WHERE msg_id=?";
        String updateUpvote="UPDATE messages SET upvote=? WHERE msg_id=?";

        try( PreparedStatement ps=conn.prepareStatement(selectUpvote)){
            ps.setInt(1,msgId);
            System.out.println(ps);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int currentUpvotes = rs.getInt("upvote");
                    newUpvotes= currentUpvotes + change;
                    System.out.println("Change ="+change);
                    System.out.println("currentUpvotes = "+currentUpvotes);
                    System.out.println("newUpvotes="+newUpvotes);
                }
            }
        }
        try(PreparedStatement upd=conn.prepareStatement(updateUpvote)){
            System.out.println("preparing to update upvote in messages table");
            upd.setInt(1,newUpvotes);
            System.out.println(upd);
            upd.setInt(2,msgId);
            System.out.println(upd);
            upd.executeUpdate();
            System.out.println("successfully updated upvote for messages table");
        }
    }

    //insert a new comment and return comment_id
    public int insertComment(int msgId, String userId, String comment) {
        String sql =
            "INSERT INTO comments (msg_id, username, comment, valid) " +
            "VALUES (?, ?, ?, true) RETURNING comment_id";

        try (Connection conn = getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, msgId);
            ps.setString(2, userId);
            ps.setString(3, comment);

            try (ResultSet rs = ps.executeQuery()) {
                System.out.println(rs);
                if (rs.next()) return rs.getInt("comment_id");
                return -1;
            }

        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }


    public ArrayList<CommentData> selectComments(int msgId) {
        ArrayList<CommentData> res = new ArrayList<>();

        String sql =
            "SELECT c.comment_id, c.msg_id, c.\"username\", c.comment,c.valid " +
            //"       c.created_at,  u.first_name, u.last_name " +
            "FROM comments c " +
            "JOIN \"users\" u ON c.\"username\" = u.\"username\" " +
            "WHERE c.msg_id=? ORDER BY c.comment_id";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, msgId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    res.add(new CommentData(
                            rs.getInt("comment_id"),
                            rs.getInt("msg_id"),
                            rs.getString("username"),
                            rs.getString("comment"),
                            //0, // upvote placeholder
                            //0, // downvote placeholder
                            //rs.getTimestamp("created_at"),
                            rs.getBoolean("valid")
                            //rs.getString("first_name"),
                            //rs.getString("last_name")
                    ));
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return res;
    }

    public ProfilePublicData selectPublicProfile(String userId) {
        String sql =
                "SELECT \"username\", firstname, lastname, email, note " +
                "FROM \"users\" WHERE \"username\"=?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, userId);

            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;

                return new ProfilePublicData(
                        rs.getString("username"),
                        rs.getString("firstname"),
                        rs.getString("lastname"),
                        rs.getString("email"),
                        rs.getString("note")
                );
            }

        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
    }

    
}