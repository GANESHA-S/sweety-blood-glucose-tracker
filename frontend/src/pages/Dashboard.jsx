
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getReadings,
  addReading,
  updateReading,
  deleteReading
} from "../services/readingService";

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const initialFormData = {
  reading_date: getToday(),
  time_slot: "morning",
  glucose_value: ""
};

const slotLabels = {
  morning: "Morning",
  after_breakfast: "After Breakfast",
  after_lunch: "After Lunch",
  after_dinner: "After Dinner"
};

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const [readings, setReadings] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchReadings();
  }, []);

  // Fetch readings
  const fetchReadings = async () => {
    try {
      setError("");

      const data = await getReadings();

      setReadings(data.readings || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to fetch readings."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({ ...initialFormData });
    setEditingId(null);
  };

  // Add or update reading
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = {
        ...formData,
        glucose_value: Number(formData.glucose_value)
      };

      let data;

      if (editingId !== null) {
        data = await updateReading(editingId, payload);
      } else {
        data = await addReading(payload);
      }

      setSuccess(data.message);

      resetForm();

      await fetchReadings();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to save reading."
      );
    } finally {
      setSaving(false);
    }
  };

  // Load reading into form for editing
  const handleEdit = (reading) => {
    setEditingId(reading.id);

    setFormData({
      reading_date: reading.reading_date.split("T")[0],
      time_slot: reading.time_slot,
      glucose_value: reading.glucose_value
    });

    setError("");
    setSuccess("");
  };

  // Delete reading
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reading?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const data = await deleteReading(id);

      setSuccess(data.message);

      if (editingId === id) {
        resetForm();
      }

      await fetchReadings();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to delete reading."
      );
    }
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div>
      <h1>Sweety Dashboard</h1>
      <button onClick={handleLogout}>
        Logout
      </button>
      <p>Welcome to your Blood Glucose Tracker.</p>

      <div>
        <Link to="/reports">View Reports</Link>
      </div>

      <br />

      {error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

      {success && (
        <p style={{ color: "green" }}>{success}</p>
      )}

      <hr />

      <h2>
        {editingId !== null
          ? "Edit Glucose Reading"
          : "Add Glucose Reading"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Reading Date</label>

          <input
            type="date"
            name="reading_date"
            value={formData.reading_date}
            onChange={handleChange}
            max={getToday()}
            required
          />
        </div>

        <br />

        <div>
          <label>Time Slot</label>

          <select
            name="time_slot"
            value={formData.time_slot}
            onChange={handleChange}
            required
          >
            <option value="morning">Morning</option>
            <option value="after_breakfast">
              After Breakfast
            </option>
            <option value="after_lunch">
              After Lunch
            </option>
            <option value="after_dinner">
              After Dinner
            </option>
          </select>
        </div>

        <br />

        <div>
          <label>Glucose Value (mg/dL)</label>

          <input
            type="number"
            name="glucose_value"
            value={formData.glucose_value}
            onChange={handleChange}
            min="40"
            max="600"
            step="1"
            placeholder="Enter glucose value"
            required
          />
        </div>

        <br />

        <button type="submit" disabled={saving}>
          {saving
            ? "Saving..."
            : editingId !== null
              ? "Update Reading"
              : "Add Reading"}
        </button>

        {editingId !== null && (
          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
          >
            Cancel
          </button>
        )}
      </form>

      <hr />

      <h2>Your Glucose Readings</h2>

      <p>Total readings: {readings.length}</p>

      {readings.length === 0 ? (
        <p>No glucose readings found. Add your first reading!</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time Slot</th>
              <th>Glucose Value (mg/dL)</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {readings.map((reading) => (
              <tr key={reading.id}>
                <td>
                  {String(reading.reading_date).split("T")[0]}
                </td>

                <td>
                  {slotLabels[reading.time_slot] || reading.time_slot}
                </td>

                <td>{reading.glucose_value}</td>

                <td>
                  <button
                    onClick={() => handleEdit(reading)}
                  >
                    Edit
                  </button>

                  {" "}

                  <button
                    onClick={() => handleDelete(reading.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;
