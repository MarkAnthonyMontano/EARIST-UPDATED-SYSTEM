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
    Dialog,
    DialogTitle,
    DialogContent,
    Card,
    DialogActions,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { io } from "socket.io-client";
import { Snackbar, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton, InputAdornment } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { Link, useLocation, useNavigate } from "react-router-dom";

const socket = io("http://localhost:5000");

const StudentNumbering = () => {

    const tabs = [
        { label: "Applicant List", to: "/applicant_list", icon: <ListAltIcon /> },
        { label: "Applicant Form", to: "/admin_dashboard1", icon: <PersonIcon /> },
        { label: "Documents Submitted", to: "/student_requirements", icon: <DescriptionIcon /> },
        { label: "Interview / Qualifiying Exam", to: "/interview", icon: <SchoolIcon /> },
        { label: "College Approval", to: "/college_approval", icon: <CheckCircleIcon /> },
        { label: "Medical Clearance", to: "/medical_clearance", icon: <LocalHospitalIcon /> },
        { label: "Student Numbering", to: "/student_numbering", icon: <HowToRegIcon /> },
    ];

    const location = useLocation();
    const navigate = useNavigate();


    const handleStepClick = (index, to) => {
        setActiveStep(index);
        navigate(to); // this will actually change the page
    };



    const [authOpen, setAuthOpen] = useState(true);   // open when page loads
    const [authPassword, setAuthPassword] = useState("");
    const [authError, setAuthError] = useState("");
    const [authPassed, setAuthPassed] = useState(false);
    const [showAuthPassword, setShowAuthPassword] = useState(false);

    const handleAuthSubmit = async () => {
        if (!authPassword) {
            setAuthError("Password is required.");
            return;
        }
        try {
            const personId = localStorage.getItem("person_id"); // from main login
            const res = await axios.post("http://localhost:5000/api/verify-password", {
                person_id: personId,
                password: authPassword,
            });

            if (res.data.success) {
                setAuthPassed(true);
                setAuthOpen(false);
            } else {
                setAuthError("❌ Invalid password.");
            }
        } catch (err) {
            setAuthError("Server error. Try again.");
        }
    };

    const [activeStep, setActiveStep] = useState(6);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));
    const [explicitSelection, setExplicitSelection] = useState(false);

    const [persons, setPersons] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [assignedNumber, setAssignedNumber] = useState('');
    const [error, setError] = useState('');
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [showPassword, setShowPassword] = useState(false);

    // 🔑 For modal
    const [openModal, setOpenModal] = useState(false);
    const [password, setPassword] = useState("");


    const itemsPerPage = 100; // 🔧 adjustable

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

    // 🔑 Step 1: Open confirmation modal
    const openAssignModal = () => {
        if (!selectedPerson) return;
        setPassword("");   // ✅ clears any previously typed password
        setOpenModal(true);
    };

    const [userEmail, setUserEmail] = useState("");

    // fetch logged-in user email once (e.g. from localStorage or auth context)
    useEffect(() => {
        const storedEmail = localStorage.getItem("userEmail"); // adjust to your storage key
        if (storedEmail) setUserEmail(storedEmail);
    }, []);

    const confirmAssignNumber = async () => {
        try {
            socket.emit("assign-student-number", selectedPerson.person_id);

            socket.once("assign-student-number-result", (data) => {
                if (data.success) {
                    setAssignedNumber(data.student_number);
                    setSnack({
                        open: true,
                        message: "✅ Student number assigned and email sent.",
                        severity: "success",
                    });
                    fetchPersons();
                    setSelectedPerson(null);
                } else {
                    setSnack({
                        open: true,
                        message: data.message || "❌ Failed to assign student number.",
                        severity: "error",
                    });
                }
            });
        } catch (err) {
            setError("Server error. Try again.");
        }
    };



    const handleSnackClose = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnack(prev => ({ ...prev, open: false }));
    };

    if (!authPassed) {
        return (
            <Dialog open={authOpen}>
                <DialogTitle sx={{ color: "maroon", fontWeight: "bold" }}>
                    Enter Password to Continue
                </DialogTitle>
                <DialogContent>
                    <Typography mb={2}>
                        ⚠️ This action <strong>cannot be undone</strong>. You are acknowledging
                        this student as <strong>officially enrolled</strong>.
                    </Typography>

                    <TextField
                        label="Password"
                        type={showAuthPassword ? "text" : "password"}
                        fullWidth
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        autoComplete="new-password"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowAuthPassword(!showAuthPassword)}
                                    >
                                        {showAuthPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    {authError && (
                        <Typography color="error" sx={{ mt: 1 }}>
                            {authError}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        sx={{ backgroundColor: "maroon", color: "white" }}
                        onClick={handleAuthSubmit}
                    >
                        Yes, I Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

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

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    mt: 2,
                    flexWrap: "wrap", // so it wraps on smaller screens
                }}
            >
                {tabs.map((tab, index) => (
                    <React.Fragment key={index}>
                        {/* Step Card */}
                        <Card
                            onClick={() => handleStepClick(index, tab.to)}
                            sx={{
                                flex: 1,
                                maxWidth: `${100 / tabs.length}%`, // evenly fit in one row
                                height: 100,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                borderRadius: 2,
                                border: "2px solid #6D2323",

                                backgroundColor: activeStep === index ? "#6D2323" : "#E8C999",
                                color: activeStep === index ? "#fff" : "#000",
                                boxShadow:
                                    activeStep === index
                                        ? "0px 4px 10px rgba(0,0,0,0.3)"
                                        : "0px 2px 6px rgba(0,0,0,0.15)",
                                transition: "0.3s ease",
                                "&:hover": {
                                    backgroundColor: activeStep === index ? "#5a1c1c" : "#f5d98f",
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}
                            >
                                <Box sx={{ fontSize: 32, mb: 0.5 }}>{tab.icon}</Box>
                                <Typography
                                    sx={{ fontSize: 14, fontWeight: "bold", textAlign: "center" }}
                                >
                                    {tab.label}
                                </Typography>
                            </Box>
                        </Card>

                        {/* Spacer instead of line */}
                        {index < tabs.length - 1 && (
                            <Box
                                sx={{
                                    flex: 0.1,
                                    mx: 1, // keeps spacing between cards
                                }}
                            />
                        )}
                    </React.Fragment>
                ))}
            </Box>
            <br />


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
                                    <Typography fontSize="14px" fontWeight="bold" color="white">
                                        Total Applicant's: {filteredPersons.length}
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
                                onClick={confirmAssignNumber}   // 👈 directly run the assign logic
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
