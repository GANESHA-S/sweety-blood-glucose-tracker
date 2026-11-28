
const pool = require("../config/db");

// Validate date format

const isValidDate = (date) => {
    if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
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



// Calculate report statistics
const calculateStats = async (userId, startDate, endDate) => {

    const result = await pool.query(
        `SELECT
            MAX(glucose_value) AS highest,
            MIN(glucose_value) AS lowest,
            ROUND(AVG(glucose_value), 1) AS average,
            COUNT(*) AS total_readings
         FROM readings
         WHERE user_id = $1
         AND reading_date >= $2
         AND reading_date <= $3`,
        [userId, startDate, endDate]
    );

    const stats = result.rows[0];

    return {
        highest: stats.highest === null ? null : Number(stats.highest),
        lowest: stats.lowest === null ? null : Number(stats.lowest),
        average: stats.average === null ? null : Number(stats.average),
        total_readings: Number(stats.total_readings)
    };
};


const getDailyReport = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { date } = req.query;

        if (!isValidDate(date)) {
            return res.status(400).json({
                message: "Please provide a valid date that is not in the future."
            });
        }

        const stats = await calculateStats(userId, date, date);

        // Fetch individual readings
        const result = await pool.query(
            `SELECT id,
                TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                time_slot,
                glucose_value
             FROM readings
             WHERE user_id = $1
             AND reading_date = $2
             ORDER BY
                CASE time_slot
                    WHEN 'morning' THEN 1
                    WHEN 'after_breakfast' THEN 2
                    WHEN 'after_lunch' THEN 3
                    WHEN 'after_dinner' THEN 4
                END`,
            [userId, date]
        );

        return res.status(200).json({
            report_type: "daily",
            date,
            ...stats,
            readings: result.rows
        });

    } catch (error) {
        console.error("Daily report error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};


const getMonthToDateReport = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { date } = req.query;

        if (!isValidDate(date)) {
            return res.status(400).json({
                message: "Please provide a valid date that is not in the future."
            });
        }

        // First day of selected month
        const startDate = `${date.slice(0, 7)}-01`;

        const stats = await calculateStats(
            userId,
            startDate,
            date
        );

        return res.status(200).json({
            report_type: "month_to_date",
            start_date: startDate,
            end_date: date,
            ...stats
        });

    } catch (error) {
        console.error("Month-to-date report error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};


const getMonthlyReport = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { date } = req.query;

        if (!isValidDate(date)) {
            return res.status(400).json({
                message: "Please provide a valid date that is not in the future."
            });
        }

        const selectedDate = new Date(`${date}T00:00:00`);

        // First day of previous month
        const previousMonthStart = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() - 1,
            1
        );

        // Last day of previous month
        const previousMonthEnd = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            0
        );

        const formatDate = (value) => {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, "0");
            const day = String(value.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        const startDate = formatDate(previousMonthStart);
        const endDate = formatDate(previousMonthEnd);

        const stats = await calculateStats(
            userId,
            startDate,
            endDate
        );

        return res.status(200).json({
            report_type: "monthly",
            start_date: startDate,
            end_date: endDate,
            ...stats
        });

    } catch (error) {
        console.error("Monthly report error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};


module.exports = {
    getDailyReport,
    getMonthToDateReport,
    getMonthlyReport
};