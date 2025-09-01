import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Typography,
    Paper,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    FormControl,
    Select,
    Card,
    TableCell,
    TextField,
    MenuItem,
    InputLabel,
    Checkbox,
    TableBody,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { io } from "socket.io-client";
import { Snackbar, Alert } from '@mui/material';
import { useNavigate, useLocation } from "react-router-dom";
import NotificationsIcon from '@mui/icons-material/Notifications';
import { FcPrint } from "react-icons/fc";
import EaristLogo from "../assets/EaristLogo.png";
import { Link } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { Stepper, Step, StepLabel } from "@mui/material";


const socket = io("http://localhost:5000");

const ApplicantList = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const queryPersonId = (queryParams.get("person_id") || "").trim();

    const handleRowClick = (person_id) => {
        if (!person_id) return;

        sessionStorage.setItem("admin_edit_person_id", String(person_id));
        sessionStorage.setItem("admin_edit_person_id_source", "applicant_list");
        sessionStorage.setItem("admin_edit_person_id_ts", String(Date.now()));

        // ✅ Always pass person_id in the URL
        navigate(`/admin_dashboard1?person_id=${person_id}`);
    };



    const tabs1 = [
        { label: "Applicant List", to: "/applicant_list", icon: <ListAltIcon /> },
        { label: "Applicant Form", to: "/admin_dashboard1", icon: <PersonIcon /> },
        { label: "Documents Submitted", to: "/student_requirements", icon: <DescriptionIcon /> },
        { label: "Interview", to: "/interview", icon: <RecordVoiceOverIcon /> },
        { label: "Qualifying Exam", to: "/qualifying_exam", icon: <SchoolIcon /> },
        { label: "College Approval", to: "/college_approval", icon: <CheckCircleIcon /> },
        { label: "Medical Clearance", to: "/medical_clearance", icon: <LocalHospitalIcon /> },
        { label: "Applicant Status", to: "/applicant_status", icon: <HowToRegIcon /> },
    ];

    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs1.length).fill(false));


    const handleStepClick = (index, to) => {
        setActiveStep(index);
        const pid = sessionStorage.getItem("admin_edit_person_id");

        if (pid && to !== "/applicant_list") {
            navigate(`${to}?person_id=${pid}`);
        } else {
            navigate(to);
        }
    };


    useEffect(() => {
        if (location.search.includes("person_id")) {
            navigate("/applicant_list", { replace: true });
        }
    }, [location, navigate]);

    const [persons, setPersons] = useState([]);

    const [selectedPerson, setSelectedPerson] = useState(null);
    const [assignedNumber, setAssignedNumber] = useState('');
    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");


    useEffect(() => {
        const storedUser = localStorage.getItem("email");
        const storedRole = localStorage.getItem("role");
        const loggedInPersonId = localStorage.getItem("person_id");
        const searchedPersonId = sessionStorage.getItem("admin_edit_person_id");

        if (!storedUser || !storedRole || !loggedInPersonId) {
            window.location.href = "/login";
            return;
        }

        setUser(storedUser);
        setUserRole(storedRole);

        const allowedRoles = ["registrar", "applicant", "superadmin"];
        if (allowedRoles.includes(storedRole)) {
            const targetId = queryPersonId || searchedPersonId || loggedInPersonId;
            sessionStorage.setItem("admin_edit_person_id", targetId);
            setUserID(targetId);
            return;
        }

        window.location.href = "/login";
    }, [queryPersonId]);


    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
    const [person, setPerson] = useState({
        campus: "",
        last_name: "",
        first_name: "",
        middle_name: "",
        document_status: "",
        extension: "",
        generalAverage1: "",
        program: "",
        created_at: "",

    });

    // ⬇️ Add this inside ApplicantList component, before useEffect
    const fetchApplicants = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/all-applicants");
            const data = await res.json();
            setPersons(data);
        } catch (err) {
            console.error("Error fetching applicants:", err);
        }
    };

    // ✅ Auto-updates registrar_status when submitted_documents changes
    const handleSubmittedDocumentsChange = async (upload_id, checked, person_id) => {
        try {
            const submittedValue = checked ? 1 : 0;
            const registrarValue = checked ? 1 : 0;
            const requirementsValue = checked ? 1 : 0; // ✅ turn into 1 if checked

            // Update requirement_uploads
            await axios.put(`http://localhost:5000/api/submitted-documents/${upload_id}`, {
                submitted_documents: submittedValue,
                registrar_status: registrarValue,
            });

            // ✅ Update person_status_table.requirements
            await axios.put(`http://localhost:5000/api/update-requirements/${person_id}`, {
                requirements: requirementsValue,
            });

            fetchApplicants(); // refresh
        } catch (err) {
            console.error("❌ Failed to update submitted documents:", err);
        }
    };


    // ✅ Manual registrar override
    const handleRegistrarStatusChange = async (person_id, status) => {
        try {
            await axios.put(`http://localhost:5000/api/registrar-status/${person_id}`, {
                registrar_status: status,
            });
            fetchApplicants(); // refresh
        } catch (err) {
            console.error("❌ Failed to update registrar status:", err);
        }
    };



    useEffect(() => {
        // Replace this with your actual API endpoint
        fetch("http://localhost:5000/api/all-applicants")
            .then((res) => res.json())
            .then((data) => setPersons(data)) // ✅ Correct

    }, []);

    useEffect(() => {
        socket.on("document_status_updated", () => {
            fetch("http://localhost:5000/api/all-applicants")
                .then((res) => res.json())
                .then((data) => setPersons(data));
        });
        return () => socket.off("document_status_updated");
    }, []);



    const [curriculumOptions, setCurriculumOptions] = useState([]);

    useEffect(() => {
        const fetchCurriculums = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/applied_program");
                console.log("✅ curriculumOptions:", response.data); // <--- add this
                setCurriculumOptions(response.data);
            } catch (error) {
                console.error("Error fetching curriculum options:", error);
            }
        };

        fetchCurriculums();
    }, []);

    const [selectedApplicantStatus, setSelectedApplicantStatus] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    const [selectedRegistrarStatus, setSelectedRegistrarStatus] = useState("");

    const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
    const [selectedProgramFilter, setSelectedProgramFilter] = useState("");
    const [department, setDepartment] = useState([]);
    const [allCurriculums, setAllCurriculums] = useState([]);
    const [schoolYears, setSchoolYears] = useState([]);
    const [semesters, setSchoolSemester] = useState([]);
    const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
    const [selectedSchoolSemester, setSelectedSchoolSemester] = useState('');
    const [selectedActiveSchoolYear, setSelectedActiveSchoolYear] = useState('');

    useEffect(() => {
        axios
            .get(`http://localhost:5000/get_school_year/`)
            .then((res) => setSchoolYears(res.data))
            .catch((err) => console.error(err));
    }, [])

    useEffect(() => {
        axios
            .get(`http://localhost:5000/get_school_semester/`)
            .then((res) => setSchoolSemester(res.data))
            .catch((err) => console.error(err));
    }, [])

    useEffect(() => {

        axios
            .get(`http://localhost:5000/active_school_year`)
            .then((res) => {
                if (res.data.length > 0) {
                    setSelectedSchoolYear(res.data[0].year_id);
                    setSelectedSchoolSemester(res.data[0].semester_id);
                }
            })
            .catch((err) => console.error(err));

    }, []);

    const handleSchoolYearChange = (event) => {
        setSelectedSchoolYear(event.target.value);
    };

    const handleSchoolSemesterChange = (event) => {
        setSelectedSchoolSemester(event.target.value);
    };

    // helper to make string comparisons robust
    const normalize = (s) => (s ?? "").toString().trim().toLowerCase();
    const [showSubmittedOnly, setShowSubmittedOnly] = useState(false);


    const filteredPersons = persons
        .filter((personData) => {
            const fullText = `${personData.first_name} ${personData.middle_name} ${personData.last_name} ${personData.emailAddress ?? ''} ${personData.applicant_number ?? ''}`.toLowerCase();
            const matchesSearch = fullText.includes(searchQuery.toLowerCase());

            const matchesCampus =
                person.campus === "" || // All Campuses
                String(personData.campus) === String(person.campus);

            // ✅ FIX: use document_status and normalize both sides
            const matchesApplicantStatus =
                selectedApplicantStatus === "" ||
                normalize(personData.document_status) === normalize(selectedApplicantStatus);

            // (keep your registrar filter; shown here with the earlier mapping)
            const matchesRegistrarStatus =
                selectedRegistrarStatus === "" ||
                (selectedRegistrarStatus === "Submitted" && personData.registrar_status === 1) ||
                (selectedRegistrarStatus === "Unsubmitted / Incomplete" && personData.registrar_status === 0);

            const programInfo = allCurriculums.find(
                (opt) => opt.curriculum_id?.toString() === personData.program?.toString()
            );

            const matchesProgram =
                selectedProgramFilter === "" ||
                programInfo?.program_code === selectedProgramFilter;

            const matchesDepartment =
                selectedDepartmentFilter === "" ||
                programInfo?.dprtmnt_name === selectedDepartmentFilter;

            // (Your year/semester checks look off; leaving as-is since you didn’t ask to change them.)
            const matchesSchoolYear = selectedSchoolYear;
            const matchesSemester = selectedSchoolSemester;

            // date range (unchanged)
            let matchesDateRange = true;
            if (person.fromDate && person.toDate) {
                const appliedDate = new Date(personData.created_at);
                const from = new Date(person.fromDate);
                const to = new Date(person.toDate);
                matchesDateRange = appliedDate >= from && appliedDate <= to;
            } else if (person.fromDate) {
                const appliedDate = new Date(personData.created_at);
                const from = new Date(person.fromDate);
                matchesDateRange = appliedDate >= from;
            } else if (person.toDate) {
                const appliedDate = new Date(personData.created_at);
                const to = new Date(person.toDate);
                matchesDateRange = appliedDate <= to;
            }

            const matchesSubmittedDocs =
                !showSubmittedOnly || personData.submitted_documents === 1;


            return (
                matchesSearch &&
                matchesCampus &&
                matchesApplicantStatus &&
                matchesRegistrarStatus &&
                matchesSubmittedDocs &&
                matchesDepartment &&
                matchesProgram &&
                matchesSchoolYear &&
                matchesSemester &&
                matchesDateRange
            );
        })
        .sort((a, b) => {
            let fieldA, fieldB;
            if (sortBy === "name") {
                fieldA = `${a.last_name} ${a.first_name} ${a.middle_name || ''}`.toLowerCase();
                fieldB = `${b.last_name} ${b.first_name} ${b.middle_name || ''}`.toLowerCase();
            } else if (sortBy === "id") {
                fieldA = a.applicant_number || "";
                fieldB = b.applicant_number || "";
            } else if (sortBy === "email") {
                fieldA = a.emailAddress?.toLowerCase() || "";
                fieldB = b.emailAddress?.toLowerCase() || "";
            } else {
                return 0;
            }
            if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
            if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });



    const [itemsPerPage, setItemsPerPage] = useState(100);

    const totalPages = Math.ceil(filteredPersons.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPersons = filteredPersons.slice(indexOfFirstItem, indexOfLastItem);

    const maxButtonsToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

    if (endPage - startPage < maxButtonsToShow - 1) {
        startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }

    const visiblePages = [];
    for (let i = startPage; i <= endPage; i++) {
        visiblePages.push(i);
    }

    useEffect(() => {
        fetch("http://localhost:5000/api/all-applicants") // 👈 This is the new endpoint
            .then((res) => res.json())

            .catch((err) => console.error("Error fetching applicants:", err));
    }, []);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/departments"); // ✅ Update if needed
                setDepartment(response.data);
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
        };

        fetchDepartments();
    }, []);


    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages || 1);
        }
    }, [filteredPersons.length, totalPages]);

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        // Load saved notifications from DB on first load
        axios.get("http://localhost:5000/api/notifications")
            .then(res => {
                setNotifications(res.data.map(n => ({
                    ...n,
                    timestamp: n.timestamp
                })));
            })
            .catch(err => console.error("Failed to load saved notifications:", err));
    }, []);


    useEffect(() => {
        const socket = io("http://localhost:5000");
        socket.on("notification", (data) => {
            setNotifications((prev) => [data, ...prev]);
        });
        return () => socket.disconnect();
    }, []);


    const handleSnackClose = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnack(prev => ({ ...prev, open: false }));
    };



    useEffect(() => {
        axios.get("http://localhost:5000/api/applied_program")
            .then(res => {
                setAllCurriculums(res.data);
                setCurriculumOptions(res.data);
            });
    }, []);

    const handleDepartmentChange = (selectedDept) => {
        setSelectedDepartmentFilter(selectedDept);
        if (!selectedDept) {
            setCurriculumOptions(allCurriculums);
        } else {
            setCurriculumOptions(
                allCurriculums.filter(opt => opt.dprtmnt_name === selectedDept)
            );
        }
        setSelectedProgramFilter("");
    };


    const [applicants, setApplicants] = useState([]);
    const divToPrintRef = useRef();



    const printDiv = () => {
        const newWin = window.open("", "Print-Window");
        newWin.document.open();
        newWin.document.write(`
    <html>
      <head>
        <title>Applicant List</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          .print-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .print-header {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 100%;
          }
          .print-header img {
            position: absolute;
            left: 0;
            margin-left: 10px;
            width: 120px;
            height: 120px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 20px;
          }
          th, td {
            border: 0.5px solid black;
            padding: 4px 6px;
            font-size: 12px;
            text-align: center;
          }
          th {
            background-color: #800000;
            color: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body onload="window.print(); setTimeout(() => window.close(), 100);">
        <div class="print-container">

          <!-- Header -->
         <div class="print-header">
  <img src="${EaristLogo}" alt="Earist Logo" 
       style="width: 125px; height: 125px;" />
  <div>
              <div>Republic of the Philippines</div>
              <b style="letter-spacing: 1px; font-size: 20px;">
                Eulogio "Amang" Rodriguez
              </b>
              <div style="letter-spacing: 1px; font-size: 20px;">
                <b>Institute of Science and Technology</b>
              </div>
              <div>Nagtahan St. Sampaloc, Manila</div>
              <div style="margin-top: 30px;">
                <b style="font-size: 24px; letter-spacing: 1px;">
                  Applicant List
                </b>
              </div>
            </div>
          </div>

          <!-- Table -->
          <table>
            <thead>
              <tr>
                <th>Applicant ID</th>
                <th>Applicant Name</th>
                <th>Program</th>
                <th>SHS GWA</th>
                <th>Date Applied</th>
                <th>Status</th>
              </tr>
            </thead>
        <tbody>
  ${filteredPersons.map(person => `
    <tr>
      <td>${person.applicant_number ?? "N/A"}</td>
      <td>${person.last_name}, ${person.first_name} ${person.middle_name ?? ""} ${person.extension ?? ""}</td>
      <td>${curriculumOptions.find(
            item => item.curriculum_id?.toString() === person.program?.toString()
        )?.program_code ?? "N/A"}</td>
      <td>${person.generalAverage1 ?? ""}</td>
      <td>${new Date(person.created_at).toLocaleDateString("en-PH")}</td>
      <td>${person.registrar_status === 1
                ? "Submitted"
                : person.registrar_status === 0
                    ? "Unsubmitted / Incomplete"
                    : ""
            }</td>
    </tr>
  `).join("")}
</tbody>

          </table>

        </div>
      </body>
    </html>
  `);
        newWin.document.close();
    };



    return (
        <Box sx={{ height: 'calc(100vh - 150px)', overflowY: 'auto', pr: 1, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" fontWeight="bold" color="maroon">
                    ADMISSION PROCESS FOR REGISTRAR
                </Typography>
                <Box sx={{ position: 'absolute', top: 10, right: 24 }}>
                    <Button
                        sx={{ width: 65, height: 65, borderRadius: '50%', '&:hover': { backgroundColor: '#E8C999' } }}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <NotificationsIcon sx={{ fontSize: 50, color: 'white' }} />
                        {notifications.length > 0 && (
                            <Box sx={{
                                position: 'absolute', top: 5, right: 5,
                                background: 'red', color: 'white',
                                borderRadius: '50%', width: 20, height: 20,
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                fontSize: '12px'
                            }}>
                                {notifications.length}
                            </Box>
                        )}
                    </Button>

                    {showNotifications && (
                        <Paper sx={{
                            position: 'absolute',
                            top: 70, right: 0,
                            width: 300, maxHeight: 400,
                            overflowY: 'auto',
                            bgcolor: 'white',
                            boxShadow: 3,
                            zIndex: 10,
                            borderRadius: 1
                        }}>
                            {notifications.length === 0 ? (
                                <Typography sx={{ p: 2 }}>No notifications</Typography>
                            ) : (
                                notifications.map((notif, idx) => (
                                    <Box key={idx} sx={{ p: 1, borderBottom: '1px solid #ccc' }}>
                                        <Typography sx={{ fontSize: '14px' }}>{notif.message}</Typography>
                                        <Typography sx={{ fontSize: '10px', color: '#888' }}>
                                            {new Date(notif.timestamp).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
                                        </Typography>
                                    </Box>
                                ))
                            )}
                        </Paper>
                    )}
                </Box>

                <Box>

                    <TextField
                        variant="outlined"
                        placeholder="Search Applicant Name / Email / Applicant ID"
                        size="small"
                        style={{ width: '450px' }}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1); // Corrected
                        }}

                        InputProps={{
                            startAdornment: <Search sx={{ mr: 1 }} />,
                        }}
                    />
                </Box>
            </Box>


            <hr style={{ border: "1px solid #ccc", width: "100%" }} />
            <div style={{ height: "20px" }}></div>

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    mt: 2,
                }}
            >
                {tabs1.map((tab, index) => (
                    <React.Fragment key={index}>
                        {/* Step Card */}
                        <Card
                            onClick={() => handleStepClick(index, tab.to)}
                            sx={{
                                flex: 1,
                                maxWidth: `${100 / tabs1.length}%`, // evenly fit 100%
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
                        {index < tabs1.length - 1 && (
                            <Box
                                sx={{
                                    flex: 0.1,
                                    mx: 1, // margin to keep spacing
                                }}
                            />
                        )}
                    </React.Fragment>
                ))}
            </Box>

            <div style={{ height: "20px" }}></div>


            <TableContainer component={Paper} sx={{ width: '100%', border: "2px solid maroon", }}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#6D2323' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', textAlign: "Center" }}>Application Date</TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </TableContainer>

            <TableContainer component={Paper} sx={{ width: '100%', border: "2px solid maroon", p: 2 }}>
                <Box display="flex" justifyContent="space-between" flexWrap="wrap" rowGap={2}>

                    {/* Left Side: From and To Date */}
                    <Box display="flex" flexDirection="column" gap={2}>

                        {/* From Date + Print Button */}
                        <Box display="flex" alignItems="flex-end" gap={2}>

                            <FormControl size="small" sx={{ width: 200 }}>
                                <InputLabel shrink htmlFor="from-date">From Date</InputLabel>
                                <TextField
                                    id="from-date"
                                    type="date"
                                    size="small"
                                    name="fromDate"
                                    value={person.fromDate || ""}
                                    onChange={(e) => setPerson(prev => ({ ...prev, fromDate: e.target.value }))}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </FormControl>

                            <button
                                onClick={printDiv}
                                style={{
                                    padding: "5px 20px",
                                    border: "2px solid black",
                                    backgroundColor: "#f0f0f0",
                                    color: "black",
                                    borderRadius: "5px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                    transition: "background-color 0.3s, transform 0.2s",
                                    height: "40px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    userSelect: "none",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#d3d3d3"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                                onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
                                onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                                type="button"
                            >
                                <FcPrint size={20} />
                                Print Applicant List
                            </button>
                        </Box>

                        {/* To Date */}
                        <FormControl size="small" sx={{ width: 200 }}>
                            <InputLabel shrink htmlFor="to-date">To Date</InputLabel>
                            <TextField
                                id="to-date"
                                type="date"
                                size="small"
                                name="toDate"
                                value={person.toDate || ""}
                                onChange={(e) => setPerson(prev => ({ ...prev, toDate: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />
                        </FormControl>
                    </Box>

                    {/* Right Side: Campus Dropdown */}
                    <Box display="flex" flexDirection="column" gap={1} sx={{ minWidth: 200 }}>
                        <Typography fontSize={13} >Campus:</Typography>
                        <FormControl size="small" sx={{ width: "200px" }}>
                            <InputLabel id="campus-label">Campus</InputLabel>
                            <Select
                                labelId="campus-label"
                                id="campus-select"
                                name="campus"
                                value={person.campus ?? ""}
                                onChange={(e) => {
                                    setPerson(prev => ({ ...prev, campus: e.target.value }));
                                    setCurrentPage(1);
                                }}
                            >
                                <MenuItem value=""><em>All Campuses</em></MenuItem>
                                <MenuItem value="0">MANILA</MenuItem>
                                <MenuItem value="1">CAVITE</MenuItem>
                            </Select>
                        </FormControl>

                    </Box>

                </Box>
            </TableContainer>

            <TableContainer component={Paper} sx={{ width: '100%', }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
                        <TableRow>
                            <TableCell colSpan={10} sx={{ border: "2px solid maroon", py: 0.5, backgroundColor: '#6D2323', color: "white" }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    {/* Left: Total Count */}
                                    <Typography fontSize="14px" fontWeight="bold" color="white">
                                        Total Applicants: {filteredPersons.length}
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
                                                }
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
                                                }
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
                                                        color: 'white', // dropdown arrow icon color
                                                    }
                                                }}
                                                MenuProps={{
                                                    PaperProps: {
                                                        sx: {
                                                            maxHeight: 200,
                                                            backgroundColor: '#fff', // dropdown background
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
                                                }
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
                                                }
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






            <TableContainer component={Paper} sx={{ width: '100%', border: "2px solid maroon", p: 2 }}>
                <Box display="flex" justifyContent="space-between" flexWrap="wrap" rowGap={3} columnGap={5}>

                    {/* LEFT COLUMN: Sorting & Status Filters */}
                    <Box display="flex" flexDirection="column" gap={2}>

                        {/* Sort By */}
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "10px" }}>Sort By:</Typography>
                            <FormControl size="small" sx={{ width: "200px" }}>
                                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} displayEmpty>
                                    <MenuItem value="">Select Field</MenuItem>
                                    <MenuItem value="name">Applicant's Name</MenuItem>
                                    <MenuItem value="id">Applicant ID</MenuItem>
                                    <MenuItem value="email">Email Address</MenuItem>
                                </Select>
                            </FormControl>
                            <Typography fontSize={13} sx={{ minWidth: "10px" }}>Sort Order:</Typography>
                            <FormControl size="small" sx={{ width: "200px" }}>
                                <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} displayEmpty>
                                    <MenuItem value="">Select Order</MenuItem>
                                    <MenuItem value="asc">Ascending</MenuItem>
                                    <MenuItem value="desc">Descending</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>


                        {/* Applicant Status */}
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "140px" }}>Applicant Status:</Typography>
                            <FormControl size="small" sx={{ width: "275px" }}>
                                <Select
                                    value={selectedApplicantStatus}
                                    onChange={(e) => setSelectedApplicantStatus(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="">Select status</MenuItem>
                                    <MenuItem value="On process">On process</MenuItem>
                                    <MenuItem value="Documents Verified & ECAT">Documents Verified & ECAT</MenuItem>
                                    <MenuItem value="Disapproved">Disapproved</MenuItem>
                                    <MenuItem value="Program Closed">Program Closed</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Registrar Status + Submitted Docs Checkbox */}
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography fontSize={13} sx={{ minWidth: "140px" }}>Registrar Status:</Typography>
                            <FormControl size="small" sx={{ width: "275px" }}>
                                <Select
                                    value={selectedRegistrarStatus}
                                    onChange={(e) => setSelectedRegistrarStatus(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="">Select status</MenuItem>
                                    <MenuItem value="Submitted">Submitted</MenuItem>
                                    <MenuItem value="Unsubmitted / Incomplete">Unsubmitted / Incomplete</MenuItem>
                                </Select>
                            </FormControl>

                            {/* ✅ New Checkbox for Submitted Documents */}

                        </Box>
                        <FormControl size="small" sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                            <Checkbox
                                checked={showSubmittedOnly}
                                onChange={(e) => setShowSubmittedOnly(e.target.checked)}
                                sx={{ color: "maroon", "&.Mui-checked": { color: "maroon" } }}
                            />
                            <Typography fontSize={13}>Show Submitted Only</Typography>
                        </FormControl>
                    </Box>

                    {/* MIDDLE COLUMN: SY & Semester */}
                    <Box display="flex" flexDirection="column" gap={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "100px" }}>School Year:</Typography>
                            <FormControl size="small" sx={{ width: "200px" }}>
                                <InputLabel id="school-year-label">School Years</InputLabel>
                                <Select
                                    labelId="school-year-label"
                                    value={selectedSchoolYear}
                                    onChange={handleSchoolYearChange}
                                    displayEmpty
                                >
                                    {schoolYears.length > 0 ? (
                                        schoolYears.map((sy) => (
                                            <MenuItem value={sy.year_id} key={sy.year_id}>
                                                {sy.current_year} - {sy.next_year}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled>School Year is not found</MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "100px" }}>Semester:</Typography>
                            <FormControl size="small" sx={{ width: "200px" }}>
                                <InputLabel id="semester-label">School Semester</InputLabel>
                                <Select
                                    labelId="semester-label"
                                    value={selectedSchoolSemester}
                                    onChange={handleSchoolSemesterChange}
                                    displayEmpty
                                >
                                    {semesters.length > 0 ? (
                                        semesters.map((sem) => (
                                            <MenuItem value={sem.semester_id} key={sem.semester_id}>
                                                {sem.semester_description}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled>School Semester is not found</MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* RIGHT COLUMN: Department & Program */}
                    <Box display="flex" flexDirection="column" gap={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "100px" }}>Department:</Typography>
                            <FormControl size="small" sx={{ width: "400px" }}>
                                <Select
                                    value={selectedDepartmentFilter}
                                    onChange={(e) => {
                                        const selectedDept = e.target.value;
                                        setSelectedDepartmentFilter(selectedDept);
                                        handleDepartmentChange(selectedDept);
                                    }}
                                    displayEmpty
                                >
                                    <MenuItem value="">All Departments</MenuItem>
                                    {department.map((dep) => (
                                        <MenuItem key={dep.dprtmnt_id} value={dep.dprtmnt_name}>
                                            {dep.dprtmnt_name} ({dep.dprtmnt_code})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "100px" }}>Program:</Typography>
                            <FormControl size="small" sx={{ width: "350px" }}>
                                <Select
                                    value={selectedProgramFilter}
                                    onChange={(e) => setSelectedProgramFilter(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="">All Programs</MenuItem>
                                    {curriculumOptions.map((prog) => (
                                        <MenuItem key={prog.curriculum_id} value={prog.program_code}>
                                            {prog.program_code} - {prog.program_description}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                        </Box>
                    </Box>
                </Box>
            </TableContainer>

            <div ref={divToPrintRef}>

            </div>


            <TableContainer component={Paper} sx={{ width: "100%" }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: "#6D2323", }}>
                        <TableRow>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "2%", py: 0.5, fontSize: "12px", border: "1px solid maroon", borderLeft: "2px solid maroon" }}>
                                #
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "3%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Submitted Orig Documents
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "8%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Applicant ID
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "30%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Name
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "10%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Program
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "6%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                SHS GWA
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "8%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Date Applied
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "8%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Date Last Updated
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "16%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Applicant Status
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "8%", py: 0.5, fontSize: "12px", border: "1px solid maroon", borderRight: "2px solid maroon" }}>
                                Registrar Status
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {currentPersons.map((person, index) => (
                            <TableRow key={person.person_id}>
                                {/* # */}
                                <TableCell
                                    sx={{
                                        color: "black",
                                        textAlign: "center",
                                        border: "1px solid maroon",
                                        borderLeft: "2px solid maroon",
                                        py: 0.5,
                                        fontSize: "12px",
                                    }}
                                >
                                    {index + 1}
                                </TableCell>

                                {/* Checkbox */}
                                <TableCell sx={{ textAlign: "center", border: "1px solid maroon", py: 0.5 }}>
                                    <Checkbox
                                        checked={person.submitted_documents === 1}
                                        onChange={(e) =>
                                            handleSubmittedDocumentsChange(
                                                person.upload_id,
                                                e.target.checked,
                                                person.person_id
                                            )
                                        }
                                        sx={{
                                            color: "maroon",
                                            "&.Mui-checked": { color: "maroon" },
                                            transform: "scale(1.1)",
                                            p: 0,
                                        }}
                                    />
                                </TableCell>

                                {/* Applicant Number */}
                                <TableCell
                                    sx={{
                                        color: "blue",
                                        textAlign: "center",
                                        border: "1px solid maroon",
                                        py: 0.5,
                                        fontSize: "12px",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => handleRowClick(person.person_id)}
                                >
                                    {person.applicant_number ?? "N/A"}
                                </TableCell>

                                {/* Applicant Name */}
                                <TableCell
                                    sx={{
                                        color: "blue",
                                        textAlign: "left",
                                        border: "1px solid maroon",
                                        py: 0.5,
                                        fontSize: "12px",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => handleRowClick(person.person_id)}
                                >
                                    {`${person.last_name}, ${person.first_name} ${person.middle_name ?? ""} ${person.extension ?? ""
                                        }`}
                                </TableCell>

                                {/* Program */}
                                <TableCell
                                    sx={{
                                        color: "black",
                                        textAlign: "center",
                                        border: "1px solid maroon",
                                        py: 0.5,
                                        fontSize: "12px",
                                    }}
                                >
                                    {curriculumOptions.find(
                                        (item) => item.curriculum_id?.toString() === person.program?.toString()
                                    )?.program_code ?? "N/A"}
                                </TableCell>

                                {/* SHS GWA */}
                                <TableCell
                                    sx={{
                                        color: "black",
                                        textAlign: "center",
                                        border: "1px solid maroon",
                                        py: 0.5,
                                        fontSize: "12px",
                                    }}
                                >
                                    {person.generalAverage1}
                                </TableCell>

                                {/* Created Date */}
                                <TableCell
                                    sx={{
                                        color: "black",
                                        textAlign: "center",
                                        border: "1px solid maroon",
                                        py: 0.5,
                                        fontSize: "12px",
                                    }}
                                >
                                    {person.created_at}
                                </TableCell>

                                {/* Last Updated */}
                                <TableCell
                                    sx={{
                                        color: "black",
                                        textAlign: "center",
                                        border: "1px solid maroon",
                                        py: 0.5,
                                        fontSize: "12px",
                                    }}
                                >
                                    {person.last_updated
                                        ? new Date(person.last_updated).toLocaleDateString("en-PH", {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                        })
                                        : ""}
                                </TableCell>

                                {/* Status */}
                                <TableCell
                                    sx={{
                                        color: "black",
                                        textAlign: "center",
                                        border: "1px solid maroon",
                                        py: 0.5,
                                        fontSize: "12px",
                                    }}
                                >
                                    {person.document_status || "N/A"}
                                </TableCell>

                                {/* Registrar Status */}
                                <TableCell
                                    sx={{
                                        textAlign: "center",
                                        border: "1px solid maroon",
                                        borderRight: "2px solid maroon",
                                        py: 0.5,
                                        fontSize: "12px",
                                    }}
                                >
                                    {person.registrar_status === 1 ? (
                                        <Box
                                            sx={{
                                                backgroundColor: "#4CAF50",
                                                color: "white",
                                                borderRadius: 1,
                                                width: 250,
                                                height: 30,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                margin: "0 auto",
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: "bold" }}>Submitted</Typography>
                                        </Box>
                                    ) : person.registrar_status === 0 ? (
                                        <Box
                                            sx={{
                                                backgroundColor: "#F44336",
                                                color: "white",
                                                borderRadius: 1,
                                                width: 250,
                                                height: 30,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                margin: "0 auto",
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: "bold" }}>
                                                Unsubmitted / Incomplete
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box display="flex" justifyContent="center" gap={1}>
                                            <Button
                                                key={`submitted-${person.person_id}`}
                                                variant="contained"
                                                onClick={() => handleRegistrarStatusChange(person.person_id, 1)}
                                                sx={{
                                                    backgroundColor: "green",
                                                    color: "white",
                                                    width: 150,
                                                    height: 30,
                                                }}
                                            >
                                                Submitted
                                            </Button>
                                            <Button
                                                key={`unsubmitted-${person.person_id}`}
                                                variant="contained"
                                                onClick={() => handleRegistrarStatusChange(person.person_id, 0)}
                                                sx={{
                                                    backgroundColor: "red",
                                                    color: "white",
                                                    width: 150,
                                                    height: 30,
                                                }}
                                            >
                                                Unsubmitted
                                            </Button>
                                        </Box>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>

                </Table>
            </TableContainer>

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

export default ApplicantList;