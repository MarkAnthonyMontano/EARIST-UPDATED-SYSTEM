import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Typography } from "@mui/material";

const ProgramTagging = () => {
  const [progTag, setProgTag] = useState({
    curriculum_id: "",
    year_level_id: "",
    semester_id: "",
    course_id: "",
  });

  const [courseList, setCourseList] = useState([]);
  const [yearLevelList, setYearlevelList] = useState([]);
  const [semesterList, setSemesterList] = useState([]);
  const [curriculumList, setCurriculumList] = useState([]);
  const [taggedPrograms, setTaggedPrograms] = useState([]);

  useEffect(() => {
    fetchCourse();
    fetchYearLevel();
    fetchSemester();
    fetchCurriculum();
    fetchTaggedPrograms(); // Fetch the tagged programs to display
  }, []);

  const fetchYearLevel = async () => {
    try {
      const response = await axios.get("http://localhost:5000/get_year_level");
      setYearlevelList(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchSemester = async () => {
    try {
      const response = await axios.get("http://localhost:5000/get_semester");
      setSemesterList(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCurriculum = async () => {
    try {
      const response = await axios.get("http://localhost:5000/get_curriculum");
      setCurriculumList(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCourse = async () => {
    try {
      const response = await axios.get("http://localhost:5000/course_list");
      setCourseList(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchTaggedPrograms = async () => {
    try {
      const response = await axios.get("http://localhost:5000/prgram_tagging_list");
      setTaggedPrograms(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleChangesForEverything = (e) => {
    const { name, value } = e.target;
    setProgTag((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInsertingProgTag = async () => {
    const { curriculum_id, year_level_id, semester_id, course_id } = progTag;

    if (!curriculum_id || !year_level_id || !semester_id || !course_id) {
      alert("Please fill all fields");
      return;
    }

    try {
      await axios.post("http://localhost:5000/program_tagging", progTag);
      fetchTaggedPrograms(); // Refresh the tagged programs list after successful insertion
      setProgTag({
        curriculum_id: "",
        year_level_id: "",
        semester_id: "",
        course_id: "",
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Box sx={{ maxWidth: "1200px", mx: "auto", mt: 5, px: 2 }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        color="maroon"
        textAlign="center"
        gutterBottom
      >
        Program and Course Management
      </Typography>
      <div style={styles.container}>
        <div style={styles.formSection}>

          <div style={styles.formGroup}>
            <label style={styles.label}>Curriculum:</label>
            <select
              name="curriculum_id"
              value={progTag.curriculum_id}
              onChange={handleChangesForEverything}
              style={styles.select}
            >
              <option value="">Choose Curriculum</option>
              {curriculumList.map((curriculum) => (
                <option key={curriculum.curriculum_id} value={curriculum.curriculum_id}>
                  {curriculum.year_description} - {curriculum.program_description} | {curriculum.curriculum_id}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Course:</label>
            <select
              name="course_id"
              value={progTag.course_id}
              onChange={handleChangesForEverything}
              style={styles.select}
            >
              <option value="">Choose Course</option>
              {courseList.map((course) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.course_code} - {course.course_description} | {course.course_id}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Year Level:</label>
            <select
              name="year_level_id"
              value={progTag.year_level_id}
              onChange={handleChangesForEverything}
              style={styles.select}
            >
              <option value="">Choose Year Level</option>
              {yearLevelList.map((year) => (
                <option key={year.year_level_id} value={year.year_level_id}>
                  {year.year_level_description}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Semester:</label>
            <select
              name="semester_id"
              value={progTag.semester_id}
              onChange={handleChangesForEverything}
              style={styles.select}
            >
              <option value="">Choose Semester</option>
              {semesterList.map((semester) => (
                <option key={semester.semester_id} value={semester.semester_id}>
                  {semester.semester_description}
                </option>
              ))}
            </select>
          </div>

          <button onClick={handleInsertingProgTag} style={styles.button}>
            Insert Program Tag
          </button>
        </div>

        <div style={styles.displaySection}>
          <h3>Tagged Programs</h3>
          <div style={styles.taggedProgramsContainer}>
            {taggedPrograms.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Curriculum</th>
                    <th>Course</th>
                    <th>Year Level</th>
                    <th>Semester</th>
                  </tr>
                </thead>
                <tbody style={styles.tbody}>
                  {taggedPrograms.map((program, index) => (
                    <tr key={program.program_id || index}>
                      <td>{program.curriculum_description}</td>
                      <td>{program.course_description}</td>
                      <td>{program.year_level_description}</td>
                      <td>{program.semester_description}</td>
                    </tr>
                  ))}
                </tbody>

              </table>
            ) : (
              <p>No tagged programs available.</p>
            )}
          </div>
        </div>
      </div>
    </Box>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "space-between",
    gap: "40px", // Increased gap for more space between sections
    maxWidth: "1200px",
    margin: "30px auto",
    flexWrap: "wrap", // Ensures layout is responsive on smaller screens
  },
  formSection: {
    width: "48%",  // Increased width of the form section for more space
    background: "#f8f8f8",
    padding: "25px", // Added more padding for space
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    boxSizing: "border-box", // Ensures padding doesn't affect width
  },
  displaySection: {
    width: "48%", // Increased width of the display section for more space
    background: "#f8f8f8",
    padding: "25px", // Added more padding for space
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    overflowY: "auto",
    maxHeight: "600px",
    flex: "1 1 48%",  // Ensures the display section takes equal space
    marginTop: "10px", // Spacing between sections
    boxSizing: "border-box", // Ensures padding doesn't affect width
  },
  heading: {
    textAlign: "center",
    marginBottom: "25px", // Increased bottom margin for space
    color: "#333",
    fontSize: "24px", // Increased font size for heading
  },
  formGroup: {
    marginBottom: "20px", // Increased margin between form fields
  },
  label: {
    display: "block",
    marginBottom: "8px", // Increased margin for labels
    fontWeight: "bold",
    color: "#444",
    fontSize: "16px", // Adjusted font size for readability
  },
  select: {
    width: "100%",
    padding: "12px", // Increased padding for better clickability
    fontSize: "16px", // Increased font size for easier reading
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    marginTop: "25px", // Added more space above the button
    width: "100%",
    padding: "14px", // Increased button padding
    fontSize: "18px", // Increased font size for better readability
    backgroundColor: "maroon",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },


  taggedProgramsContainer: {
    overflowY: "auto",
    maxHeight: "500px", // Increased height for more space
    marginTop: "15px", // Added more space above the table
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px", // Added space between table and text
  },
  th: {
    backgroundColor: "#f1f1f1",
    padding: "15px", // Increased padding for table headers
    textAlign: "left",
    fontWeight: "bold",
    fontSize: "16px", // Adjusted font size for better readability
  },
  td: {
    padding: "12px", // Increased padding for table data
    textAlign: "left",
    borderBottom: "1px solid #ddd",
    fontSize: "16px", // Adjusted font size for better readability
  },
  tbody: {
    width: "fit-content",
  }
};


export default ProgramTagging;