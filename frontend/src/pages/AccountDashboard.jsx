import { ListAlt, PersonAdd, LockReset } from "@mui/icons-material";
import React from "react";
import { Link } from 'react-router-dom';

const AccountDashboard = () => {
  return (
    <div className="p-2 px-10 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

        <div className="relative">
          <Link to={'/register_prof'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <PersonAdd className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              ACCOUNT PROFESSOR
            </button>
          </Link>
        </div>

        <div className="relative">
          <Link to={'/department_section_panel'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <ListAlt className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              STUDENT INFO UPDATE FORM
            </button>
          </Link>
        </div>

        <div className="relative">
          <Link to={'/registrar_reset_password'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <LockReset className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              RESET PASSWORD
            </button>
          </Link>
        </div>

  

          <div className="relative">
          <Link to={'/superadmin_applicant_reset_password'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <LockReset className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              APPLICANT RESET PASSWORD
            </button>
          </Link>
        </div>

          <div className="relative">
          <Link to={'/superadmin_student_reset_password'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <LockReset className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              STUDENT RESET PASSWORD
            </button>
          </Link>
        </div>

          <div className="relative">
          <Link to={'/superadmin_faculty_reset_password'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <LockReset className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              FACULTY RESET PASSWORD
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AccountDashboard;
