import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography } from '@mui/material'; // ✅ Import MUI components

const ChangeGradingPeriod = () => {
  const [gradingPeriod, setGradingPeriod] = useState([]);

  const fetchYearPeriod = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get-grading-period');
      setGradingPeriod(response.data);
    } catch (error) {
      console.error("Error in Fetching Data", error);
    }
  };

  useEffect(() => {
    fetchYearPeriod();
  }, []);

  const handlePeriodActivate = async (id) => {
    try {
      await axios.post(`http://localhost:5000/grade_period_activate/${id}`);
      alert("Grading period activated!");
      fetchYearPeriod();
    } catch (error) {
      console.error("Error activating grading period:", error);
    }
  };

  return (
    <Box sx={styles.container}>
      <Typography
        variant="h4"
        align="center"
        fontWeight="bold"
        sx={{ color: "#800000", mb: 2 }}
      >
        Grading Periods
      </Typography>

      <div style={styles.periodList}>
        {gradingPeriod.map((period) => (
          <div key={period.id} style={styles.periodItem}>
            <div style={styles.periodDescription}>{period.description}</div>
            <div style={styles.buttonContainer}>
              {period.status === 1 ? (
                <span style={styles.activatedStatus}>Activated</span>
              ) : (
                <button
                  style={styles.activateButton}
                  onClick={() => handlePeriodActivate(period.id)}
                >
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Box>
  );
};

// ✅ Styling object
const styles = {
  container: {
    maxWidth: 900,
    margin: '30px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  },
  periodList: {
    marginTop: '20px',
  },
  periodItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#fff',
    marginBottom: '10px',
    borderRadius: '6px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
  periodDescription: {
    fontSize: '18px',
    fontWeight: 500,
    color: '#333',
  },
  buttonContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  activateButton: {
    padding: '8px 15px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s',
  },
  activatedStatus: {
    color: '#757575',
    fontSize: '16px',
  },
};

export default ChangeGradingPeriod;
