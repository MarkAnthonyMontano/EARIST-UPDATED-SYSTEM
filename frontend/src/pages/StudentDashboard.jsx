import React, {useState, useEffect} from "react";
import '../styles/TempStyles.css';
import axios from 'axios';

const StudentDashboard = () => {
    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [personData, setPerson] = useState({
        student_number: '',
        first_name: '',
        middle_name: '',
        last_name: '',
    })
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const storedUser = localStorage.getItem("email");
        const storedRole = localStorage.getItem("role");
        const storedID = localStorage.getItem("person_id");
    
        if (storedUser && storedRole && storedID) {
          setUser(storedUser);
          setUserRole(storedRole);
          setUserID(storedID);
    
          if (storedRole !== "student") {
            window.location.href = "/faculty_dashboard";
          } else {
            fetchPersonData(storedID);
            console.log("you are an student");
          }
        } else {
          window.location.href = "/login";
        }
      }, []);

      const fetchPersonData = async (id) => {
          try {
            const res = await axios.get(`http://localhost:5000/api/person/${id}`);
            setPerson(res.data);
          } catch (error) { }
        };
      

  return (
    <div>
        <div>Name: {personData.last_name}, {personData.first_name} {personData.middle_name}</div>
        <div>Student Number: {personData.student_number}</div>
        <div>Email: {user}</div>
        <div>Role: {userRole}</div>
      <h1>Hello This is the Student Dashboard</h1>
    </div>
  );
};

export default StudentDashboard;

