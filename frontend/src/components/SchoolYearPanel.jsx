import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography } from "@mui/material";

const SchoolYearPanel = () => {
  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [schoolYears, setSchoolYears] = useState([]);

  useEffect(() => {
    fetchYears();
    fetchSemesters();
    fetchSchoolYears();
  }, []);

  const fetchYears = async () => {
    try {
      const res = await axios.get("http://localhost:5000/year_table");
      setYears(res.data);
    } catch (error) {
      console.error("Error fetching years:", error);
    }
  };

  const fetchSemesters = async () => {
    try {
      const res = await axios.get("http://localhost:5000/get_semester");
      setSemesters(res.data);
    } catch (error) {
      console.error("Error fetching semesters:", error);
    }
  };

  const fetchSchoolYears = async () => {
    try {
      const res = await axios.get("http://localhost:5000/school_years");
      setSchoolYears(res.data);
    } catch (error) {
      console.error("Error fetching school years:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedYear || !selectedSemester) return;

    try {
      await axios.post("http://localhost:5000/school_years", {
        year_id: selectedYear,
        semester_id: selectedSemester,
        activator: 0,
      });
      setSelectedYear("");
      setSelectedSemester("");
      fetchSchoolYears();
    } catch (error) {
      console.error("Error saving school year:", error);
    }
  };

  const formatYearRange = (year) => {
    const start = parseInt(year.year_description);
    return `${start}-${start + 1}`;
  };

  const getStatus = (activatorValue) => {
    return activatorValue === 1 ? "Active" : "Inactive";
  };

  return (
    <Box sx={{ maxWidth: "1200px", mx: "auto", mt: 5, px: 2 }}>
      <Typography variant="h4" color="maroon" fontWeight="bold" textAlign="center" gutterBottom>
        School Year Panel
      </Typography>

      <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {/* Left Container: Form */}
        <Box sx={{
          flex: 1,
          p: 3,
          bgcolor: "#fff",
          boxShadow: 2,
          borderRadius: 2,
          minWidth: "300px"
        }}>
          <Typography variant="h6" mb={2}>
            Add New School Year
          </Typography>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="block font-semibold mb-1">Year Level</label>
              <select
                className="border p-2 w-full rounded"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">-- Select Year Level --</option>
                {years.map((year) => (
                  <option key={year.year_id} value={year.year_id}>
                    {formatYearRange(year)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Semester</label>
              <select
                className="border p-2 w-full rounded"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="">-- Select Semester --</option>
                {semesters.map((semester) => (
                  <option key={semester.semester_id} value={semester.semester_id}>
                    {semester.semester_description}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded"
            >
              Save
            </button>

          </form>
        </Box>

        {/* Right Container: Table */}
        <Box sx={{
          flex: 1,
          p: 3,
          bgcolor: "#fff",
          boxShadow: 2,
          borderRadius: 2,
          minWidth: "300px"
        }}>
          <Typography variant="h6" mb={2}>
            Saved School Years
          </Typography>
          <Box sx={{ maxHeight: 350, overflowY: "auto" }}>
            <table className="w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">Year Level</th>
                  <th className="p-2 border">Semester</th>
                  <th className="p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {schoolYears.map((sy, index) => (
                  <tr key={index}>
                    <td className="p-2 border text-center">
                      {`${sy.year_description}-${parseInt(sy.year_description) + 1}`}
                    </td>
                    <td className="p-2 border text-center">{sy.semester_description}</td>
                    <td className="p-2 border text-center">{getStatus(sy.astatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SchoolYearPanel;
