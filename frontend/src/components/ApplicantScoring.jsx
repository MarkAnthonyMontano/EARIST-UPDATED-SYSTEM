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
import { FaFileExcel } from "react-icons/fa";



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




    const tabs = [
        { label: "Room Scheduling", to: "/assign_entrance_exam" },
        { label: "Applicant's Scheduling", to: "/assign_schedule_applicant" },
        { label: "Examination Profile", to: "/examination_profile" },
        { label: "Applicant's Score", to: "/applicant_scoring" },
        { label: "Proctor's Applicant List", to: "/proctor_applicant_list" },
    ];
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(3);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));


    const handleStepClick = (index, to) => {
        setActiveStep(index);
        navigate(to); // this will actually change the page
    };


    useEffect(() => {
        const personIdFromQuery = queryParams.get("person_id");
        if (personIdFromQuery) {
            axios.get(`http://localhost:5000/api/person_with_applicant/${personIdFromQuery}`)
                .then(res => setPersons([res.data]))  // wrap in array so table works
                .catch(err => console.error("Error fetching single applicant:", err));
        } else {
            fetchApplicants();  // your existing all-applicants fetch
        }
    }, [queryPersonId]);


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
    const [allApplicants, setAllApplicants] = useState([]);

    // ⬇️ Add this inside ApplicantList component, before useEffect

    // ✅ fetch applicants WITH exam scores
    const fetchApplicants = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/applicants-with-number");
            setPersons(res.data); // put data directly into persons
        } catch (err) {
            console.error("❌ Error fetching applicants with scores:", err);
        }
    };

    useEffect(() => {
        fetchApplicants();
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
       
            /* 👇 Name column cells left aligned */
td.name-col {
  width: 35%;
  text-align: left;
}

/* 👇 Name column header centered */
th.name-col {
  width: 35%;
  text-align: center;
}

        </style>
      </head>
      <body onload="window.print(); setTimeout(() => window.close(), 100);">
        <div class="print-container">

          <!-- Header -->
          <div class="print-header">
            <img src="${EaristLogo}" alt="Earist Logo" style="width: 125px; height: 125px;" />
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
                <th style="width:10%">Applicant ID</th>
              <th class="name-col">Applicant Name</th>
                <th style="width:15%">Program</th>
                <th style="width:7%">English</th>
                <th style="width:7%">Science</th>
                <th style="width:7%">Filipino</th>
                <th style="width:7%">Math</th>
                <th style="width:7%">Abstract</th>
                <th style="width:10%">Final Rating</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPersons.map(person => {
            const english = Number(person.english) || 0;
            const science = Number(person.science) || 0;
            const filipino = Number(person.filipino) || 0;
            const math = Number(person.math) || 0;
            const abstract = Number(person.abstract) || 0;
            const computedFinalRating = english + science + filipino + math + abstract;

            return `
                  <tr>
                    <td>${person.applicant_number ?? "N/A"}</td>
                    <td class="name-col">${person.last_name}, ${person.first_name} ${person.middle_name ?? ""} ${person.extension ?? ""}</td>
                    <td>${curriculumOptions.find(
                item => item.curriculum_id?.toString() === person.program?.toString()
            )?.program_code ?? "N/A"
                }</td>
                    <td>${english}</td>
                    <td>${science}</td>
                    <td>${filipino}</td>
                    <td>${math}</td>
                    <td>${abstract}</td>
                    <td>${computedFinalRating}</td>
                  </tr>
                `;
        }).join("")}
            </tbody>
          </table>

        </div>
      </body>
    </html>
  `);
        newWin.document.close();
    };


    const [file, setFile] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);

    // when file chosen
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    // when import button clicked
    const handleImport = async () => {
        try {
            if (!selectedFile) {
                alert("Please choose a file first!");
                return;
            }

            const formData = new FormData();
            formData.append("file", selectedFile);

            const res = await axios.post("http://localhost:5000/api/exam/import", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });


            if (res.data.success) {
                alert("Excel imported successfully!");
                fetchApplicants(); // ✅ refresh scores
                setSelectedFile(null); // reset
            } else {
                alert(res.data.error || "Failed to import");
            }
        } catch (err) {
            console.error("❌ Import error:", err);
            alert("Import failed!");
        }
    };

    const [editScores, setEditScores] = useState({});

    const handleScoreChange = async (person, field, value) => {
        try {
            // 1️⃣ Update UI immediately
            setEditScores(prev => ({
                ...prev,
                [person.person_id]: {
                    ...prev[person.person_id],
                    [field]: value,
                },
            }));

            // 2️⃣ Build updated scores
            const updatedScores = {
                english: field === "english" ? value : person.english,
                science: field === "science" ? value : person.science,
                filipino: field === "filipino" ? value : person.filipino,
                math: field === "math" ? value : person.math,
                abstract: field === "abstract" ? value : person.abstract,
            };

            // 3️⃣ Always attach logged-in user id
            const payload = {
                applicant_number: person.applicant_number,
                ...updatedScores,
                final_rating:
                    Number(updatedScores.english || 0) +
                    Number(updatedScores.science || 0) +
                    Number(updatedScores.filipino || 0) +
                    Number(updatedScores.math || 0) +
                    Number(updatedScores.abstract || 0),
                user: localStorage.getItem("email"), // ✅ Always send email
            };


            // 4️⃣ Auto-save to backend
            await axios.post("http://localhost:5000/exam/save", payload);

            console.log("✅ Auto-saved:", payload);
        } catch (err) {
            console.error("❌ Auto-save error:", err);
        }
    };


    return (
        <Box sx={{ height: 'calc(100vh - 150px)', overflowY: 'auto', pr: 1, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" fontWeight="bold" color="maroon">
                    APPLICANT SCORING
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

            <Box display="flex" sx={{ border: "2px solid maroon", borderRadius: "4px", overflow: "hidden" }}>
                {tabs.map((tab, index) => (
                    <Link
                        key={index}
                        to={tab.to}
                        style={{ textDecoration: "none", flex: 1 }}
                    >
                        <Box
                            sx={{
                                backgroundColor: "#6D2323",
                                padding: "16px",
                                color: "#ffffff",
                                textAlign: "center",
                                cursor: "pointer",
                                borderRight: index !== tabs.length - 1 ? "2px solid white" : "none", // changed here
                                transition: "all 0.3s ease",
                                "&:hover": {
                                    backgroundColor: "#f9f9f9",
                                    color: "#6D2323", // font color on hover
                                },
                            }}
                        >
                            <Typography sx={{ color: "inherit", fontWeight: "bold", wordBreak: "break-word" }}>
                                {tab.label}
                            </Typography>
                        </Box>
                    </Link>
                ))}
            </Box>

            <div style={{ height: "20px" }}></div>


            <TableContainer component={Paper} sx={{ width: '100%', border: "2px solid maroon", }}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#6D2323' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', textAlign: "Center" }}>Applicant's Score</TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </TableContainer>

            <TableContainer component={Paper} sx={{ width: "100%", border: "2px solid maroon", p: 2 }}>
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
                                    width: "200px", // ✅ same width as Import
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

                        {/* To Date + Import Button */}
                        <Box display="flex" alignItems="flex-end" gap={2}>
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

                            {/* ✅ Import Excel beside To Date */}
                            <Box display="flex" alignItems="center" gap={1}>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    style={{ display: "none" }}
                                    id="excel-upload"
                                />

                                {/* ✅ Button that triggers file input */}
                                <button
                                    onClick={() => document.getElementById("excel-upload").click()}
                                    style={{
                                        padding: "5px 20px",
                                        border: "2px solid green",
                                        backgroundColor: "#f0fdf4",
                                        color: "green",
                                        borderRadius: "5px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                        height: "40px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        userSelect: "none",
                                        width: "200px", // ✅ same width as Print
                                    }}
                                    type="button"
                                >
                                    <FaFileExcel size={20} />
                                    Choose Excel
                                </button>
                            </Box>

                            <Button
                                variant="contained"
                                sx={{
                                    height: "40px",
                                    width: "200px", // ✅ matches Print
                                    backgroundColor: "green",
                                    "&:hover": { backgroundColor: "#166534" },
                                    fontWeight: "bold",
                                }}
                                onClick={handleImport}
                            >
                                Import Applicants
                            </Button>
                        </Box>
                    </Box>

                    {/* Right Side: Campus Dropdown */}
                    <Box display="flex" flexDirection="column" gap={1} sx={{ minWidth: 200 }}>
                        <Typography fontSize={13}>Campus:</Typography>
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
                    <TableHead sx={{ backgroundColor: "#6D2323" }}>
                        <TableRow>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "2%", py: 0.5, fontSize: "12px", border: "1px solid maroon", borderLeft: "2px solid maroon" }}>
                                #
                            </TableCell>

                            <TableCell sx={{ color: "white", textAlign: "center", width: "8%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Applicant ID
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "25%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Name
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "10%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Program
                            </TableCell>

                            {/* Exam Columns */}
                            <TableCell sx={{ color: "white", textAlign: "center", width: "6%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                English
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "6%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Science
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "6%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Filipino
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "6%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Math
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "6%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Abstract
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "6%", py: 0.5, fontSize: "12px", border: "1px solid maroon" }}>
                                Final Rating
                            </TableCell>

                            <TableCell sx={{ color: "white", textAlign: "center", width: "12%", py: 0.5, fontSize: "12px", border: "1px solid maroon", borderRight: "2px solid maroon" }}>
                                User
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentPersons.map((person, index) => {
                            const english = Number(person.english) || 0;
                            const science = Number(person.science) || 0;
                            const filipino = Number(person.filipino) || 0;
                            const math = Number(person.math) || 0;
                            const abstract = Number(person.abstract) || 0;

                            const computedFinalRating =
                                (editScores[person.person_id]?.english ?? english) +
                                (editScores[person.person_id]?.science ?? science) +
                                (editScores[person.person_id]?.filipino ?? filipino) +
                                (editScores[person.person_id]?.math ?? math) +
                                (editScores[person.person_id]?.abstract ?? abstract);

                            return (
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
                                        {`${person.last_name}, ${person.first_name} ${person.middle_name ?? ""
                                            } ${person.extension ?? ""}`}
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
                                            (item) =>
                                                item.curriculum_id?.toString() === person.program?.toString()
                                        )?.program_code ?? "N/A"}
                                    </TableCell>

                                    {/* Editable Exam Scores */}
                                    <TableCell sx={{ border: "1px solid maroon", textAlign: "center" }}>
                                        <TextField
                                            value={editScores[person.person_id]?.english ?? english}
                                            onChange={(e) =>
                                                handleScoreChange(person, "english", Number(e.target.value))
                                            }
                                            size="small"
                                            type="number"
                                            sx={{ width: 70 }}
                                        />
                                    </TableCell>

                                    <TableCell sx={{ border: "1px solid maroon", textAlign: "center" }}>
                                        <TextField
                                            value={editScores[person.person_id]?.science ?? science}
                                            onChange={(e) =>
                                                handleScoreChange(person, "science", Number(e.target.value))
                                            }
                                            size="small"
                                            type="number"
                                            sx={{ width: 70 }}
                                        />
                                    </TableCell>

                                    <TableCell sx={{ border: "1px solid maroon", textAlign: "center" }}>
                                        <TextField
                                            value={editScores[person.person_id]?.filipino ?? filipino}
                                            onChange={(e) =>
                                                handleScoreChange(person, "filipino", Number(e.target.value))
                                            }
                                            size="small"
                                            type="number"
                                            sx={{ width: 70 }}
                                        />
                                    </TableCell>

                                    <TableCell sx={{ border: "1px solid maroon", textAlign: "center" }}>
                                        <TextField
                                            value={editScores[person.person_id]?.math ?? math}
                                            onChange={(e) =>
                                                handleScoreChange(person, "math", Number(e.target.value))
                                            }
                                            size="small"
                                            type="number"
                                            sx={{ width: 70 }}
                                        />
                                    </TableCell>

                                    <TableCell sx={{ border: "1px solid maroon", textAlign: "center" }}>
                                        <TextField
                                            value={editScores[person.person_id]?.abstract ?? abstract}
                                            onChange={(e) =>
                                                handleScoreChange(person, "abstract", Number(e.target.value))
                                            }
                                            size="small"
                                            type="number"
                                            sx={{ width: 70 }}
                                        />
                                    </TableCell>

                                    {/* ✅ Computed Final Rating (read-only) */}
                                    <TableCell
                                        sx={{
                                            color: "black",
                                            textAlign: "center",
                                            border: "1px solid maroon",
                                            py: 0.5,
                                            fontSize: "12px",
                                        }}
                                    >
                                        {computedFinalRating}
                                    </TableCell>


                                    {/* User */}
                                    <TableCell
                                        sx={{
                                            color: "black",
                                            textAlign: "center",
                                            border: "1px solid maroon",
                                            py: 0.5,
                                            fontSize: "12px",
                                        }}
                                    >
                                        {person.user_email || person.user_id || "N/A"}

                                    </TableCell>
                                </TableRow>
                            );
                        })}
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

        </Box >
    );
};

export default ApplicantList;