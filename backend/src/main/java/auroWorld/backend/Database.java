package auroworld.backend;


import java.sql.*;
import java.util.*;

public class Database{
    //database class attributes and constructor
    private final String dbUri;

    private Database(String dbUri) {
        this.dbUri = dbUri;
    }
    private Connection getConnection() throws SQLException {
        return DriverManager.getConnection(dbUri);
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

}