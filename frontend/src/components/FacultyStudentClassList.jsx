import React, { useState, useEffect } from "react";
import '../styles/TempStyles.css';
import { useParams } from "react-router-dom";
import SortingIcon from "../components/SortingIcon";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

const FacultyStudentClassList = () => {
  const { subject_id, department_section_id, school_year_id } = useParams();
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [profData, setProfData] = useState({
    prof_id: '',
    fname: '',
    mname: '',
    lname: '',
    department_section_id: '',
    subject_id: '',
    active_school_year_id: '',
    mappings: []
  });

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
    try {
      const res = await axios.get(`http://localhost:5000/get_prof_data/${id}`);
      const first = res.data[0];
      
      const profInfo = {
        prof_id: first.prof_id,
        fname: first.fname,
        mname: first.mname,
        lname: first.lname,
        department_section_id: first.department_section_id,
        subject_id: first.subject_id,
        active_school_year_id: first.school_year_id,
        mappings: res.data.map(row => ({
          subject_id: row.course_id,
          department_section_id: row.department_section_id
        }))
      };

      setProfData(profInfo);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setMessage("Failed to Get person information")
    }
  };

  useEffect(() => {
    if (subject_id && department_section_id && school_year_id) {
      handleFetchStudents(subject_id, department_section_id, school_year_id);
    }
  }, [subject_id, department_section_id, school_year_id]);

  const handleFetchStudents = async (subject_id, department_section_id, school_year_id) => {
    try {
      const response = await fetch(`http://localhost:5000/get_enrolled_students/${subject_id}/${department_section_id}/${school_year_id}`);
      const data = await response.json();

      if (response.ok) {
        const studentsWithSubject = data.students.map((student) => ({
          ...student,
          subject_id,
          department_section_id,
        }));
        setStudents(studentsWithSubject);
      } else {
        setLoading(false);
        setMessage( "There are no currently enrolled student in this subject.");
      }
    } catch (error) {
      setLoading(false)
      setMessage("Server error.");
    }
  };

  return (
    <div>
      <div>
        Section: {students[0]?.program_code || "N/A"} {students[0]?.section_description || "N/A"}
      </div>
      <div>
        Subject: {students[0]?.course_code || "N/A"} ({students[0]?.course_description || "N/A"})
      </div>
      <div>
        Professor: {profData.lname}, {profData.fname} {profData.mname}
      </div>
      <div>
        Schedule: {students[0]?.day_description || "TBA"} | {students[0]?.school_time_start || "N/A"} - {students[0]?.school_time_end || "N/A"} | {students[0]?.room_description || "TBA"}
      </div>

      <Table style={{ maxWidth: '100%', marginLeft: '-1rem', transform: 'scale(0.9)' }}>
        <TableHead style={{ height: '50px' }}>
          <TableRow style={{ height: '50px' }}>
            {["#", "Student Number", "Student Name", "Course", "Year Level"].map((label, idx) => (
              <TableCell
                key={idx}
                style={{
                  borderColor: 'gray',
                  borderStyle: 'solid',
                  borderWidth: idx === 0 ? '1px 1px 1px 1px' : '1px 1px 1px 0px',
                  padding: '0rem 1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <p style={{ width: '100%' }}>{label}</p>
                  <SortingIcon />
                </div>
              </TableCell>
            ))}
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
              <TableCell style={{ padding: '0.5rem', textAlign: 'center', borderColor: 'gray', borderWidth: '1px 0px 1px 1px', borderStyle: 'solid' }}>
                {index + 1}
              </TableCell>
              <TableCell style={{ padding: '0.5rem', textAlign: 'center', borderColor: 'gray', borderWidth: '1px 0px 1px 1px', borderStyle: 'solid' }}>
                {student.student_number}
              </TableCell>
              <TableCell style={{ padding: '0.5rem', borderColor: 'gray', borderWidth: '1px 0px 1px 1px', borderStyle: 'solid' }}>
                {student.last_name}, {student.first_name} {student.middle_name}
              </TableCell>
              <TableCell style={{ padding: '0.5rem', textAlign: 'center', borderColor: 'gray', borderWidth: '1px 0px 1px 1px', borderStyle: 'solid' }}>
                {student.program_code}
              </TableCell>
              <TableCell style={{ padding: '0.5rem', textAlign: 'center', borderColor: 'gray', borderWidth: '1px 0px 1px 1px', borderStyle: 'solid' }}>
                {student.year_level_description}
              </TableCell>
            </TableRow>
          ))
        )}
        </TableBody>
      </Table>
    </div>
  );
};

export default FacultyStudentClassList;
