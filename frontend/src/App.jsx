import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import ApplicantForgotPassword from './components/ApplicantForgotPassword';
import ApplicantResetPassword from './components/ApplicantResetPassword';
import RegistrarForgotPassword from './components/RegistrarForgotPassword';
import RegistrarResetPassword from './components/RegistrarResetPassword';
import StudentResetPassword from './components/StudentResetPassword';
import FacultyResetPassword from './components/FacultyResetPassword';
import SuperAdminApplicantResetPassword from './components/SuperAdminApplicantResetPassword';
import SuperAdminStudentResetPassword from './components/SuperAdminStudentResetPassword';
import SuperAdminFacultyResetPassword from './components/SuperAdminFacultyResetPassword';

import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DepartmentRegistration from './components/DprtmntRegistration';
import DepartmentRoom from './components/DprtmntRoom';
import DepartmentProf from './components/DprtmntProf';
import SideBar from './components/Sidebar';
import ProgramTagging from './components/ProgramTagging';
import CourseManagement from './pages/CourseManagement';
import CoursePanel from './components/CoursePanel';
import ProgramPanel from './components/ProgramPanel';
import CurriculumPanel from './components/CurriculumPanel';
import SectionPanel from './components/SectionPanel';
import DepartmentSection from './components/DepartmentSection';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterProf from './components/RegisterProf';
import StudentProfileForm from './components/StudentProfile';
import YearLevelPanel from './components/YearLevelPanel';
import YearPanel from './components/YearPanel';
import YearUpdateForm from './components/YearUpdateForm';
import SemesterPanel from './components/SemesterPanel';
import SchoolYearPanel from './components/SchoolYearPanel';
import SchoolYearActivatorPanel from './components/SchoolYearActivatorPanel';
import RequirementsForm from './components/RequirementsForm';
import AdmissionDashboardPanel from './pages/AdmissionDashboard';
import SystemDashboardPanel from './pages/SystemDashboard';
import DepartmentManagement from './pages/DepartmentDashboard';
import HistoryLogs from './pages/HistoryLogs';
import StudentNumbering from './components/StudentNumbering';
import CourseTagging from './components/CourseTagging';
import ChangeGradingPeriod from './components/ChangeYearGradPer';
import AccountDashboard from './pages/AccountDashboard';
import ScheduleChecker from './components/ScheduleChecker';
import SearchCertificateOfRegistration from './components/SearchCertificateOfRegistration';
import RoomRegistration from './components/RoomRegistration';
import ScheduleFilterer from './pages/SchedulePlottingFilter';

import FacultyDashboard from './pages/FacultyDashboard'; //For Professors & Faculty Members
import Dashboard from './pages/Dashboard'; // For SuperAdmin & Admin
import ApplicantDashboard from './pages/ApplicantDashboard';

import Unauthorized from './components/Unauthorized';
import StudentRequirements from './components/StudentRequirements';


import GradingSheet from './components/GradingSheet';
import FacultyWorkload from './components/FacultyWorkload';
import FacultyMasterList from './components/FacultyMasterlist';
import FacultyStudentClassList from './components/FacultyStudentClassList';
import FacultySchedule from './components/FacultySchedule';
import StudentDashboard from './pages/StudentDashboard';

import AdminDashboard1 from './components/AdminDashboard1';
import AdminDashboard2 from './components/AdminDashboard2';
import AdminDashboard3 from './components/AdminDashboard3';
import AdminDashboard4 from './components/AdminDashboard4';
import AdminDashboard5 from './components/AdminDashboard5';

import SuperAdminDashboard1 from './components/SuperAdminDashboard1';
import SuperAdminDashboard2 from './components/SuperAdminDashboard2';
import SuperAdminDashboard3 from './components/SuperAdminDashboard3';
import SuperAdminDashboard4 from './components/SuperAdminDashboard4';
import SuperAdminDashboard5 from './components/SuperAdminDashboard5';

import ApplicantList from './components/ApplicantList';
import ApplicantListAdmin from './components/ApplicantListAdmin';
import Notifications from './components/Notifications';
import ExaminationProfile from './components/ExaminationProfile';
import AssignScheduleToApplicants from './components/AssignScheduleToApplicants';
import AssignEntranceExam from './components/AssignEntranceExam';
import ProctorApplicantList from './components/ProctorApplicantList';
import ApplicantScoring from './components/ApplicantScoring';
import Interview from './components/Interview';
import QualifyingExam from './components/QualifyingExam';
import CollegeApproval from './components/CollegeApproval';
import MedicalClearance from './components/MedicalClearance';

import Dashboard1 from './components/Dashboard1';
import Dashboard2 from './components/Dashboard2';
import Dashboard3 from './components/Dashboard3';
import Dashboard4 from './components/Dashboard4';
import Dashboard5 from './components/Dashboard5';
import RequirementUploader from './components/RequirementUploader';

import PersonalDataForm from './components/PersonalDataForm';
import ECATApplicationForm from './components/ECATApplicationForm';
import AdmissionFormProcess from './components/AdmissionFormProcess';
import AdmissionServices from './components/AdmissionServices';
import OfficeOfTheRegistrar from './components/OfficeOfTheRegistrar';

import LoginEnrollment from './components/LoginEnrollment';
import ExamScheduler from './components/ExamScheduler';
import ExamScheduler2 from './components/ExamScheduler2';

import ClassList from './components/ClassList';
import ClassRoster from './components/ClassRoster';
import StudentList from './components/StudentListPerCourse';
import ProfessorListPerSection from './components/ProfessorListPerClass';
import FacultyStudentList from './components/FacultyStudentList';




function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchAuthentication = () => {
    const token = localStorage.getItem('token');
    if (token !== null) {
      setIsAuthenticated(true);
    }
  }

  useEffect(() => {
    fetchAuthentication();
  }, []);

  const theme = createTheme({
    typography: {
      fontFamily: "Poppins, sans-serif",
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Router>
        <header>
          <Navbar isAuthenticated={isAuthenticated} />
        </header>

        <div className="flex">
          {isAuthenticated && (
            <article className='min-w-[21rem] min-h-screen flex'>
              <SideBar setIsAuthenticated={setIsAuthenticated} style={{ height: '100%' }} />
            </article>
          )}

          <main className='w-full'>
            <Routes>
              <Route path="/" element={<LoginEnrollment setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/login_applicant" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/login" element={<LoginEnrollment setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/register" element={<Register />} />

              <Route path="/applicant_forgot_password" element={<ApplicantForgotPassword />} />
              <Route path="/applicant_reset_password" element={<ProtectedRoute><ApplicantResetPassword /></ProtectedRoute>} />

              <Route path="/registrar_forgot_password" element={<RegistrarForgotPassword />} />
              <Route path="/registrar_reset_password" element={<ProtectedRoute><RegistrarResetPassword /></ProtectedRoute>} />

              <Route path="/student_reset_password" element={<ProtectedRoute><StudentResetPassword /></ProtectedRoute>} />
              <Route path="/faculty_reset_password" element={<ProtectedRoute><FacultyResetPassword /></ProtectedRoute>} />
              <Route path="/superadmin_applicant_reset_password" element={<ProtectedRoute><SuperAdminApplicantResetPassword /></ProtectedRoute>} />
              <Route path="/superadmin_student_reset_password" element={<ProtectedRoute><SuperAdminStudentResetPassword /></ProtectedRoute>} />
              <Route path="/superadmin_faculty_reset_password" element={<ProtectedRoute><SuperAdminFacultyResetPassword /></ProtectedRoute>} />


              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/faculty_dashboard" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
              <Route path="/applicant_dashboard" element={<ProtectedRoute><ApplicantDashboard /></ProtectedRoute>} />
              <Route path="/register_prof" element={<ProtectedRoute><RegisterProf /></ProtectedRoute>} />

              <Route path="/room_registration" element={<ProtectedRoute><RoomRegistration /></ProtectedRoute>} />
              <Route path="/course_management" element={<ProtectedRoute><CourseManagement /></ProtectedRoute>} />
              <Route path="/program_tagging" element={<ProtectedRoute><ProgramTagging /></ProtectedRoute>} />
              <Route path="/course_panel" element={<ProtectedRoute><CoursePanel /></ProtectedRoute>} />
              <Route path="/program_panel" element={<ProtectedRoute><ProgramPanel /></ProtectedRoute>} />
              <Route path="/department_section_panel" element={<ProtectedRoute><DepartmentSection /></ProtectedRoute>} />
              <Route path="/curriculum_panel" element={<ProtectedRoute><CurriculumPanel /></ProtectedRoute>} />
              <Route path="/department_registration" element={<ProtectedRoute><DepartmentRegistration /></ProtectedRoute>} />
              <Route path="/section_panel" element={<ProtectedRoute><SectionPanel /></ProtectedRoute>} />
              <Route path="/professor_registration" element={<ProtectedRoute><DepartmentProf /></ProtectedRoute>} />
              <Route path="/student_profile_form" element={<ProtectedRoute><StudentProfileForm /></ProtectedRoute>} />
              <Route path="/year_level_panel" element={<ProtectedRoute><YearLevelPanel /></ProtectedRoute>} />
              <Route path="/year_panel" element={<ProtectedRoute><YearPanel /></ProtectedRoute>} />
              <Route path="/year_update_panel" element={<ProtectedRoute><YearUpdateForm /></ProtectedRoute>} />
              <Route path="/semester_panel" element={<ProtectedRoute><SemesterPanel /></ProtectedRoute>} />
              <Route path="/school_year_panel" element={<ProtectedRoute><SchoolYearPanel /></ProtectedRoute>} />
              <Route path="/school_year_activator_panel" element={<ProtectedRoute><SchoolYearActivatorPanel /></ProtectedRoute>} />
              <Route path="/history_logs" element={<ProtectedRoute><HistoryLogs /></ProtectedRoute>} />
              <Route path="/requirements_form" element={<ProtectedRoute><RequirementsForm /></ProtectedRoute>} />
              <Route path="/admission_dashboard" element={<ProtectedRoute><AdmissionDashboardPanel /></ProtectedRoute>} />
              <Route path="/department_dashboard" element={<ProtectedRoute><DepartmentManagement /></ProtectedRoute>} />
              <Route path="/system_dashboard" element={<ProtectedRoute><SystemDashboardPanel /></ProtectedRoute>} />
              <Route path="/account_dashboard" element={<ProtectedRoute><AccountDashboard /></ProtectedRoute>} />
              <Route path="/student_numbering" element={<ProtectedRoute><StudentNumbering /></ProtectedRoute>} />
              <Route path="/course_tagging" element={<ProtectedRoute><CourseTagging /></ProtectedRoute>} />
              <Route path="/schedule_checker/:dprtmnt_id" element={<ProtectedRoute><ScheduleChecker /></ProtectedRoute>} />
              <Route path="/change_grade_period" element={<ProtectedRoute><ChangeGradingPeriod /></ProtectedRoute>} />
              <Route path="/department_room" element={<ProtectedRoute><DepartmentRoom /></ProtectedRoute>} />
              <Route path="/search_cor" element={<ProtectedRoute><SearchCertificateOfRegistration /></ProtectedRoute>} />
              <Route path="/select_college" element={<ProtectedRoute><ScheduleFilterer /></ProtectedRoute>} />
              <Route path="/examination_profile" element={<ProtectedRoute><ExaminationProfile /></ProtectedRoute>} />
              <Route path="/assign_entrance_exam" element={<ProtectedRoute><AssignEntranceExam /></ProtectedRoute>} />
              <Route path="/assign_schedule_applicant" element={<ProtectedRoute><AssignScheduleToApplicants /></ProtectedRoute>} />
              <Route path="/applicant_scoring" element={<ProtectedRoute><ApplicantScoring /></ProtectedRoute>} />

              <Route path="/grading_sheet" element={<ProtectedRoute><GradingSheet /></ProtectedRoute>} />
              <Route path="/faculty_workload" element={<ProtectedRoute><FacultyWorkload /></ProtectedRoute>} />
              <Route path="/faculty_masterlist" element={<ProtectedRoute><FacultyMasterList /></ProtectedRoute>} />
              <Route path="/subject_masterlist/:subject_id/:department_section_id/:school_year_id" element={<ProtectedRoute><FacultyStudentClassList /></ProtectedRoute>} />
              <Route path="/faculty_schedule" element={<ProtectedRoute><FacultySchedule /></ProtectedRoute>} />
              <Route path="/class_list/:course_id/:department_section_id/:school_year_id" element={<ProtectedRoute><FacultyStudentList /></ProtectedRoute>} />



              <Route path="/student_dashboard" element={<ProtectedRoute allowedRoles={'student'}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              <Route path="/applicant_list" element={<ProtectedRoute><ApplicantList /></ProtectedRoute>} />
              <Route path="/applicant_list_admin" element={<ProtectedRoute><ApplicantListAdmin /></ProtectedRoute>} />
              <Route path="/proctor_applicant_list" element={<ProtectedRoute><ProctorApplicantList /></ProtectedRoute>} />
              <Route path="/medical_clearance" element={<ProtectedRoute><MedicalClearance /></ProtectedRoute>} />
              <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
              <Route path="/qualifying_exam" element={<ProtectedRoute><QualifyingExam /></ProtectedRoute>} />
              <Route path="/college_approval" element={<ProtectedRoute><CollegeApproval /></ProtectedRoute>} />


              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

              <Route path="/admin_dashboard1" element={<ProtectedRoute><AdminDashboard1 /></ProtectedRoute>} />
              <Route path="/admin_dashboard2" element={<ProtectedRoute><AdminDashboard2 /></ProtectedRoute>} />
              <Route path="/admin_dashboard3" element={<ProtectedRoute><AdminDashboard3 /></ProtectedRoute>} />
              <Route path="/admin_dashboard4" element={<ProtectedRoute><AdminDashboard4 /></ProtectedRoute>} />
              <Route path="/admin_dashboard5" element={<ProtectedRoute><AdminDashboard5 /></ProtectedRoute>} />

              <Route path="/super_admin_dashboard1" element={<ProtectedRoute><SuperAdminDashboard1 /></ProtectedRoute>} />
              <Route path="/super_admin_dashboard2" element={<ProtectedRoute><SuperAdminDashboard2 /></ProtectedRoute>} />
              <Route path="/super_admin_dashboard3" element={<ProtectedRoute><SuperAdminDashboard3 /></ProtectedRoute>} />
              <Route path="/super_admin_dashboard4" element={<ProtectedRoute><SuperAdminDashboard4 /></ProtectedRoute>} />
              <Route path="/super_admin_dashboard5" element={<ProtectedRoute><SuperAdminDashboard5 /></ProtectedRoute>} />


              <Route path="/dashboard1" element={<ProtectedRoute allowedRoles={['applicant']}><Dashboard1 /></ProtectedRoute>} />
              <Route path="/dashboard2" element={<ProtectedRoute allowedRoles={['applicant']}><Dashboard2 /></ProtectedRoute>} />
              <Route path="/dashboard3" element={<ProtectedRoute allowedRoles={['applicant']}><Dashboard3 /></ProtectedRoute>} />
              <Route path="/dashboard4" element={<ProtectedRoute allowedRoles={['applicant']}><Dashboard4 /></ProtectedRoute>} />
              <Route path="/dashboard5" element={<ProtectedRoute allowedRoles={['applicant']}><Dashboard5 /></ProtectedRoute>} />
              <Route path="/requirements_uploader" element={<ProtectedRoute allowedRoles={['applicant']}><RequirementUploader /></ProtectedRoute>} />
              <Route path="/student_requirements" element={<ProtectedRoute ><StudentRequirements /></ProtectedRoute>} />



              <Route
                path="/personal_data_form"
                element={
                  <ProtectedRoute allowedRoles={['applicant', 'registrar',]}>
                    <PersonalDataForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ecat_application_form"
                element={
                  <ProtectedRoute allowedRoles={['applicant', 'registrar']}>
                    <ECATApplicationForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admission_form_process"
                element={
                  <ProtectedRoute allowedRoles={['applicant', 'registrar']}>
                    <AdmissionFormProcess />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admission_services"
                element={
                  <ProtectedRoute allowedRoles={['applicant', 'registrar']}>
                    <AdmissionServices />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/office_of_the_registrar"
                element={
                  <ProtectedRoute allowedRoles={['applicant', 'registrar']}>
                    <OfficeOfTheRegistrar />
                  </ProtectedRoute>
                }
              />

              <Route path="/class_roster" element={<ProtectedRoute ><ClassRoster /></ProtectedRoute>} />
              <Route path="/class_roster/class_list/ccs/:curriculum_id" element={<ProtectedRoute ><ClassList /></ProtectedRoute>} />
              <Route path="/class_list/ccs/:curriculum_id/:dstID" element={<ProtectedRoute><ProfessorListPerSection /></ProtectedRoute>} />
              <Route path="/class_list/css/:curriculum_id/:dstID/:courseID/:professorID" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />


              <Route path="/add_exam_schedule" element={<ProtectedRoute><ExamScheduler /></ProtectedRoute>} />
              <Route path="/assigning_schedule" element={<ProtectedRoute><ExamScheduler2 /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>

        <footer>
          <Footer />
        </footer>

      </Router>
    </ThemeProvider>
  )
}

export default App