package auroWorld.backend;

import java.sql.*;
import java.util.*;

public class Database {

    /* -------------------------------------------------------------
     *                       DATA CLASSES
     * ------------------------------------------------------------- */

    public static final class MessageData {
        public final int msgId;
        public final String subject;
        public final String message;
        public final int upvote;
        public final int downvote;
        public final String uuid;
        public final String username; // FIX: added so posts can show who posted them

        public MessageData(int msgId, String subject, String message,
                           int upvote, int downvote, String uuid, String username) {
            this.msgId    = msgId;
            this.subject  = subject;
            this.message  = message;
            this.upvote   = upvote;
            this.downvote = downvote;
            this.uuid     = uuid;
            this.username = username;
        }
    }

    public static final class CommentData {
        public final int commentId;
        public final int msgId;
        public final String comment;
        public final int upvote;
        public final boolean valid;
        public final String uuid;

        public CommentData(int commentId, int msgId, String comment,
                           int upvote, boolean valid, String uuid) {
            this.commentId = commentId;
            this.msgId     = msgId;
            this.comment   = comment;
            this.upvote    = upvote;
            this.valid     = valid;
            this.uuid      = uuid;
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
            this.userId    = userId;
            this.firstName = firstName;
            this.lastName  = lastName;
            this.email     = email;
            this.note      = note;
        }
    }

    /* -------------------------------------------------------------
     *                    CONNECTION MANAGEMENT
     * ------------------------------------------------------------- */

    private final String dbUri;

    private Database(String dbUri) {
        this.dbUri = dbUri;
    }

    private Connection getConnection() throws SQLException {
        return DriverManager.getConnection(dbUri);
    }

    public boolean disconnect() {
        return true;
    }

    public static Database getDatabase(String dbUri) {
        try {
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
        String ip     = env.get("POSTGRES_IP");
        String port   = env.get("POSTGRES_PORT");
        String dbname = env.get("POSTGRES_DBNAME");
        String user   = env.get("POSTGRES_USER");
        String pass   = env.get("POSTGRES_PASS");
        if (ip != null && port != null && dbname != null && user != null && pass != null) {
            return getDatabase(ip, port, dbname, user, pass);
        }
        return null;
    }

    /* -------------------------------------------------------------
     *                         USER METHODS
     * ------------------------------------------------------------- */

    // FIX: was missing setString(1, ...) for username — caused every Google login to crash
    public int ensureUserWithEmail(String first, String last, String email) {
        String sql =
            "INSERT INTO \"users\" (\"username\", firstname, lastname, email, role) " +
            "VALUES (?, ?, ?, ?, NULL) " +
            "ON CONFLICT (\"username\") DO UPDATE SET " +
            "firstname = EXCLUDED.firstname, " +
            "lastname  = EXCLUDED.lastname, " +
            "email     = EXCLUDED.email";

        try (Connection conn = getConnection();
             PreparedStatement q = conn.prepareStatement(sql)) {
            q.setString(1, email); // use email as username for Google accounts (unique, stable)
            q.setString(2, first);
            q.setString(3, last);
            q.setString(4, email);
            return q.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    public String grabUsernameFromUuid(String uuid) {
        String sql = "SELECT username FROM users WHERE unique_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, uuid);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getString("username");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean usernameExists(String username) {
        String sql = "SELECT 1 FROM users WHERE username = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return true; // fail-safe: treat as exists to prevent duplicate attempt
        }
    }

    public boolean emailExists(String email) {
        String sql = "SELECT 1 FROM users WHERE email = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return true;
        }
    }

    public int insertNewAccount(String username, String email, String uuid) {
        String sql = "INSERT INTO users (username, firstname, lastname, email, role, note, unique_id) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            ps.setString(2, "unknown");
            ps.setString(3, "unknown");
            ps.setString(4, email);
            ps.setString(5, "user");
            ps.setString(6, "");
            ps.setString(7, uuid);
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    /* -------------------------------------------------------------
     *                       MESSAGE METHODS
     * ------------------------------------------------------------- */

    public int insertMessage(String uuid, String subject, String message) {
        String sql = "INSERT INTO messages (subject, message, upvote, downvote, unique_id) " +
                     "VALUES (?, ?, 0, 0, ?) RETURNING msg_id";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, subject);
            ps.setString(2, message);
            ps.setString(3, uuid);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("msg_id");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return -1;
    }

    // FIX: added username join so each post carries the author's username
    public ArrayList<MessageData> selectAllMessages() {
        ArrayList<MessageData> res = new ArrayList<>();
        String sql =
            "SELECT m.msg_id, m.subject, m.message, m.upvote, m.downvote, m.unique_id, " +
            "       u.username " +
            "FROM messages m " +
            "LEFT JOIN \"users\" u ON m.unique_id = u.unique_id " +
            "ORDER BY m.msg_id DESC";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                res.add(new MessageData(
                    rs.getInt("msg_id"),
                    rs.getString("subject"),
                    rs.getString("message"),
                    rs.getInt("upvote"),
                    rs.getInt("downvote"),
                    rs.getString("unique_id"),
                    rs.getString("username")
                ));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return res;
    }

    public MessageData selectMessage(int msgId) {
        String sql =
            "SELECT m.msg_id, m.subject, m.message, m.upvote, m.downvote, m.unique_id, " +
            "       u.username " +
            "FROM messages m " +
            "LEFT JOIN \"users\" u ON m.unique_id = u.unique_id " +
            "WHERE m.msg_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, msgId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return new MessageData(
                    rs.getInt("msg_id"),
                    rs.getString("subject"),
                    rs.getString("message"),
                    rs.getInt("upvote"),
                    rs.getInt("downvote"),
                    rs.getString("unique_id"),
                    rs.getString("username")
                );
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // FIX: added updatePost — was commented out / broken in original
    public int updatePost(int msgId, String subject, String message) {
        String sql = "UPDATE messages SET subject = ?, message = ? WHERE msg_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, subject);
            ps.setString(2, message);
            ps.setInt(3, msgId);
            return ps.executeUpdate(); // returns rows affected (1 on success, 0 if not found)
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    /* -------------------------------------------------------------
     *                       COMMENT METHODS
     * ------------------------------------------------------------- */

    // FIX: original param order was (msgId, comment, uuid) but callers passed (msgId, uuid, comment)
    // Canonical order is now (msgId, uuid, comment) to match App.java call site
    public int insertComment(int msgId, String uuid, String comment) {
        String sql = "INSERT INTO comments (msg_id, unique_id, comment, upvote, valid) " +
                     "VALUES (?, ?, ?, 0, true) RETURNING comment_id";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, msgId);
            ps.setString(2, uuid);
            ps.setString(3, comment);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("comment_id");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return -1;
    }

    public ArrayList<CommentData> selectComments(int msgId) {
        ArrayList<CommentData> res = new ArrayList<>();
        String sql =
            "SELECT c.comment_id, c.msg_id, c.comment, c.valid, c.upvote, c.unique_id " +
            "FROM comments c " +
            "JOIN \"users\" u ON c.unique_id = u.unique_id " +
            "WHERE c.msg_id = ? ORDER BY c.comment_id";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, msgId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    res.add(new CommentData(
                        rs.getInt("comment_id"),
                        rs.getInt("msg_id"),
                        rs.getString("comment"),
                        rs.getInt("upvote"),
                        rs.getBoolean("valid"),
                        rs.getString("unique_id")
                    ));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return res;
    }

    /* -------------------------------------------------------------
     *                        FILE METHODS
     * ------------------------------------------------------------- */

    public int insertFileToTable(String userId, String file, int msgId, String filepath) {
        String sql =
            "INSERT INTO files (filename, msg_id, filepath, unique_id) " +
            "VALUES (?, ?, ?, ?) RETURNING file_id";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, file);
            ps.setInt(2, msgId);
            ps.setString(3, filepath);
            ps.setString(4, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("file_id");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return -1;
    }

    // FIX: returns list of file records for a message (frontend was calling /messages/{id}/files)
    public ArrayList<Map<String, Object>> selectFilesForMessage(int msgId) {
        ArrayList<Map<String, Object>> res = new ArrayList<>();
        String sql = "SELECT file_id, filename, filepath FROM files WHERE msg_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, msgId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> f = new HashMap<>();
                    f.put("file_id",  rs.getInt("file_id"));
                    f.put("filename", rs.getString("filename"));
                    f.put("filepath", rs.getString("filepath"));
                    res.add(f);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return res;
    }

    public String grabFilename(int msgId) {
        String sql = "SELECT filename FROM files WHERE msg_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, msgId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getString("filename");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /* -------------------------------------------------------------
     *                       VOTING METHODS
     * ------------------------------------------------------------- */

    public int voteMessageTable(int msgId, String uniqueId, int upvote) {
        String selectSql = "SELECT upvote FROM vote_messages WHERE msg_id = ? AND unique_id = ?";
        String insertSql = "INSERT INTO vote_messages (msg_id, unique_id, upvote) VALUES (?, ?, ?)";
        String updateSql = "UPDATE vote_messages SET upvote = ? WHERE msg_id = ? AND unique_id = ?";

        try (Connection conn = getConnection()) {
            Integer oldVote = null;
            try (PreparedStatement ps = conn.prepareStatement(selectSql)) {
                ps.setInt(1, msgId);
                ps.setString(2, uniqueId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) oldVote = rs.getInt("upvote");
                }
            }

            int newVote;
            int change;
            if (oldVote == null) {
                newVote = 1; change = 1;
                try (PreparedStatement ins = conn.prepareStatement(insertSql)) {
                    ins.setInt(1, msgId);
                    ins.setString(2, uniqueId);
                    ins.setInt(3, newVote);
                    ins.executeUpdate();
                }
            } else if (oldVote == 1) {
                newVote = 0; change = -1;
                try (PreparedStatement upd = conn.prepareStatement(updateSql)) {
                    upd.setInt(1, newVote);
                    upd.setInt(2, msgId);
                    upd.setString(3, uniqueId);
                    upd.executeUpdate();
                }
            } else {
                newVote = 1; change = 1;
                try (PreparedStatement upd = conn.prepareStatement(updateSql)) {
                    upd.setInt(1, newVote);
                    upd.setInt(2, msgId);
                    upd.setString(3, uniqueId);
                    upd.executeUpdate();
                }
            }
            changeMessageUpvote(conn, msgId, change);
            return newVote;
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    private void changeMessageUpvote(Connection conn, int msgId, int change) throws SQLException {
        String selectSql = "SELECT upvote FROM messages WHERE msg_id = ?";
        String updateSql = "UPDATE messages SET upvote = ? WHERE msg_id = ?";
        int current = 0;
        try (PreparedStatement ps = conn.prepareStatement(selectSql)) {
            ps.setInt(1, msgId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) current = rs.getInt("upvote");
            }
        }
        try (PreparedStatement upd = conn.prepareStatement(updateSql)) {
            upd.setInt(1, current + change);
            upd.setInt(2, msgId);
            upd.executeUpdate();
        }
    }

    // FIX: DELETE SQL was invalid ("DELETE upvote FROM ..."), param order was swapped in UPDATE
    public int voteCommentTable(int commentId, String uniqueId, int upvote) {
        String selectSql = "SELECT upvote FROM vote_comments WHERE comment_id = ? AND unique_id = ?";
        String insertSql = "INSERT INTO vote_comments (comment_id, unique_id, upvote) VALUES (?, ?, ?)";
        String updateSql = "UPDATE vote_comments SET upvote = ? WHERE comment_id = ? AND unique_id = ?";

        try (Connection conn = getConnection()) {
            Integer oldVote = null;
            try (PreparedStatement ps = conn.prepareStatement(selectSql)) {
                ps.setInt(1, commentId);
                ps.setString(2, uniqueId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) oldVote = rs.getInt("upvote");
                }
            }

            int newVote;
            int change;
            if (oldVote == null) {
                newVote = 1; change = 1;
                try (PreparedStatement ins = conn.prepareStatement(insertSql)) {
                    ins.setInt(1, commentId);
                    ins.setString(2, uniqueId);
                    ins.setInt(3, newVote);
                    ins.executeUpdate();
                }
            } else if (oldVote == 1) {
                newVote = 0; change = -1;
                try (PreparedStatement upd = conn.prepareStatement(updateSql)) {
                    upd.setInt(1, newVote);       // FIX: was setting commentId here by mistake
                    upd.setInt(2, commentId);
                    upd.setString(3, uniqueId);
                    upd.executeUpdate();
                }
            } else {
                newVote = 1; change = 1;
                try (PreparedStatement upd = conn.prepareStatement(updateSql)) {
                    upd.setInt(1, newVote);
                    upd.setInt(2, commentId);
                    upd.setString(3, uniqueId);
                    upd.executeUpdate();
                }
            }
            changeCommentUpvote(conn, commentId, change);
            return newVote;
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    private void changeCommentUpvote(Connection conn, int commentId, int change) throws SQLException {
        String selectSql = "SELECT upvote FROM comments WHERE comment_id = ?";
        String updateSql = "UPDATE comments SET upvote = ? WHERE comment_id = ?";
        int current = 0;
        try (PreparedStatement ps = conn.prepareStatement(selectSql)) {
            ps.setInt(1, commentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) current = rs.getInt("upvote");
            }
        }
        try (PreparedStatement upd = conn.prepareStatement(updateSql)) {
            upd.setInt(1, current + change);
            upd.setInt(2, commentId);
            upd.executeUpdate();
        }
    }

    /* -------------------------------------------------------------
     *                       PROFILE METHODS
     * ------------------------------------------------------------- */

    public ProfilePublicData selectPublicProfile(String userId) {
        String sql =
            "SELECT \"username\", firstname, lastname, email, note " +
            "FROM \"users\" WHERE \"username\" = ?";
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
        }
        return null;
    }
}
