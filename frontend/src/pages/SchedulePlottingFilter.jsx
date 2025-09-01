import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Grid,
  Button,
  Typography,
  Box
} from '@mui/material';

const ScheduleFilterer = () => {
  const [departmentList, setDepartmentsList] = useState([]);
  const [filterDepId, setFilterDepId] = useState(null);
  const navigate = useNavigate();

  const fetchDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/departments");
      setDepartmentsList(res.data);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleFilterID = (id) => {
    setFilterDepId(id);
    navigate(`/schedule_checker/${id}`);
  };

  return (
    <Box p={3}>
      <Typography
        variant="h4"
        fontWeight="bold"
        color="maroon"
        textAlign="center"
        gutterBottom
        mb={3}
      >
        Select a Department
      </Typography>

      <Grid
        container
        spacing={4}
        gap={2}
        justifyContent="center"
        textAlign="center"
        style={{ backgroundColor: "white", padding: "1rem 0rem" }}
      >
        {departmentList.map((department, index) => (
          <Grid key={department.dprtmnt_id}>
            <Button
              fullWidth
              key={index}
              variant="contained"
              value={department.dprtmnt_id}
              onClick={() => handleFilterID(department.dprtmnt_id)}
              sx={{
                backgroundColor:
                  filterDepId === department.dprtmnt_id ? "maroon" : "white",
                color: filterDepId === department.dprtmnt_id ? "white" : "maroon",
                border: "1px solid maroon",
                "&:hover": {
                  backgroundColor: "maroon",
                  color: "white",
                },
              }}
            >
              {department.dprtmnt_code}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ScheduleFilterer;
