const authRoutes = require("./routes/authRoutes");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

// Test API
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to Sweety API!"
    });
});

// Start server after database connection succeeds
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await pool.query("SELECT NOW()");

        console.log("PostgreSQL connected successfully!");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};

startServer();
