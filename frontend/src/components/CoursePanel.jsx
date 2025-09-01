import React, { useState, useEffect } from "react";
import axios from 'axios';
import {
    Typography,

} from '@mui/material';

const CoursePanel = () => {
    const [course, setCourse] = useState({
        course_code: '',
        course_description: '',
        course_unit: '',
        lab_unit: '',
    });

    const [courseList, setCourseList] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');

    const handleChangesForEverything = (e) => {
        const { name, value } = e.target;
        setCourse(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const fetchCourses = async () => {
        try {
            const response = await axios.get('http://localhost:5000/course_list');
            setCourseList(response.data);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleAddingCourse = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/adding_course', course);
            setCourse({
                course_code: '',
                course_description: '',
                course_unit: '',
                lab_unit: '',
            });
            setSuccessMsg("Course successfully added!");
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchCourses(); // refresh the list
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div style={styles.panel}>
            <Typography
                variant="h4"
                fontWeight="bold"
                color="maroon"
                textAlign="center"
                gutterBottom
            >
                Course Panel
            </Typography>
            <div style={styles.flexContainer}>
                {/* Form on the Left */}
                <div style={styles.leftPane}>
                    <h3 style={{ color: '#800000' }}>Add New Course</h3>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Course Description:</label>
                        <input type="text" name="course_description" value={course.course_description} onChange={handleChangesForEverything} placeholder="Enter Course Description" style={styles.input} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Course Code:</label>
                        <input type="text" name="course_code" value={course.course_code} onChange={handleChangesForEverything} placeholder="Enter Course Code" style={styles.input} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Course Unit:</label>
                        <input type="text" name="course_unit" value={course.course_unit} onChange={handleChangesForEverything} placeholder="Enter Course Unit" style={styles.input} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Laboratory Unit:</label>
                        <input type="text" name="lab_unit" value={course.lab_unit} onChange={handleChangesForEverything} placeholder="Enter Laboratory Unit" style={styles.input} />
                    </div>
                    <button style={styles.button} onClick={handleAddingCourse}>Insert</button>
                    {successMsg && <p style={styles.success}>{successMsg}</p>}
                </div>

                {/* Course List on the Right */}
                <div style={styles.rightPane}>
                    <h3>All Courses</h3>
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Description</th>
                                    <th>Code</th>
                                    <th>Course Unit</th>
                                    <th>Lab Unit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courseList.map(course => (
                                    <tr key={course.course_id}>
                                        <td>{course.course_id}</td>
                                        <td>{course.course_description}</td>
                                        <td>{course.course_code}</td>
                                        <td>{course.course_unit}</td>
                                        <td>{course.lab_unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    panel: {
        maxWidth: '1200px',
        margin: '30px auto',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        fontFamily: 'Arial, sans-serif',
    },
    header: {
        textAlign: 'center',
        marginBottom: '20px',
        color: '#800000',
    },
    flexContainer: {
        display: 'flex',
        gap: '30px',
        alignItems: 'flex-start',
    },
    leftPane: {
        flex: 1,
    },
    rightPane: {
        flex: 2,
    },
    inputGroup: {
        marginBottom: '15px',
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
    },
    button: {
        width: '100%',
        padding: '10px',
        backgroundColor: 'maroon',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    success: {
        marginTop: '15px',
        color: 'green',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    tableContainer: {
        maxHeight: '400px',
        overflowY: 'auto',
        border: '1px solid #ccc',
        borderRadius: '4px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
};

export default CoursePanel;