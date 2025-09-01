import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Typography,
    Paper,
    TextField,
    TableContainer,
    Table,
    FormControl,
    Select,
    MenuItem,
    TableHead,
    TableRow,
    TableCell,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { io } from "socket.io-client";
import { Snackbar, Alert } from '@mui/material';

const socket = io("http://localhost:5000");

const StudentNumbering = () => {
    const [persons, setPersons] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [assignedNumber, setAssignedNumber] = useState('');
    const [error, setError] = useState('');
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // 🔧 adjustable

    // ✅ Filtering persons by search
    const filteredPersons = persons.filter((p) =>
        [p.first_name, p.middle_name, p.last_name, p.emailAddress, p.applicant_number]
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    // ✅ Pagination logic
    const totalPages = Math.ceil(filteredPersons.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentPersons = filteredPersons.slice(startIndex, startIndex + itemsPerPage);

    const fetchPersons = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/persons');
            setPersons(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPersons();
    }, []);

    const handlePersonClick = (person) => {
        setSelectedPerson(person);
        setAssignedNumber('');
        setError('');
    };

    const handleAssignNumber = () => {
        if (!selectedPerson) return;

        socket.emit("assign-student-number", selectedPerson.person_id);

        socket.once("assign-student-number-result", (data) => {
            if (data.success) {
                setAssignedNumber(data.student_number);
                setSnack({ open: true, message: "Student number assigned and email sent.", severity: "success" });
                fetchPersons();
                setSelectedPerson(null);
            } else {
                setSnack({ open: true, message: data.message || "❌ Failed to assign student number.", severity: "error" });
            }
        });
    };

    const handleSnackClose = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnack(prev => ({ ...prev, open: false }));
    };

    return (
        <Box sx={{ height: 'calc(100vh - 150px)', overflowY: 'auto', pr: 1, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" fontWeight="bold" color="maroon">
                    ASSIGN STUDENT NUMBER
                </Typography>

                <TextField
                    variant="outlined"
                    placeholder="Search Applicant Name / Email / Applicant ID"
                    size="small"
                    style={{ width: '425px' }}
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    InputProps={{
                        startAdornment: <Search sx={{ mr: 1 }} />,
                    }}
                />
            </Box>
            <hr style={{ border: "1px solid #ccc", width: "100%" }} />
            <br/>

            <TableContainer component={Paper} sx={{ width: '100%' }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
                        <TableRow>
                            <TableCell
                                colSpan={10}
                                sx={{
                                    border: "2px solid maroon",
                                    py: 0.5,
                                    backgroundColor: '#6D2323',
                                    color: "white"
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center" >
                                    {/* Left: Applicant List Count */}
                                    <Typography fontSize="14px" fontWeight="bold" color="white" >
                                        Applicant List:
                                    </Typography>

                                    {/* Right: Pagination Controls */}
                                    <Box display="flex" alignItems="center" gap={1}>
                                        {/* First & Prev */}
                                        <Button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                minWidth: 80,
                                                color: "white",
                                                borderColor: "white",
                                                backgroundColor: "transparent",
                                                '&:hover': {
                                                    borderColor: 'white',
                                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                                },
                                                '&.Mui-disabled': {
                                                    color: "white",
                                                    borderColor: "white",
                                                    backgroundColor: "transparent",
                                                    opacity: 1,
                                                },
                                            }}
                                        >
                                            First
                                        </Button>

                                        <Button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                minWidth: 80,
                                                color: "white",
                                                borderColor: "white",
                                                backgroundColor: "transparent",
                                                '&:hover': {
                                                    borderColor: 'white',
                                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                                },
                                                '&.Mui-disabled': {
                                                    color: "white",
                                                    borderColor: "white",
                                                    backgroundColor: "transparent",
                                                    opacity: 1,
                                                },
                                            }}
                                        >
                                            Prev
                                        </Button>

                                        {/* Page Dropdown */}
                                        <FormControl size="small" sx={{ minWidth: 80 }}>
                                            <Select
                                                value={currentPage}
                                                onChange={(e) => setCurrentPage(Number(e.target.value))}
                                                displayEmpty
                                                sx={{
                                                    fontSize: '12px',
                                                    height: 36,
                                                    color: 'white',
                                                    border: '1px solid white',
                                                    backgroundColor: 'transparent',
                                                    '.MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'white',
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'white',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'white',
                                                    },
                                                    '& svg': {
                                                        color: 'white',
                                                    }
                                                }}
                                                MenuProps={{
                                                    PaperProps: {
                                                        sx: {
                                                            maxHeight: 200,
                                                            backgroundColor: '#fff',
                                                        }
                                                    }
                                                }}
                                            >
                                                {Array.from({ length: totalPages }, (_, i) => (
                                                    <MenuItem key={i + 1} value={i + 1}>
                                                        Page {i + 1}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <Typography fontSize="11px" color="white">
                                            of {totalPages} page{totalPages > 1 ? 's' : ''}
                                        </Typography>

                                        {/* Next & Last */}
                                        <Button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                minWidth: 80,
                                                color: "white",
                                                borderColor: "white",
                                                backgroundColor: "transparent",
                                                '&:hover': {
                                                    borderColor: 'white',
                                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                                },
                                                '&.Mui-disabled': {
                                                    color: "white",
                                                    borderColor: "white",
                                                    backgroundColor: "transparent",
                                                    opacity: 1,
                                                },
                                            }}
                                        >
                                            Next
                                        </Button>

                                        <Button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                minWidth: 80,
                                                color: "white",
                                                borderColor: "white",
                                                backgroundColor: "transparent",
                                                '&:hover': {
                                                    borderColor: 'white',
                                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                                },
                                                '&.Mui-disabled': {
                                                    color: "white",
                                                    borderColor: "white",
                                                    backgroundColor: "transparent",
                                                    opacity: 1,
                                                },
                                            }}
                                        >
                                            Last
                                        </Button>
                                    </Box>
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </TableContainer>

            {/* ✅ Applicant List */}
            <Box sx={{ display: 'flex', gap: 4, mt: 2, }}>
                <Box flex={1}>
                    {currentPersons.length === 0 && <Typography>No matching students.</Typography>}
                    {currentPersons.map((person, index) => (
                        <Paper
                            key={person.person_id}
                            onClick={() => handlePersonClick(person)}
                            elevation={2}
                            sx={{
                                p: 1,
                                mb: 0.5,

                                border: '2px solid #800000',
                                cursor: 'pointer',
                                backgroundColor:
                                    selectedPerson?.person_id === person.person_id ? '#800000' : 'white',
                                color:
                                    selectedPerson?.person_id === person.person_id ? 'white' : '#800000',
                                '&:hover': {
                                    backgroundColor: '#800000',
                                    color: 'white',
                                },
                            }}
                        >
                            <Box sx={{ display: "flex", gap: "10px", px: 2, fontSize: "14px" }}>
                                <span>{startIndex + index + 1}.</span>
                                <span>{person.applicant_number || "N/A"}</span> |
                                <span>{person.first_name} {person.middle_name} {person.last_name}</span> |
                                <span>{person.emailAddress}</span>
                            </Box>
                        </Paper>
                    ))}
                </Box>

                {/* Selected Person + Assignment */}
                <Box flex={1}>
                    <Typography fontSize={16} fontWeight="bold" gutterBottom color="#800000">
                        Selected Person:
                    </Typography>


                    {selectedPerson ? (
                        <Box>
                            <Typography style={{ fontSize: "16px" }}>
                                <strong>Applicant ID:</strong> {selectedPerson.applicant_number || "N/A"} <br />
                                <strong>Name:</strong> {selectedPerson.first_name} {selectedPerson.middle_name} {selectedPerson.last_name}<br />
                                <strong>Email Address:</strong> {selectedPerson.emailAddress}
                            </Typography>

                            <Button
                                variant="contained"
                                sx={{ mt: 2, backgroundColor: '#800000', color: 'white' }}
                                onClick={handleAssignNumber}
                            >
                                Assign Student Number
                            </Button>
                        </Box>
                    ) : (
                        <Typography>No person selected.</Typography>
                    )}

                    {assignedNumber && (
                        <Typography mt={2} color="green">
                            <strong>Assigned Student Number:</strong> {assignedNumber}
                        </Typography>
                    )}

                    {error && (
                        <Typography mt={2} color="error">
                            {error}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Snackbar
                open={snack.open}
                onClose={handleSnackClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackClose} severity={snack.severity} sx={{ width: '100%' }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default StudentNumbering;
