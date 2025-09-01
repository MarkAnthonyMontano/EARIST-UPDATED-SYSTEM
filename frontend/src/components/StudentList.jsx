import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const StudentList = () => {
  const { curriculum_id, dstID, courseID, professorID } = useParams();
  const [studentList, setStudent] = useState([]);
  const [classInfo, setClassInfo] = useState({
    section_Description: '',
    course_description: '',
    course_code: '',
    course_unit: '',
    fname: '',
    mname: '',
    lname: '',
    semester_description: '',
    year_level_description: '',
    day: '',
    school_time_start: '',
    school_time_end: '',
  });

  const fetchStudent = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/class_roster/student_info/${curriculum_id}/${dstID}/${courseID}/${professorID}`
      );
      setStudent(response.data);
    } catch (err) {
      console.error("Error fetching student list:", err);
    }
  };

  const fetchClassInfo = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/class_roster/classinfo/${curriculum_id}/${dstID}/${courseID}/${professorID}`
      );
      setClassInfo(response.data[0] || {});
    } catch (err) {
      console.error("Error fetching class info:", err);
    }
  };

  useEffect(() => {
    fetchStudent();
    fetchClassInfo();
  }, [curriculum_id, dstID, courseID, professorID]);

  const dayMap = {
    MON: "Monday",
    TUE: "Tuesday",
    WED: "Wednesday",
    THU: "Thursday",
    FRI: "Friday",
    SAT: "Saturday",
    SUN: "Sunday"
  };

  const formattedDay = dayMap[classInfo.day] || classInfo.day;
  const program_code = studentList[0]?.program_code || "";


  const divToPrintRef = useRef();

  const printDiv = () => {
    const divToPrint = divToPrintRef.current;
    if (divToPrint) {
      const newWin = window.open('', 'Print-Window');
      newWin.document.open();
      newWin.document.write(`
      <html>
        <head>
          <title>Print</title>
       <style>
  @page {
    size: Legal;
    margin: 0;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 210mm;
    height: 297mm;
    font-family: Arial, sans-serif;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

.print-container {
  width: 100%;
  height: auto;
  padding: 10px 20px;
}

  .student-table {
    margin-top: 0 !important;
  }

  button {
    display: none;
  }

    .student-table {
    margin-top: -40px !important;
  }

  svg.MuiSvgIcon-root {
  margin-top: -53px;
    width: 70px !important;
    height: 70px !important;
  }
</style>

        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 100);">
          <div class="print-container">
            ${divToPrint.innerHTML}
          </div>
        </body>
      </html>
    `);
      newWin.document.close();
    } else {
      console.error("divToPrintRef is not set.");
    }
  };


  return (
    <div className="mr-[1rem] mt-4" ref={divToPrintRef}>
      <style>
        {`
          @media print {
            button {
              display: none;
            }
          }
        `}
      </style>
      <button onClick={printDiv}>
        Print
      </button>
      {studentList.length === 0 ? (
        <p>No students enrolled in this section and course.</p>
      ) : (
        <div className="max-w-max">
          <div className="flex">
            <div className="w-[30%]">Section: {program_code} - {classInfo.section_Description}</div>
            <div className="w-[55%]">Course: {classInfo.course_description} ({classInfo.course_code})</div>
            <div className="w-[10%]">Unit: {classInfo.course_unit}</div>
          </div>
          <div className="flex">
            <div className="w-[30%]">Time: {formattedDay}, {classInfo.school_time_start} - {classInfo.school_time_end}</div>
            <div className="w-[35%]">Professor Name: {classInfo.fname} {classInfo.mname} {classInfo.lname}</div>
            <div className="w-[20%]">Semester: {classInfo.semester_description}</div>
            <div className="w-[15%]">Year Level: {classInfo.year_level_description}</div>
          </div>
          <table
            border="1"
            cellPadding="8"
            cellSpacing="0"
            className="table-auto mt-[1rem] w-full border-collapse max-w-max border border-black"
          >
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-4 py-2">Student Number</th>
                <th className="border border-black px-4 py-2">Student Name</th>
                <th className="border border-black px-4 py-2">Program</th>
                <th className="border border-black px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {studentList.map((student, index) => (
                <tr key={index}>
                  <td className="border border-black px-4 py-2">{student.student_number}</td>
                  <td className="border border-black px-4 py-2">
                    {student.first_name} {student.middle_name} {student.last_name}
                  </td>
                  <td className="border border-black px-4 py-2 text-blue-500">
                    {student.program_description} ({student.program_code})
                  </td>
                  <td className="border border-black px-4 py-2">ENROLLED</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentList;
