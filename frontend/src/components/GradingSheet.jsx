import React, { useState, useEffect } from "react";
import '../styles/TempStyles.css';
import axios from 'axios';
import SortingIcon from "../components/SortingIcon";
import { Table, TableBody, TableCell, TableHead, TableRow, TextField, Button, FormControl, Select, InputLabel, MenuItem} from "@mui/material";

const GradingSheet = () => {
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [students, setStudents] = useState([]);
  const [activeButton, setActiveButton] = useState(null);
  const [profData, setPerson] = useState({
    prof_id: "",
    fname: "",
    mname: "",
    lname: "",
  });
  const [sectionsHandle, setSectionsHandle] = useState([]);
  const [courseAssignedTo, setCoursesAssignedTo] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [schoolSemester, setSchoolSemester] = useState([]);
  const [selectedSchoolSemester, setSelectedSchoolSemester] = useState('');
  const [selectedActiveSchoolYear, setSelectedActiveSchoolYear] = useState('');

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
    if (userID) {
      axios
        .get(`http://localhost:5000/course_assigned_to/${userID}`)
        .then((res) => setCoursesAssignedTo(res.data))
        .catch((err) => console.error(err));
    }
  }, [userID]);

  useEffect(() => {
    if (userID && selectedCourse && selectedActiveSchoolYear) {
      axios
        .get(`http://localhost:5000/handle_section_of/${userID}/${selectedCourse}/${selectedActiveSchoolYear}`)
        .then((res) => setSectionsHandle(res.data))
        .catch((err) => console.error(err));
    }
  }, [userID, selectedCourse, selectedActiveSchoolYear]);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/get_school_year/`)
      .then((res) => setSchoolYears(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/get_school_semester/`)
      .then((res) => setSchoolSemester(res.data))
      .catch((err) => console.error(err));
  }, []);

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

  const handleFetchStudents = async (department_section_id) => {
    try {
      const response = await fetch(`http://localhost:5000/enrolled_student_list/${userID}/${selectedCourse}/${department_section_id}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.length === 0) {
          setStudents([]); 
          setMessage("There are no currently enrolled student in this subject and section");
        } else {
          const studentsWithSubject = data.map((student) => ({
            ...student,
            selectedCourse,
            department_section_id,
          }));

          setStudents(studentsWithSubject);
          setMessage("");
        }
      } else {
        setLoading(false);
        setMessage("There are no currently enrolled student in this subject");
      }
    } catch (error) {
      setLoading(false);
      setMessage("Fetch error");
    }
  };

  const handleChanges = (index, field, value) => {
    const updatedStudents = [...students];
    updatedStudents[index][field] = value;

    if (field === "midterm" || field === "finals") {
      const finalGrade = finalGradeCalc(updatedStudents[index].midterm, updatedStudents[index].finals);
      updatedStudents[index].final_grade = finalGrade;

      if (finalGrade == 0) {
        updatedStudents[index].en_remarks = 0;
      } else if (finalGrade >= 75) {
        updatedStudents[index].en_remarks = 1;
      } else if (finalGrade >= 60) {
        updatedStudents[index].en_remarks = 2;
      } else {
        updatedStudents[index].en_remarks = 3;
      }
    }
    
    setStudents(updatedStudents);
  }

  const addStudentInfo = async (student) => {
    try {
      const response = await fetch('http://localhost:5000/add_grades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          midterm: student.midterm,
          finals: student.finals,
          final_grade: student.final_grade,
          en_remarks: student.en_remarks,
          student_number: student.student_number,
          subject_id: selectedCourse,
        })
      });

      const result = await response.json();

      if (response.ok) {
        setLoading(false);
        alert("Grades saved successfully!");
      } else {
        setLoading(false);
        alert("Failed to save grades.");
      }
    } catch (error) {
      setLoading(false);
    }
  }

  const remarkConversion = (student) => {
    if (student.en_remarks == 1) {
      return "PASSED";
    } else if (student.en_remarks == 2) {
      return "FAILED";
    } else if (student.en_remarks == 3) {
      return "INCOMPLETE";
    } else {
      return "DROP";
    }
  };

  const finalGradeCalc = (midterm, finals) => {
    const midtermScore = parseFloat(midterm);
    const finalScore = parseFloat(finals);
  
    if (isNaN(midtermScore) || isNaN(finalScore)) {
      return "Invalid input";
    }

    const finalGrade = (midtermScore * 0.5) + (finalScore * 0.5);
    
    return finalGrade.toFixed(0);
  };
  
  const handleSelectCourseChange = (event) => {
    setSelectedCourse(event.target.value);
  };

  const handleSchoolYearChange = (event) => {
    setSelectedSchoolYear(event.target.value);
  };
  
  const handleSchoolSemesterChange = (event) => {
    setSelectedSchoolSemester(event.target.value);
  };
  
  return (
    <div>
        <div>
            <h1> Professor: {profData.fname} {profData.mname} {profData.lname}</h1>
        </div> 
        <div className="flex items-center">
            <div className="course-list min-w-[35%] my-[1rem] mr-[1rem]">
                <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Course</InputLabel>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={selectedCourse}
                        label="Course"
                        onChange={handleSelectCourseChange}
                    >
                        {courseAssignedTo.length > 0 ? (
                            courseAssignedTo.map((course) => (
                                <MenuItem value={course.course_id} key={course.course_id}>
                                {course.course_description} ({course.course_code})
                                </MenuItem>
                            ))
                        ) : (
                                <MenuItem disabled>No courses assigned</MenuItem>
                            )
                        }
                    </Select>
                </FormControl>
            </div>
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
            <div className="course-list my-[1rem] mr-[1rem]">
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
            <Button variant="contained" sx={{height: '3.4rem', background: 'maroon'}}>
                  Upload XLSX FILE
            </Button>
        </div>  
        <div className="temp-container">
                        
                        {sectionsHandle.map((section) => (
                            <Button variant="contained" sx={{backgroundColor: 'maroon', mb: 2, mr: 2, '&:hover': { backgroundColor: '#800000' }}} onClick={() => handleFetchStudents(section.department_section_id)} key={section.department_section_id}>{section.program_code}-{section.section_description}</Button>
                        ))}
                    </div>
        

      <Table style={{maxWidth: '100%', marginLeft: '-1rem', transform: 'scale(0.9)'}}>
        <TableHead style={{height: '50px'}}>
          <TableRow style={{height: '50px'}}>
            <TableCell style={{borderColor: 'gray', borderStyle: 'solid', borderWidth: '1px 1px 1px 1px', padding: '0rem 1rem'}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <p style={{width: '100%'}}>#</p>
                <div><SortingIcon /></div>
              </div>
            </TableCell>

            <TableCell style={{borderColor: 'gray', borderStyle: 'solid', borderWidth: '1px 1px 1px 0px', padding: '0rem 1rem'}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <p style={{width: '100%'}}>Student Number</p>
                <div><SortingIcon /></div>
              </div>
            </TableCell>

            <TableCell style={{borderColor: 'gray', borderStyle: 'solid', borderWidth: '1px 1px 1px 0px', padding: '0rem 1rem'}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <p style={{width: '100%'}}>Student Name</p>
                <div><SortingIcon /></div>
              </div>
            </TableCell>

            <TableCell style={{borderColor: 'gray', borderStyle: 'solid', borderWidth: '1px 1px 1px 0px', padding: '0rem 1rem'}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <p style={{width: '100%'}}>Section</p>
                <div><SortingIcon /></div>
              </div>
            </TableCell>

            <TableCell style={{borderColor: 'gray', borderStyle: 'solid', borderWidth: '1px 1px 1px 0px', padding: '0rem 1rem'}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <p style={{width: '100%'}}>Midterm</p>
                <div><SortingIcon /></div>
              </div>
            </TableCell>

            <TableCell style={{borderColor: 'gray', borderStyle: 'solid', borderWidth: '1px 1px 1px 0px', padding: '0rem 1rem'}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <p style={{width: '100%'}}>Finals</p>
                <div><SortingIcon /></div>
              </div>
            </TableCell>

            <TableCell style={{borderColor: 'gray', borderStyle: 'solid', borderWidth: '1px 1px 1px 0px', padding: '0rem 1rem'}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <p style={{width: '100%'}}>Final Grade</p>
                <div><SortingIcon /></div>
              </div>
            </TableCell>

            <TableCell style={{borderColor: 'gray', borderStyle: 'solid', borderWidth: '1px 1px 1px 0px', padding: '0rem 1rem'}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <p style={{width: '100%'}}>Remarks</p>
                <div><SortingIcon /></div>
              </div>
            </TableCell>

            <TableCell style={{borderColor: 'gray', borderStyle: 'solid', borderWidth: '1px 1px 1px 0px', padding: '0rem 1rem'}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <p style={{width: '100%'}}>Action</p>
                <div><SortingIcon /></div>
              </div>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {message ? (
            <TableRow>
              <TableCell colSpan={9} style={{ textAlign: 'center', padding: '1rem', border: '1px solid gray' }}>
                {message}
              </TableCell>
            </TableRow>
          ) : (
            students.map((student, index) => (
              <TableRow key={index}>
                  
                  <TableCell style={{padding: '0.5rem', width: '0%', textAlign: 'center', borderColor: 'gray', borderWidth: '1px 0px 1px 1px', borderStyle: 'solid'}}>
                    {index}
                  </TableCell> 
                  
                  <TableCell style={{padding: '0.5rem', width: '10%', textAlign: 'center', borderColor: 'gray', borderWidth: '1px 0px 1px 1px', borderStyle: 'solid'}}>
                  {student.student_number} 
                  </TableCell>
                  
                  <TableCell style={{padding: '0.5rem', width: '15%', borderColor: 'gray', borderWidth: '1px 0px 1px 1px', borderStyle: 'solid'}}>
                  {student.last_name}, {student.first_name} {student.middle_name} 
                  </TableCell>

                  <TableCell style={{padding: '0.5rem', width: '10%', textAlign: 'center', borderColor: 'gray', borderWidth: '1px 0px 1px 1px', borderStyle: 'solid'}}>
                  {student.program_code}-{student.section_description} 
                  </TableCell>

                  <TableCell style={{padding: '0.5rem', width: '1%', borderColor: 'gray', borderWidth: '1px 0px 1px 1px', borderStyle: 'solid'}}>
                    <input type="text" value={student.midterm} onChange={(e) => handleChanges(index, 'midterm', e.target.value)} style={{border: 'none', textAlign: 'center', background: 'none', outline: 'none', height: '100%', fontFamily: 'Poppins'}}/>
                  </TableCell>

                  <TableCell style={{padding: '0.5rem', maxWidth: '1%', width: '100%', borderColor: 'gray', borderWidth: '1px 0px 1px 1px', borderStyle: 'solid'}}>
                  <input type="text" value={student.finals} onChange={(e) => handleChanges(index, 'finals', e.target.value)} style={{border: 'none',textAlign: 'center', background: 'none', outline: 'none', height: '100%', fontFamily: 'Poppins'}}/>
                  </TableCell>

                  <TableCell style={{padding: '0.5rem', width: '5%', borderColor: 'gray', borderWidth: '1px 0px 1px 1px', borderStyle: 'solid'}}>
                  <input type="text" value={finalGradeCalc(student.midterm, student.finals)} readOnly style={{border: 'none', textAlign: 'center', background: 'none', outline: 'none', height: '100%', fontFamily: 'Poppins'}}/>
                  </TableCell>
                  
                  <TableCell style={{padding: '0.5rem', width: '10%', borderColor: 'gray', borderWidth: '1px 0px 1px 1px', borderStyle: 'solid'}}>
                    <select name="en_remarks" id="" value={students.en_remarks} className="w-full outline-none" onChange={(e) => handleChanges(index, 'en_remarks', parseInt(e.target.value))}>
                      <option value="">{remarkConversion(student)}</option>
                      <option value="0">DROP</option>
                      <option value="1">PASSED</option>
                      <option value="2">FAILED</option>
                      <option value="3">INCOMPLETE</option>
                    </select>
                  </TableCell>
                
                  <TableCell style={{padding: '0.5rem', width: '10%', borderColor: 'gray', borderWidth: '1px 1px 1px 1px', borderStyle: 'solid'}}>
                    <button onClick={() => addStudentInfo(student)}>Save</button>
                  </TableCell>
              
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default GradingSheet;
