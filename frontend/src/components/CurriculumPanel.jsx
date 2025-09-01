import React, { useState, useEffect } from "react";
import axios from 'axios';
import { Box, Typography } from "@mui/material";

const CurriculumPanel = () => {
    const [curriculum, setCurriculum] = useState({ year_id: '', program_id: '' });
    const [yearList, setYearList] = useState([]);
    const [programList, setProgramList] = useState([]);
    const [curriculumList, setCurriculumList] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchYear();
        fetchProgram();
        fetchCurriculum();
    }, []);

    const fetchYear = async () => {
        try {
            const res = await axios.get('http://localhost:5000/year_table');
            setYearList(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProgram = async () => {
        try {
            const res = await axios.get('http://localhost:5000/get_program');
            setProgramList(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCurriculum = async () => {
        try {
            const res = await axios.get('http://localhost:5000/get_curriculum');
            setCurriculumList(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurriculum(prev => ({ ...prev, [name]: value }));
    };

    const handleAddCurriculum = async () => {
        if (!curriculum.year_id || !curriculum.program_id) {
            alert("Please fill all fields");
            return;
        }

        try {
            await axios.post('http://localhost:5000/curriculum', curriculum);
            setCurriculum({ year_id: '', program_id: '' });
            setSuccessMsg("Curriculum successfully added!");
            fetchCurriculum();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Box sx={{ maxWidth: "1200px", mx: "auto", mt: 3, px: 2 }}>
            <Typography
                variant="h4"
                fontWeight="bold"
                color="maroon"
                textAlign="center"
                gutterBottom
            >
                Curriculum Panel
            </Typography>
            <div style={styles.container}>
                {/* Left side: Form */}
                <div style={styles.panel}>
                    <h2 style={styles.header}>Add Curriculum</h2>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Curriculum Year:</label>
                        <select name="year_id" value={curriculum.year_id} onChange={handleChange} style={styles.select}>
                            <option value="">Choose Year</option>
                            {yearList.map(year => (
                                <option key={year.year_id} value={year.year_id}>
                                    {year.year_description}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Program:</label>
                        <select name="program_id" value={curriculum.program_id} onChange={handleChange} style={styles.select}>
                            <option value="">Choose Program</option>
                            {programList.map(program => (
                                <option key={program.program_id} value={program.program_id}>
                                    {program.program_description} | {program.program_code}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button style={styles.button} onClick={handleAddCurriculum}>Insert</button>
                    {successMsg && <p style={styles.success}>{successMsg}</p>}
                </div>

                {/* Right side: Curriculum List */}
                <div style={styles.listPanel}>
                    <h3 style={styles.listHeader}>Curriculum List</h3>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Year</th>
                                <th>Program</th>
                            </tr>
                        </thead>
                        <tbody>
                            {curriculumList.map(item => (
                                <tr key={item.curriculum_id}>
                                    <td>{item.curriculum_id}</td>
                                    <td>{item.year_description}</td>
                                    <td>{item.program_description} ({item.program_code})</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Box>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '20px',
        padding: '30px',
        fontFamily: 'Arial, sans-serif'
    },
    panel: {
        flex: 1,
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    },
    listPanel: {
        flex: 2,
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    },
    header: {
        marginBottom: '20px',
        color: '#800000'
    },
    inputGroup: {
        marginBottom: '15px'
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        fontWeight: 'bold'
    },
    select: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc'
    },
    button: {
        width: '100%',
        padding: '10px',
        backgroundColor: 'maroon',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    success: {
        marginTop: '15px',
        color: 'green',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    listHeader: {
        marginBottom: '10px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    tableHeader: {
        backgroundColor: '#eee'
    },
    tableCell: {
        border: '1px solid #ccc',
        padding: '8px',
        textAlign: 'left'
    }
};

export default CurriculumPanel;