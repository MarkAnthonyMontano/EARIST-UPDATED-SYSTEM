import NotificationsIcon from '@mui/icons-material/Notifications';
import React from "react";
import { Link } from 'react-router-dom';

const HistoryLogs = () => {
  return (
    <div className="p-2 px-10 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

        <div className="relative">
          <Link to={'/notifications'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <NotificationsIcon className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              NOTIFICATIONS
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default HistoryLogs;
