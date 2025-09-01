import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Typography } from "@mui/material";

const ProgramPanel = () => {
  const [program, setProgram] = useState({ name: "", code: "" });
  const [programs, setPrograms] = useState([]);

  const fetchPrograms = async () => {
    try {
      const res = await axios.get("http://localhost:5000/get_program");
      setPrograms(res.data);
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleChangesForEverything = (e) => {
    const { name, value } = e.target;
    setProgram((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddingProgram = async () => {
    if (!program.name || !program.code) {
      alert("Please fill all fields");
      return;
    }
    try {
      await axios.post("http://localhost:5000/program", program);
      setProgram({ name: "", code: "" });
      fetchPrograms();
    } catch (err) {
      console.error("Error adding program:", err);
    }
  };

  return (
    <Box sx={{ maxWidth: "1200px", mx: "auto", mt: 5, px: 2 }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        color="maroon"
        textAlign="center"
        gutterBottom
      >
        Program Panel Form
      </Typography>

      <div style={styles.container}>
        {/* Left: Form */}
        <div style={styles.formSection}>


          <div style={styles.formGroup}>
            <label htmlFor="program_name" style={styles.label}>
              Program Description:
            </label>
            <input
              type="text"
              id="program_name"
              name="name"
              value={program.name}
              onChange={handleChangesForEverything}
              placeholder="Enter Program Description"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="program_code" style={styles.label}>
              Program Code:
            </label>
            <input
              type="text"
              id="program_code"
              name="code"
              value={program.code}
              onChange={handleChangesForEverything}
              placeholder="Enter Program Code"
              style={styles.input}
            />
          </div>

          <button style={styles.button} onClick={handleAddingProgram}>
            Insert
          </button>
        </div>

        {/* Right: Program List */}
        <div style={styles.displaySection}>
          <Typography variant="h6" sx={{ mb: 2, textAlign: "center", color: "#333" }}>
            Program List
          </Typography>
          <div style={styles.taggedProgramsContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Code</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((prog) => (
                  <tr key={prog.program_id}>
                    <td style={styles.td}>{prog.program_id}</td>
                    <td style={styles.td}>{prog.program_description}</td>
                    <td style={styles.td}>{prog.program_code}</td>
                  </tr>
                ))}

              </tbody>
            </table>
            {programs.length === 0 && <p>No programs available.</p>}
          </div>
        </div>
      </div>
    </Box>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "space-between",
    gap: "40px",
    flexWrap: "wrap",
  },
  formSection: {
    width: "48%",
    background: "#f8f8f8",
    padding: "25px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
  },
  displaySection: {
    width: "48%",
    background: "#f8f8f8",
    padding: "25px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    overflowY: "auto",
    maxHeight: "600px",
    boxSizing: "border-box",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "bold",
    color: "#444",
    fontSize: "16px",
  },
  input: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    marginTop: "25px",
    width: "100%",
    padding: "14px",
    fontSize: "18px",
    backgroundColor: "maroon",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  taggedProgramsContainer: {
    overflowY: "auto",
    maxHeight: "500px",
    marginTop: "15px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    backgroundColor: "#f1f1f1",
    padding: "15px",
    textAlign: "left",
    fontWeight: "bold",
    fontSize: "16px",
  },
  td: {
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #ddd",
    fontSize: "16px",
  },
};

export default ProgramPanel;
