import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Typography,
} from '@mui/material';

const RequirementsForm = () => {
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState([]);

  // Fetch all requirements
  const fetchRequirements = async () => {
    try {
      const res = await axios.get("http://localhost:5000/requirements");
      setRequirements(res.data);
    } catch (err) {
      console.error("Error fetching requirements:", err);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  // Handle submission of a new requirement
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      await axios.post("http://localhost:5000/requirements", {
        requirements_description: description,
      });
      setDescription("");
      fetchRequirements();
    } catch (err) {
      console.error("Error saving requirement:", err);
    }
  };

  // Handle deletion of a requirement
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/requirements_table/${id}`);
      fetchRequirements(); // Refresh list
    } catch (err) {
      console.error("Error deleting requirement:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <Typography variant="h4" color="maroon" fontWeight="bold" textAlign="center" gutterBottom>
        Manage Requirements
      </Typography>

      <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8">
        {/* Left Side - Form */}
        <div className="md:w-1/2 bg-gray-50 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-black mb-4">
            Add a New Requirement
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter requirement description"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full py-3 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-300"
              style={{ backgroundColor: '#800000' }}
            >
              Save Requirement
            </button>

          </form>
        </div>

        {/* Right Side - Display Saved Requirements */}
        <div className="md:w-1/2 bg-gray-50 p-6 rounded-lg shadow-sm max-h-96 overflow-y-auto">
          <h3 className="text-xl font-semibold text-black-700 mb-4">
            Saved Requirements
          </h3>
          <ul className="space-y-2">
            {requirements.map((req) => (
              <li
                key={req.id}
                className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm flex justify-between items-center"
              >
                <span className="text-gray-800">{req.description}</span>
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={() => handleDelete(req.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RequirementsForm;