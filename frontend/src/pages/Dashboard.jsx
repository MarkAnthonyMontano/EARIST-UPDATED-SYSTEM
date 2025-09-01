import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  MenuItem,
  FormControl,

  Select,
  InputLabel,
  Paper,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";

const Dashboard = () => {
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [professorCount, setProfessorCount] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [studentCount, setStudentCount] = useState(0);
  const [yearLevelCounts, setYearLevelCounts] = useState([]);

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");

    if (storedUser && storedRole && storedID) {
      setUser(storedUser);
      setUserRole(storedRole);
      setUserID(storedID);

      if (storedRole !== "registrar") {
        window.location.href = "/applicant_dashboard";
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    axios.get("http://localhost:5000/api/enrolled-count")
      .then(res => setEnrolledCount(res.data.total))
      .catch(err => console.error("Failed to fetch enrolled count", err));

    axios.get("http://localhost:5000/api/professors")
      .then(res => setProfessorCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(err => console.error("Failed to fetch professor count", err));

    axios.get("http://localhost:5000/api/accepted-students-count")
      .then(res => setAcceptedCount(res.data.total))
      .catch(err => console.error("Failed to fetch accepted count", err));

    axios.get("http://localhost:5000/api/departments")
      .then(res => setDepartments(res.data))
      .catch(err => console.error("Failed to fetch departments", err));
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      axios.get(`http://localhost:5000/statistics/student_count/department/${selectedDepartment}`)
        .then(res => setStudentCount(res.data.count))
        .catch(err => console.error("Failed to fetch student count", err));

      axios.get(`http://localhost:5000/statistics/student_count/department/${selectedDepartment}/by_year_level`)
        .then(res => setYearLevelCounts(res.data))
        .catch(err => console.error("Failed to fetch year level counts", err));
    }
  }, [selectedDepartment]);

  const stats = [
    {
      label: "Total Applicants",
      value: enrolledCount,
      icon: <GroupIcon fontSize="large" />,
      color: "#F6D167",
    },
    {
      label: "Enrolled Students",
      value: acceptedCount,
      icon: <SchoolIcon fontSize="large" />,
      color: "#84B082",
    },
    {
      label: "Professors",
      value: professorCount,
      icon: <PersonIcon fontSize="large" />,
      color: "#A3C4F3",
    },
  ];

  return (
    <Box sx={{ p: 4, minHeight: "100vh" }}>
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" fontWeight="bold" mb={2}>
          Welcome, Admin {user.split("@")[0]}!
        </Typography>
        <Typography variant="body1" style={{ color: "black", fontSize: "25px" }}>
          {formattedDate}
        </Typography>
      </Box>
      {/* Stats Section */}
      <Grid container spacing={3}>
        {stats.map((stat, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card
              sx={{
                display: "flex",
                alignItems: "center",
                p: 3,
                borderRadius: 3,
                transition: "transform 0.2s ease",
                "&:hover": { transform: "scale(1.03)" },
              }}
            >
              <Box
                sx={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  backgroundColor: stat.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 3,
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {stat.value}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Department Section */}
      <Typography variant="h6" mt={6} mb={2}>
        Department Overview
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 1,
              borderRadius: 3,
              height: 400,
              transition: "transform 0.2s ease",
              boxShadow: 3,
              "&:hover": { transform: "scale(1.03)" },
            }}
          >
            <CardContent>
              <Typography fontWeight="bold" mb={2}>
                Select Department
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Select Department</InputLabel>
                <Select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  label="Select Department"
                >
                  <MenuItem value="">
                    <em>- Select -</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.dprtmnt_id} value={dept.dprtmnt_id}>
                      {dept.dprtmnt_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 1,
              borderRadius: 3,
              height: 400,
              transition: "transform 0.2s ease",
              boxShadow: 3,
              "&:hover": { transform: "scale(1.03)" },
            }}
          >
            <CardContent>
              <Typography fontWeight="bold" mb={2}>
                Student Summary
              </Typography>
              <Typography variant="body1" mb={2}>
                Total Enrolled Students:{" "}
                <Typography component="span" fontWeight="bold" color="primary">
                  {selectedDepartment ? studentCount : "—"}
                </Typography>
              </Typography>

              {yearLevelCounts.length > 0 ? (
                yearLevelCounts.map((item) => (
                  <Typography key={item.year_level_id} variant="body2" mb={1}>
                    {item.year_level_description}:{" "}
                    <Typography component="span" fontWeight="bold" color="maroon">
                      {item.student_count}
                    </Typography>
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No year level data available.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>


    </Box>
  );
};

export default Dashboard;
