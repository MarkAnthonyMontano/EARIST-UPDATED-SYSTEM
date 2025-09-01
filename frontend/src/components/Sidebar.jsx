import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dashboard, Apartment, Business, LibraryBooks, People, LogoutOutlined, Settings, AccountCircle, AccountCircleOutlined, Token } from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockResetIcon from '@mui/icons-material/LockReset';
import { HistoryOutlined } from "@mui/icons-material";
import '../styles/SideBar.css'
import { Avatar } from '@mui/material';

const SideBar = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const [role, setRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');

    if (token && savedRole) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          // Token expired
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          setIsAuthenticated(false);
          navigate('/');
        } else {
          setRole(savedRole); // ✅ Load from saved value
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.log("Token decode error:", err);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setIsAuthenticated(false);
        navigate('/');
      }
    } else {
      console.log("Missing token or role");
      setIsAuthenticated(false);
      navigate('/');
    }
  }, []);


  const Logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role'); // ✅ remove role
    setIsAuthenticated(false);
    navigate('/');
  }

  return (
    <div className='h-full w-enough hidden-print'>
      <ul className='bg-white h-full border-r-[3px] border-maroon-500 p-3 px-5 text-maroon-500 w-full gap-2 '>
        <div className='flex items-center flex-col mt-8'>
          <Avatar sx={{
            width: 106,
            height: 106,
            border: '3px solid maroon', // thin border
            color: 'maroon',
            bgcolor: 'transparent'
          }} />
          {role === 'registrar' && (
            <span className='mt-4'>Administrator</span>
          )}
          {role === 'applicant' && (
            <span className='mt-4'>Applicant</span>
          )}
          {role === 'faculty' && (
            <span className='mt-4'>Faculty</span>
          )}
          {role === 'student' && (
            <span className='mt-4'>Student</span>
          )}
        </div>
        <br />
        <hr className='bg-maroon-500' />
        <br />
        {role === 'registrar' && (
          <>
            <Link to="/dashboard">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded button-hover ${location.pathname === "/dashboard" ? "bg-maroon-500 text-white" : ""}`} >
                <Dashboard />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Dashboard</span>
              </li>
            </Link>

            <Link to="/admission_dashboard">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover ${location.pathname === "/admission_dashboard" ? "bg-maroon-500 text-white" : ""}`}>
                <Business />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Admission Management</span>
              </li>
            </Link>

            <Link to="/course_management">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover ${location.pathname === "/course_management" ? "bg-maroon-500 text-white" : ""}`}>
                <LibraryBooks />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Courses Management</span>
              </li>
            </Link>

            <Link to="/department_dashboard">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover ${location.pathname === "/department_dashboard" ? "bg-maroon-500 text-white" : ""}`}>
                <Apartment />
                <span className='pl-4 p-2 px-0 mr-2 pointer-events-none'>Department Management</span>
              </li>
            </Link>

            <Link to="/system_dashboard">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover ${location.pathname === "/system_dashboard" ? "bg-maroon-500 text-white" : ""}`}>
                <Settings />
                <span className='pl-4 p-2 px-0 pointer-events-none'>System Management</span>
              </li>
            </Link>

            <Link to="/account_dashboard">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover ${location.pathname === "/account_dashboard" ? "bg-maroon-500 text-white" : ""}`}>
                <People />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Accounts</span>
              </li>
            </Link>
            <Link to="/history_logs">
              <li className="w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 cursor-pointer button-hover">
                <HistoryOutlined />
                <button className="pl-4 p-2 px-0 pointer-events-none">History Logs</button>
              </li>
            </Link>
          </>
        )}
        {role === 'applicant' && (
          <>
            <Link to="/applicant_dashboard">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover 
    ${location.pathname.startsWith("/applicant_dashboard") ? "bg-maroon-500 text-white" : ""}`}>
                <DashboardIcon />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Dashboard</span>
              </li>
            </Link>

            <Link to="/dashboard1">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover 
    ${location.pathname.startsWith("/dashboard1") ? "bg-maroon-500 text-white" : ""}`}>
                <AssignmentIndIcon />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Applicant Form</span>
              </li>
            </Link>

            <Link to="/requirements_uploader">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover 
    ${location.pathname.startsWith("/requirements_uploader") ? "bg-maroon-500 text-white" : ""}`}>
                <CloudUploadIcon />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Upload Requirements</span>
              </li>
            </Link>

            <Link to="/applicant_reset_password">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover 
    ${location.pathname.startsWith("/applicant_reset_password") ? "bg-maroon-500 text-white" : ""}`}>
                <LockResetIcon />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Change Password</span>
              </li>
            </Link>


          </>
        )}
        {role === 'faculty' && (
          <>
            <Link to="/faculty_dashboard">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded button-hover ${location.pathname === "/faculty_dashboard" ? "bg-maroon-500 text-white" : ""}`} >
                <Dashboard />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Dashboard</span>
              </li>
            </Link>

            <Link to="/grading_sheet">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover ${location.pathname === "/grading_sheet" ? "bg-maroon-500 text-white" : ""}`}>
                <Business />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Grading Management</span>
              </li>
            </Link>

            <Link to="/faculty_masterlist">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover ${location.pathname === "/faculty_masterlist" ? "bg-maroon-500 text-white" : ""}`}>
                <Business />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Master List</span>
              </li>
            </Link>
            <Link to="/faculty_workload">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover ${location.pathname === "/faculty_workload" ? "bg-maroon-500 text-white" : ""}`}>
                <Business />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Workload</span>
              </li>
            </Link>
            <Link to="/faculty_schedule">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover ${location.pathname === "/faculty_schedule" ? "bg-maroon-500 text-white" : ""}`}>
                <Business />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Schedule</span>
              </li>
            </Link>
            <Link to="/faculty_reset_password">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover ${location.pathname === "/faculty_reset_password" ? "bg-maroon-500 text-white" : ""}`}>
                <LockResetIcon />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Reset Password</span>
              </li>
            </Link>
          </>
        )}
        {role === 'student' && (
          <>
            <Link to="/student_dashboard">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded button-hover ${location.pathname === "/faculty_dashboard" ? "bg-maroon-500 text-white" : ""}`} >
                <Dashboard />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Dashboard</span>
              </li>
            </Link>
            <Link to="/student_reset_password">
              <li className={`w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 button-hover ${location.pathname === "/student_reset_password" ? "bg-maroon-500 text-white" : ""}`}>
                <LockResetIcon />
                <span className='pl-4 p-2 px-0 pointer-events-none'>Reset Password</span>
              </li>
            </Link>

          </>
        )}

        <li className='w-full flex items-center border border-maroon-500 px-2 rounded m-2 mx-0 cursor-pointer button-hover' onClick={Logout}>
          <LogoutOutlined />
          <button className='pl-4 p-2 px-0 pointer-events-none'>Logout</button>
        </li>

      </ul>

    </div>
  );
};

export default SideBar;
