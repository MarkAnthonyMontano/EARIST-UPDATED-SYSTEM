import { CollectionsBookmark, Description, EditNote } from "@mui/icons-material";
import React from "react";
import { Link } from 'react-router-dom';

const SystemDashboardPanel = () => {
  return (
    <div className="p-2 px-10 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

        <div className="relative">
          <Link to={'/requirements_form'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <CollectionsBookmark className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              REQUIREMENTS PANEL
            </button>
          </Link>
        </div>

        <div className="relative">
          <Link to={'/room_registration'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <Description className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              ROOM FORM
            </button>
          </Link>
        </div>

        <div className="relative">
          <Link to={'/section_panel'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <EditNote className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              SECTION PANEL FORM
            </button>
          </Link>
        </div>

        <div className="relative">
          <Link to={'/semester_panel'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <CollectionsBookmark className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              SEMESTER PANEL FORM
            </button>
          </Link>
        </div>

        <div className="relative">
          <Link to={'/change_grade_period'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <CollectionsBookmark className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              CHANGE GRADING PERIOD
            </button>
          </Link>
        </div>

        <div className="relative">
          <Link to={'/year_update_panel'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <Description className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              YEAR UPDATE PANEL
            </button>
          </Link>
        </div>

        <div className="relative">
          <Link to={'/school_year_activator_panel'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <EditNote className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              SCHOOL YEAR ACTIVATOR PANEL
            </button>
          </Link>
        </div>

        <div className="relative">
          <Link to={'/year_level_panel'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <CollectionsBookmark className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              YEAR LEVEL PANEL FORM
            </button>
          </Link>
        </div>

        <div className="relative">
          <Link to={'/year_panel'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <EditNote className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              YEAR PANEL FORM
            </button>
          </Link>
        </div>

        <div className="relative">
          <Link to={'/school_year_panel'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <CollectionsBookmark className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              SCHOOL YEAR PANEL
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default SystemDashboardPanel;
