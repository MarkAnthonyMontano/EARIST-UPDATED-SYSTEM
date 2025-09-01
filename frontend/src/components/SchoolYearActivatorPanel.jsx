import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Typography,

} from '@mui/material';


const SchoolYearActivatorPanel = () => {
    const [schoolYears, setSchoolYears] = useState([]);

    const fetchSchoolYears = async () => {
        try {
            const res = await axios.get("http://localhost:5000/school_years");
            setSchoolYears(res.data);
        } catch (error) {
            console.error("Error fetching school years:", error);
        }
    };

    const toggleActivator = async (schoolYearId, currentStatus) => {
        try {
            const updatedStatus = currentStatus === 1 ? 0 : 1;

            if (updatedStatus === 1) {
                // Deactivate all others first
                await axios.put("http://localhost:5000/school_years/deactivate_all");
            }

            // Update the selected school year
            await axios.put(`http://localhost:5000/school_years/${schoolYearId}`, {
                activator: updatedStatus,
            });

            fetchSchoolYears(); // Refresh after change
        } catch (error) {
            console.error("Error updating activator:", error);
        }
    };

    useEffect(() => {
        fetchSchoolYears();
    }, []);

    return (
        <div className="p-4 max-w-2xl mx-auto">
           <Typography variant="h4" color="maroon" fontWeight="bold" textAlign="center" gutterBottom>
       School Year Activator Panel
      </Typography>
            <table className="w-full border border-gray-300" >
                <thead>
                    <tr className="bg-gray-200">
                        <th className="p-2 border">Year Level</th>
                        <th className="p-2 border">Semester</th>
                        <th className="p-2 border">Status</th>
                        <th className="p-2 border">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {schoolYears.map((sy) => (
                        <tr key={sy.id}>
                            <td className="p-2 border">
                                {`${sy.year_description}-${parseInt(sy.year_description) + 1}`}
                            </td>
                            <td className="p-2 border">{sy.semester_description}</td>
                            <td className="p-2 border">{sy.astatus === 1 ? "Active" : "Inactive"}</td>
                            <td className="p-2 border">
                                <button
                                    className={`px-3 py-1 rounded text-white w-full ${
                                        sy.astatus === 1 ? "bg-red-600" : "bg-green-600"
                                    }`}
                                    onClick={() => toggleActivator(sy.id, sy.astatus)}
                                >
                                    {sy.astatus === 1 ? "Deactivate" : "Activate"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SchoolYearActivatorPanel;
