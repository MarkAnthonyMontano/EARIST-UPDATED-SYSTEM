import React, { useState, useEffect } from "react";
import '../styles/TempStyles.css';
import SortingIcon from "../components/SortingIcon";
import {Link} from "react-router-dom";
import { Typography, Table, TableBody, TableCell, TableHead, TableRow, TextField, FormControl, Select, InputLabel, MenuItem } from "@mui/material";
import axios from "axios";

const FacultyMasterList = () => {
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [profData, setPerson] = useState({
    prof_id: '',
    fname: '',
    mname: '',
    lname: ''
  });
  const [schoolYears, setSchoolYears] = useState([]);
  const [schoolSemester, setSchoolSemester] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [selectedSchoolSemester, setSelectedSchoolSemester] = useState('');
  const [selectedActiveSchoolYear, setSelectedActiveSchoolYear] = useState('');
  const [classListAndDetails, setClassListAndDetails] = useState([]);

    
  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");

    if (storedUser && storedRole && storedID) {
      setUser(storedUser);
      setUserRole(storedRole);
      setUserID(storedID);
        
        if (storedRole !== "faculty") {
          window.location.href = "/dashboard";
        } else {
          fetchPersonData(storedID);
        }
    } else {
      window.location.href = "/login";
    }
  }, []);

  const fetchPersonData = async (id) => {
    try{
      const res = await axios.get(`http://localhost:5000/get_prof_data/${id}`)
      const first = res.data[0];

      const profInfo = {
        prof_id: first.prof_id,
        fname: first.fname,
        mname: first.mname,
        lname: first.lname,
      };

      setPerson(profInfo);
    } catch (err) {
      setLoading(false);
      setMessage("Error Fetching Professor Personal Data");
    }
  }

  useEffect(() => {
    axios
      .get(`http://localhost:5000/get_school_year/`)
      .then((res) => setSchoolYears(res.data))
      .catch((err) => console.error(err));
  }, [])

  useEffect(() => {
    axios
      .get(`http://localhost:5000/get_school_semester/`)
      .then((res) => setSchoolSemester(res.data))
      .catch((err) => console.error(err));
  }, [])

  useEffect(() => {
  
      axios
        .get(`http://localhost:5000/active_school_year`)
        .then((res) => {
          if (res.data.length > 0) {
            setSelectedSchoolYear(res.data[0].year_id);
            setSelectedSchoolSemester(res.data[0].semester_id);
          }
        })
        .catch((err) => console.error(err));
    
  }, []);

  useEffect(() => {
    if (selectedSchoolYear && selectedSchoolSemester) {
      axios
        .get(`http://localhost:5000/get_selecterd_year/${selectedSchoolYear}/${selectedSchoolSemester}`)
        .then((res) => {
          if (res.data.length > 0) {
            setSelectedActiveSchoolYear(res.data[0].school_year_id);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [selectedSchoolYear, selectedSchoolSemester]);

  useEffect(() => {
    if (selectedActiveSchoolYear && profData.prof_id) {
      axios
        .get(`http://localhost:5000/get_class_details/${selectedActiveSchoolYear}/${profData.prof_id}`)
        .then((res) => setClassListAndDetails(res.data))
        .catch((err) => console.error(err));
    }
  }, [selectedActiveSchoolYear, profData.prof_id]);

  const handleSchoolYearChange = (event) => {
    setSelectedSchoolYear(event.target.value);
  };
  
  const handleSchoolSemesterChange = (event) => {
    setSelectedSchoolSemester(event.target.value);
  };
  
  return (
    <div className='mr-[4rem]'>
        <Typography variant="h4" sx={{marginTop: '1.5rem'}} color="maroon" fontWeight="bold" gutterBottom>
          Class List
        </Typography>
      <div className="flex items-center">
        <div className="course-list my-[1rem] mr-[1rem]">
            <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">School Years</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={selectedSchoolYear}
                  label="School Years"
                  sx={{minWidth: '200px'}}
                  onChange={handleSchoolYearChange}
                >   
                  {schoolYears.length > 0 ? (
                    schoolYears.map((sy) => (
                      <MenuItem value={sy.year_id} key={sy.year_id}>
                        {sy.current_year} - {sy.next_year}
                      </MenuItem> 
                    ))
                  ) : (
                    <MenuItem disabled>School Year is not found</MenuItem>
                    )
                  }
                </Select>
            </FormControl>
          </div>
          <div className="course-list my-[1rem]">
            <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">School Semester</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={selectedSchoolSemester}
                  label="School Semester"
                  sx={{minWidth: '200px'}}
                  onChange={handleSchoolSemesterChange}
                >   
                  {schoolSemester.length > 0 ? (
                    schoolSemester.map((sem) => (
                      <MenuItem value={sem.semester_id} key={sem.semester_id}>
                        {sem.semester_description}
                      </MenuItem> 
                    ))
                  ) : (
                    <MenuItem disabled>School Semester is not found</MenuItem>
                    )
                  }
                </Select>
            </FormControl>
          </div>
      </div>
    <Table sx={{ marginTop: 3 }}>
      <TableHead>
        <TableRow>
          <TableCell><strong>No.</strong></TableCell>
          <TableCell><strong>Section</strong></TableCell>
          <TableCell><strong>Course Code</strong></TableCell>
          <TableCell><strong>Course Description</strong></TableCell>
          <TableCell sx={{textAlign: 'center'}}><strong>Number of Student</strong></TableCell>
          <TableCell><strong>Class Schedule</strong></TableCell>
          <TableCell><strong>Room</strong></TableCell>
          <TableCell align="center"><strong>Actions</strong></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {classListAndDetails.length > 0 ? (
          classListAndDetails.map((course, index) => (
            <TableRow key={course.course_id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{course.program_code}-{course.section_description}</TableCell>
              <TableCell>{course.course_code}</TableCell>
              <TableCell>{course.course_description}</TableCell>
              <TableCell sx={{textAlign: 'center'}} >{course.enrolled_students}</TableCell>
              <TableCell>{course.day}   {course.school_time_start} - {course.school_time_end} </TableCell>
              <TableCell>{course.room_description}</TableCell>
              <TableCell align="center">
                <Link to={`/class_list/${course.course_id}/${course.department_section_id}/${course.school_year_id}`} style={{ textDecoration: "none", color: '#1DA1F2' }}>
                  View Class
                </Link>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={8} align="center">
              No class details available
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>

      
    </div>
  );
};

export default FacultyMasterList;


