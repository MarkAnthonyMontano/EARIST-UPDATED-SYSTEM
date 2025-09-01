import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Grid
} from '@mui/material';

const ClassRoster = () => {
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const navigate = useNavigate(); // used for navigation on card click

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get_department');
      setDepartments(response.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchPrograms = async (deptId) => {
    setSelectedDept(deptId);
    setSelectedProgramId(null); // clear selected program when dept changes
    try {
      const response = await axios.get(`http://localhost:5000/class_roster/ccs/${deptId}`);
      setPrograms(response.data);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setPrograms([]);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <Box sx={{ height: 'calc(100vh - 150px)', overflowY: 'auto', pr: 1, p: 1 }}>
      {/* Top header: DOCUMENTS SUBMITTED + Search */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
       
          mb: 2,
          px: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: 'maroon',
            fontSize: '36px',
          }}
        >
         CLASS ROSTER
        </Typography>


      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />

      <br />
      <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
        <Typography fontWeight={700} fontSize={16} gutterBottom>
          Select a Department
        </Typography>

        <Grid container spacing={2}>
          {departments.map(dept => (
            <Grid item key={dept.dprtmnt_id}>
              <Button
                onClick={() => fetchPrograms(dept.dprtmnt_id)}
                sx={{
                  backgroundColor: selectedDept === dept.dprtmnt_id ? '#800000' : '#ffffff',
                  color: selectedDept === dept.dprtmnt_id ? '#ffffff' : '#800000',
                  border: '1px solid #800000',
                  fontWeight: 'bold',
                  minWidth: '118.5px',
                  height: '50px',
                  '&:hover': {
                    backgroundColor: '#800000',
                    color: '#ffffff',
                  }
                }}
              >
                {dept.dprtmnt_code}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Box>
        {selectedDept && programs.length === 0 && (
          <Typography color="text.secondary" fontStyle="italic">
            There are no programs in the selected department.
          </Typography>
        )}

        {programs.length > 0 && (
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography style={{ fontSize: 14 }} fontWeight="bold" mb={2}>
              {programs[0].dprtmnt_name} ({programs[0].dprtmnt_code})
            </Typography>

            <Grid container spacing={2}>
              {programs.map(program => (
                <Grid item xs={12} sm={6} md={4} key={program.program_id}>
                  <Card
                    onClick={() => navigate(`class_list/ccs/${program.curriculum_id}`)}
                    sx={{
                      height: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'center',
                      backgroundColor: '#ffffff',
                      color: '#800000',
                      border: '2px solid #800000',
                      cursor: 'pointer',
                      transition: '0.3s',
                      '&:hover': {
                        backgroundColor: '#800000',
                        color: '#ffffff'
                      }
                    }}
                  >
                    <CardContent>
                      <Typography fontWeight={500}>
                        {program.program_description} ({program.program_code})
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default ClassRoster;
