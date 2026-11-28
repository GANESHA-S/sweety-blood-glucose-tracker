
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    getDailyReport,
    getMonthToDateReport,
    getMonthlyReport
} from "../services/reportService";

const getToday = () => {
    const today = new Date();

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");
};

function Reports() {
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [reportType, setReportType] = useState("daily");

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchReport = async () => {
            if (!selectedDate) return;

            setLoading(true);
            setError("");
            setReport(null);

            try {
                let data;

                if (reportType === "daily") {
                    data = await getDailyReport(selectedDate);
                } else if (reportType === "month-to-date") {
                    data = await getMonthToDateReport(selectedDate);
                } else {
                    data = await getMonthlyReport(selectedDate);
                }

                setReport(data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load report. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [reportType, selectedDate]);

    const formatDate = (date) => {
        if (!date) return "-";

        const [year, month, day] = date.split("-");
        return `${day}-${month}-${year}`;
    };

    const formatSlot = (slot) => {
        const labels = {
            morning: "Morning",
            after_breakfast: "After Breakfast",
            after_lunch: "After Lunch",
            after_dinner: "After Dinner"
        };

        return labels[slot] || slot;
    };

    return (
        <div>
            <h1>Glucose Reports</h1>

            <Link to="/dashboard">
                Back to Dashboard
            </Link>

            <hr />

            <h3>Select Report Type</h3>

            <button
                onClick={() => setReportType("daily")}
            >
                Daily Report
            </button>

            <button
                onClick={() => setReportType("month-to-date")}
            >
                Month-to-Date
            </button>

            <button
                onClick={() => setReportType("monthly")}
            >
                Previous Month
            </button>

            <div>
                <label htmlFor="reportDate">
                    Select Date:
                </label>

                <input
                    id="reportDate"
                    type="date"
                    value={selectedDate}
                    max={getToday()}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
            </div>

            <hr />

            {loading && <p>Loading report...</p>}

            {error && <p style={{ color: "red" }}>{error}</p>}

            {report && !loading && (
                <div>
                    <h2>
                        {reportType === "daily"
                            ? "Daily Report"
                            : reportType === "month-to-date"
                            ? "Month-to-Date Report"
                            : "Previous Month Report"}
                    </h2>

                    {reportType === "daily" ? (
                        <p>Date: {formatDate(report.date)}</p>
                    ) : (
                        <p>
                            Period: {formatDate(report.start_date)}
                            {" "}to{" "}
                            {formatDate(report.end_date)}
                        </p>
                    )}

                    <h3>Summary</h3>

                    <p>
                        Highest Reading: {report.highest ?? "N/A"}
                    </p>

                    <p>
                        Lowest Reading: {report.lowest ?? "N/A"}
                    </p>

                    <p>
                        Average Reading: {report.average ?? "N/A"}
                    </p>

                    <p>
                        Total Readings: {report.total_readings}
                    </p>

                    {reportType === "daily" && (
                        <>
                            <h3>Individual Readings</h3>

                            {(report.readings || []).length === 0 ? (
                                <p>No readings found for this date.</p>
                                    ) : (
                                    <table border="1" cellPadding="10">
                                    <thead>
                                        <tr>
                                            <th>Time Slot</th>
                                            <th>Glucose Value</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {report.readings.map((reading) => (
                                            <tr key={reading.id}>
                                                <td>
                                                    {formatSlot(reading.time_slot)}
                                                </td>

                                                <td>
                                                    {reading.glucose_value}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default Reports;
