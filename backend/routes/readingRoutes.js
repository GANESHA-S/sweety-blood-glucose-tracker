
const express = require("express");

const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const {
    addReading,
    getReadings,
    updateReading,
    deleteReading
} = require("../controllers/readingController");

// All reading routes require authentication
router.use(authenticateToken);

router.post("/", addReading);

router.get("/", getReadings);

router.put("/:id", updateReading);

router.delete("/:id", deleteReading);

module.exports = router;
