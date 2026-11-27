
const pool = require("../config/db");

// Allowed reading slots
const VALID_SLOTS = [
    "morning",
    "after_breakfast",
    "after_lunch",
    "after_dinner"
];

// Validate date format and ensure it is not in the future
const isValidDate = (date) => {
    if (typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsed = new Date(`${date}T00:00:00`);

    if (
        Number.isNaN(parsed.getTime()) ||
        parsed.getFullYear() !== Number(date.slice(0, 4)) ||
        parsed.getMonth() + 1 !== Number(date.slice(5, 7)) ||
        parsed.getDate() !== Number(date.slice(8, 10))
    ) {
        return false;
    }

    const today = new Date();
    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    return date <= todayString;
};


// ADD READING
const addReading = async (req, res) => {
    try {
        const { reading_date, time_slot, glucose_value } = req.body;

        const userId = req.user.userId;

        // Required value
        if (
            glucose_value === undefined ||
            glucose_value === null ||
            glucose_value === ""
        ) {
            return res.status(400).json({
                message: "Please enter a glucose value."
            });
        }

        // Whole number between 40 and 600
        if (
            !Number.isInteger(Number(glucose_value)) ||
            Number(glucose_value) < 40 ||
            Number(glucose_value) > 600
        ) {
            return res.status(400).json({
                message: "Value must be between 40 and 600 mg/dl."
            });
        }

        // Validate date
        if (!isValidDate(reading_date)) {
            return res.status(400).json({
                message: "Date cannot be in the future."
            });
        }

        // Validate time slot
        if (!VALID_SLOTS.includes(time_slot)) {
            return res.status(400).json({
                message: "Please select a valid time slot."
            });
        }

        // Check existing readings for this date
        const existing = await pool.query(
            `SELECT time_slot
             FROM readings
             WHERE user_id = $1 AND reading_date = $2`,
            [userId, reading_date]
        );

        // Check maximum four readings
        if (existing.rows.length >= 4) {
            return res.status(400).json({
                message: "You can add only 4 readings per day."
            });
        }

        // Check duplicate time slot
        const duplicate = existing.rows.find(
            (reading) => reading.time_slot === time_slot
        );

        if (duplicate) {
            const slotName = {
                morning: "Morning",
                after_breakfast: "After breakfast",
                after_lunch: "After lunch",
                after_dinner: "After dinner"
            };

            return res.status(409).json({
                message: `You already have an ${slotName[time_slot]} reading for this date.`
            });
        }

        // Insert reading
        const result = await pool.query(
            `INSERT INTO readings
             (user_id, reading_date, time_slot, glucose_value)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [userId, reading_date, time_slot, Number(glucose_value)]
        );

        return res.status(201).json({
            message: "Glucose reading added successfully.",
            reading: result.rows[0]
        });

    } catch (error) {
        console.error("Add reading error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};

// GET ALL READINGS
const getReadings = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT id, reading_date, time_slot,
                    glucose_value, created_at
             FROM readings
             WHERE user_id = $1
             ORDER BY reading_date DESC, id DESC`,
            [userId]
        );

        return res.status(200).json({
            count: result.rows.length,
            readings: result.rows
        });

    } catch (error) {
        console.error("Get readings error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};




// UPDATE READING
const updateReading = async (req, res) => {
    try {
        const { id } = req.params;

        const { reading_date, time_slot, glucose_value } = req.body;

        const userId = req.user.userId;

        // Validate glucose value
        if (
            glucose_value === undefined ||
            glucose_value === null ||
            glucose_value === ""
        ) {
            return res.status(400).json({
                message: "Please enter a glucose value."
            });
        }

        if (
            !Number.isInteger(Number(glucose_value)) ||
            Number(glucose_value) < 40 ||
            Number(glucose_value) > 600
        ) {
            return res.status(400).json({
                message: "Value must be between 40 and 600 mg/dl."
            });
        }

        if (!isValidDate(reading_date)) {
            return res.status(400).json({
                message: "Date cannot be in the future."
            });
        }

        if (!VALID_SLOTS.includes(time_slot)) {
            return res.status(400).json({
                message: "Please select a valid time slot."
            });
        }

        // Check whether reading belongs to logged-in user
        const existing = await pool.query(
            `SELECT id FROM readings
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                message: "Reading not found."
            });
        }

        // Update reading
        const result = await pool.query(
            `UPDATE readings
             SET reading_date = $1,
                 time_slot = $2,
                 glucose_value = $3
             WHERE id = $4 AND user_id = $5
             RETURNING *`,
            [reading_date, time_slot, Number(glucose_value), id, userId]
        );

        return res.status(200).json({
            message: "Reading updated successfully.",
            reading: result.rows[0]
        });

    } catch (error) {
        console.error("Update reading error:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "A reading already exists for this time slot and date."
            });
        }

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};


// DELETE READING
const deleteReading = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            `DELETE FROM readings
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Reading not found."
            });
        }

        return res.status(200).json({
            message: "Reading deleted successfully."
        });

    } catch (error) {
        console.error("Delete reading error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};

module.exports = {
    addReading,
    getReadings,
    updateReading,
    deleteReading
};