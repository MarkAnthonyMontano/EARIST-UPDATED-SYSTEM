import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const ProfessorListPerSection = () => {
  const { curriculum_id, dstID } = useParams();
  const [profList, setProfessor] = useState([]);

  const fetchProfessor = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/class_roster/${curriculum_id}/${dstID}`);
      setProfessor(response.data);
    } catch (err) {
      console.error("Error fetching professor list:", err);
    }
  };

  useEffect(() => {
    fetchProfessor();
  }, [curriculum_id, dstID]);

  const program_code = profList[0]?.program_code || "";
  const section_description = profList[0]?.section_description || "";

  return (
    <div className="mt-3 flex justify-center">
      {profList.length === 0 ? (
        <p>No Professor Enrolled in this section</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          cellSpacing="0"
          className="table-auto border-collapse border border-black"
        >
          <thead>
            <tr>
              <th colSpan={4} className="text-center py-2">
                Section {program_code} - {section_description}
              </th>
            </tr>
            <tr>
              <th className="border border-black px-4 py-2">Course</th>
              <th className="border border-black px-4 py-2">Professor Name</th>
              <th className="border border-black px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {profList.map((prof, index) => (
              <tr key={index}>
                <td className="border border-black px-4 py-2">
                  {prof.course_description} ({prof.course_code})
                </td>
                <td className="border border-black px-4 py-2">
                  {prof.fname} {prof.mname} {prof.lname}
                </td>
                <td className="border border-black px-4 py-2 text-blue-500 underline">
                  <Link to={`/class_list/css/${curriculum_id}/${dstID}/${prof.course_id}/${prof.prof_id}`}>
                    View Class
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProfessorListPerSection;
