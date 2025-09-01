
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography } from '@mui/material'; // ✅ Import MUI components


const YearUpdateForm = () => {
  const [years, setYears] = useState([]);

  const fetchYears = async () => {
    try {
      const res = await axios.get("http://localhost:5000/year_table");
      setYears(res.data);
    } catch (error) {
      console.error("Error fetching years:", error);
    }
  };

  const toggleActivator = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 0 ? 1 : 0;

      await axios.put(`http://localhost:5000/year_table/${id}`, {
        status: newStatus,
      });

      fetchYears(); // Refresh after update
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  return (
  <Box sx={{ maxWidth: 1200, mx: "auto", mt: 3, px: 2 }}>
      <Typography
        variant="h4"
        align="center"
        fontWeight="bold"
        sx={{ color: "#800000", mb: 2}}
      >
        Year Update Form
      </Typography>

      <div className="max-w-2xl mx-auto" style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'scroll'}}>
        <table className="w-full border-collapse shadow-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border text-left text-gray-600">Year</th>
              <th className="p-3 border text-left text-gray-600">Status</th>
              <th className="p-3 border text-left text-gray-600">Activator</th>
            </tr>
          </thead>
          <tbody>
            {years.map((entry) => (
              <tr key={entry.year_id} className="hover:bg-gray-50">
                <td className="p-3 border">{entry.year_description}</td>
                <td className="p-3 border">
                  {entry.status === 1 ? "Active" : "Inactive"}
                </td>
                <td className="p-3 border flex justify-center items-center">
                  <button
                    onClick={() => toggleActivator(entry.year_id, entry.status)}
                    className={`px-4 py-2 rounded-lg font-semibold text-white transition-all ${
                      entry.status === 1 ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {entry.status === 1 ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
   </Box>
  );
};

export default YearUpdateForm;
