import React, { useState, useEffect } from "react";
import axios from 'axios';
import {
    Box,
    Button,
    Typography,
    Paper,
    Table,
    Card,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TextField,
    TableRow,
    MenuItem
} from '@mui/material';
import Search from '@mui/icons-material/Search';
import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import ListAltIcon from "@mui/icons-material/ListAlt";
import io from 'socket.io-client';

const tabs = [
    { label: "Applicant List", to: "/applicant_list", icon: <ListAltIcon /> },
    { label: "Applicant Form", to: "/admin_dashboard1", icon: <PersonIcon /> },
    { label: "Documents Submitted", to: "/student_requirements", icon: <DescriptionIcon /> },
    { label: "Interview", to: "/interview", icon: <RecordVoiceOverIcon /> },
    { label: "Qualifying Exam", to: "/qualifying_exam", icon: <SchoolIcon /> },
    { label: "College Approval", to: "/college_approval", icon: <CheckCircleIcon /> },
    { label: "Medical Clearance", to: "/medical_clearance", icon: <LocalHospitalIcon /> },
    { label: "Applicant Status", to: "/applicant_status", icon: <HowToRegIcon /> },
];

const QualifyingExam = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(4);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));
    const [explicitSelection, setExplicitSelection] = useState(false);


    const fetchByPersonId = async (personID) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/person_with_applicant/${personID}`);
            setPerson(res.data);
            setSelectedPerson(res.data);
            if (res.data?.applicant_number) {
                await fetchUploadsByApplicantNumber(res.data.applicant_number);
            }
        } catch (err) {
            console.error("❌ person_with_applicant failed:", err);
        }
    };


    const handleStepClick = (index, to) => {
        setActiveStep(index);

        const pid = sessionStorage.getItem("admin_edit_person_id");

        if (pid) {
            // ✅ Always attach ?person_id for whichever tab we click
            navigate(`${to}?person_id=${pid}`);
        } else {
            navigate(to); // if no pid in session, just go raw
        }
    };





    const [uploads, setUploads] = useState([]);
    const [persons, setPersons] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedPerson, setSelectedPerson] = useState(null);

    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [person, setPerson] = useState({
        profile_img: "",
        last_name: "",
        first_name: "",
        middle_name: "",
        extension: "",
    });


    useEffect(() => {
        const storedUser = localStorage.getItem("email");
        const storedRole = localStorage.getItem("role");
        const storedID = localStorage.getItem("person_id");

        if (storedUser && storedRole && storedID) {
            setUser(storedUser);
            setUserRole(storedRole);
            setUserID(storedID);

            if (storedRole === "registrar") {

                if (storedID !== "undefined") {

                } else {
                    console.warn("Stored person_id is invalid:", storedID);
                }
            } else {
                window.location.href = "/login";
            }
        } else {
            window.location.href = "/login";
        }
    }, []);


    const queryParams = new URLSearchParams(location.search);
    const queryPersonId = queryParams.get("person_id")?.trim() || "";

    useEffect(() => {
        let consumedFlag = false;

        const tryLoad = async () => {
            if (queryPersonId) {
                await fetchByPersonId(queryPersonId);
                setExplicitSelection(true);
                consumedFlag = true;
                return;
            }

            // fallback only if it's a fresh selection from Applicant List
            const source = sessionStorage.getItem("admin_edit_person_id_source");
            const tsStr = sessionStorage.getItem("admin_edit_person_id_ts");
            const id = sessionStorage.getItem("admin_edit_person_id");
            const ts = tsStr ? parseInt(tsStr, 10) : 0;
            const isFresh = source === "applicant_list" && Date.now() - ts < 5 * 60 * 1000;

            if (id && isFresh) {
                await fetchByPersonId(id);
                setExplicitSelection(true);
                consumedFlag = true;
            }
        };

        tryLoad().finally(() => {
            // consume the freshness so it won't auto-load again later
            if (consumedFlag) {
                sessionStorage.removeItem("admin_edit_person_id_source");
                sessionStorage.removeItem("admin_edit_person_id_ts");
            }
        });
    }, [queryPersonId]);


    useEffect(() => {
        fetchPersons();
    }, []);

    useEffect(() => {
        // No search text: keep explicit selection if present
        if (!searchQuery.trim()) {
            if (!explicitSelection) {
                setSelectedPerson(null);
                setPerson({
                    profile_img: "",
                    generalAverage1: "",
                    last_name: "",
                    first_name: "",
                    middle_name: "",
                    extension: "",
                });
            }
            return;
        }

        // User started typing -> manual search takes over
        if (explicitSelection) setExplicitSelection(false);

        const match = persons.find((p) =>
            `${p.first_name} ${p.middle_name} ${p.last_name} ${p.emailAddress} ${p.applicant_number || ''}`
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
        );

        if (match) {
            setSelectedPerson(match);
        } else {
            // no match found: clear all
            setSelectedPerson(null);
            setPerson({
                profile_img: "",
                program: "",
                last_name: "",
                first_name: "",
                middle_name: "",
                extension: "",
            });
        }
    }, [searchQuery, persons, explicitSelection]);



    const fetchUploadsByApplicantNumber = async (applicant_number) => {
        if (!applicant_number) return;
        try {
            const res = await axios.get(`http://localhost:5000/uploads/by-applicant/${applicant_number}`);
            // ✅ filter only vaccine uploads
            const vaccineUploads = res.data.filter(u =>
                u.description.toLowerCase().includes("vaccine")
            );
            setUploads(vaccineUploads);
        } catch (err) {
            console.error('Fetch uploads failed:', err);
        }
    };





    const fetchPersonData = async (personID) => {
        if (!personID || personID === "undefined") {
            console.warn("Invalid personID for person data:", personID);
            return;
        }

        try {
            const res = await axios.get(`http://localhost:5000/api/person_with_applicant/${personID}`);

            const safePerson = {
                ...res.data,
                document_status: res.data.document_status || "On process", // set default here
            };
            setPerson(safePerson);
            setSelectedPerson(res.data);

        } catch (error) {
            console.error("❌ Failed to fetch person data:", error?.response?.data || error.message);
        }
    };


    useEffect(() => {
        if (selectedPerson?.person_id) {
            fetchPersonData(selectedPerson.person_id);
        }
    }, [selectedPerson]);




    const fetchPersons = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/upload_documents');
            setPersons(res.data);
        } catch (err) {
            console.error('Error fetching persons:', err);
        }
    };

    const [exams, setExams] = useState([]);



    // ✅ Exam Form State
    const [examData, setExamData] = useState({
        remarks: "",
        status: "",
        custom_status: "",
        score: "",
    });

    const handleExamChange = (e) => {
        const { name, value } = e.target;
        setExamData((prev) => ({ ...prev, [name]: value }));
    };

    // ✅ Fetch Exam by person_id (instead of global)
    useEffect(() => {
        if (selectedPerson?.person_id) {
            axios
                .get(`http://localhost:5000/qualifying_exam/${selectedPerson.person_id}`)
                .then((res) => {
                    if (res.data) {
                        setExamData({
                            score: res.data.score || "",
                            remarks: res.data.remarks || "",
                            user: res.data.user || user,
                            status: res.data.status || "",
                            custom_status: res.data.custom_status || "",
                        });
                    }
                })
                .catch((err) =>
                    console.error("❌ Failed to fetch qualifying exam:", err)
                );
        }
    }, [selectedPerson, user]);

    // ✅ Save Exam (Insert or Update)
    const handleSaveExam = async () => {
        try {
            await axios.post("http://localhost:5000/qualifying_exam", {
                person_id: selectedPerson?.person_id,
                score: examData.score,
                remarks: examData.remarks,
                user: user,
                status: examData.status,
                custom_status: examData.status === "CUSTOM" ? examData.custom_status : null,
            });

            alert("✅ Qualifying Exam Saved!");
        } catch (err) {
            console.error("❌ Save failed:", err);
        }
    };




    return (
        <Box sx={{ height: 'calc(100vh - 150px)', overflowY: 'auto', paddingRight: 1 }}>
            <Box sx={{ px: 2 }}>


                {/* Top header: DOCUMENTS SUBMITTED + Search */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        mt: 2,
                        mb: 2,
                        px: 2,
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 'bold',
                            color: 'maroon',
                            fontSize: '36px',
                        }}
                    >
                        QUALIFYING EXAM
                    </Typography>

                    <TextField
                        variant="outlined"
                        placeholder="Search Applicant Name / Email / Applicant ID"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
                        sx={{ width: { xs: '100%', sm: '425px' }, mt: { xs: 2, sm: 0 } }}
                    />
                </Box>

                <hr style={{ border: "1px solid #ccc", width: "100%" }} />
                <br />


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
                {/* Applicant ID and Name */}
                <TableContainer component={Paper} sx={{ width: '100%', border: "1px solid maroon" }}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#6D2323', }}>
                            <TableRow>
                                {/* Left cell: Applicant ID */}
                                <TableCell sx={{ color: 'white', fontSize: '20px', fontFamily: 'Arial Black', border: 'none' }}>
                                    Applicant ID:&nbsp;
                                    <span style={{ fontFamily: "Arial", fontWeight: "normal", textDecoration: "underline" }}>
                                        {selectedPerson?.applicant_number || "N/A"}
                                    </span>
                                </TableCell>

                                {/* Right cell: Applicant Name, right-aligned */}
                                <TableCell
                                    align="right"
                                    sx={{ color: 'white', fontSize: '20px', fontFamily: 'Arial Black', border: 'none' }}
                                >
                                    Applicant Name:&nbsp;
                                    <span style={{ fontFamily: "Arial", fontWeight: "normal", textDecoration: "underline" }}>
                                        {selectedPerson?.last_name?.toUpperCase()}, {selectedPerson?.first_name?.toUpperCase()}{" "}
                                        {selectedPerson?.middle_name?.toUpperCase()} {selectedPerson?.extension_name?.toUpperCase() || ""}
                                    </span>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                    </Table>
                </TableContainer>

                <TableContainer
                    component={Paper}
                    sx={{ width: "100%", border: "2px solid maroon", backgroundColor: "white", p: 2 }}
                >
                    {/* Header Row: Centered Title + Right-aligned Photo */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            position: "relative",
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: "24px",
                                fontWeight: "bold",
                                fontFamily: "Arial",
                                color: "maroon",
                                textAlign: "center",
                                width: "100%",
                            }}
                        >
                            Qualifying Exam
                        </Typography>

                        {/* Photo on the right */}
                        {person.profile_img && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    right: 16,
                                    marginTop: "350px",
                                    transform: "translateY(-50%)",
                                    width: "2.10in",
                                    height: "2.10in",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                }}
                            >
                                <img
                                    src={`http://localhost:5000/uploads/${person.profile_img}`}
                                    alt="Profile"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            </Box>
                        )}
                    </Box>

                    <div style={{ height: "175px" }}></div>

                    {/* Table Section */}
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
                        <Table sx={{ border: "2px solid maroon", width: "95%" }}>
                            <TableHead sx={{ backgroundColor: "#6D2323" }}>
                                <TableRow>
                                    <TableCell sx={{ color: "white", textAlign: "center", width: "20%" }}>DIMENSIONS</TableCell>
                                    <TableCell sx={{ color: "white", textAlign: "center", width: "20%" }}>SCORE</TableCell>
                                    <TableCell sx={{ color: "white", textAlign: "center", width: "20%" }}>REMARKS</TableCell>
                                    <TableCell sx={{ color: "white", textAlign: "center", width: "20%" }}>USER</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ border: "1px solid maroon" }}></TableCell>
                                    <TableCell sx={{ border: "1px solid maroon" }}>
                                        <TextField fullWidth variant="outlined" size="small" />
                                    </TableCell>
                                    <TableCell sx={{ border: "1px solid maroon" }}>
                                        <TextField fullWidth variant="outlined" size="small" />
                                    </TableCell>
                                    <TableCell sx={{ border: "1px solid maroon" }}>
                                        <TextField fullWidth variant="outlined" size="small" />
                                    </TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell sx={{ border: "1px solid maroon" }}></TableCell>
                                    <TableCell sx={{ border: "1px solid maroon" }}>
                                        <TextField fullWidth variant="outlined" size="small" />
                                    </TableCell>
                                    <TableCell sx={{ border: "1px solid maroon" }}>
                                        <TextField fullWidth variant="outlined" size="small" />
                                    </TableCell>
                                    <TableCell sx={{ border: "1px solid maroon" }}>
                                        <TextField fullWidth variant="outlined" size="small" />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Box>

                    {/* Status + Save Button */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}>
                        <Typography
                            sx={{
                                minWidth: "100px",
                                fontSize: "16px",
                                fontWeight: "bold",
                                textAlign: "left",
                            }}
                        >
                            Status:
                        </Typography>
                        <TextField
                            select
                            fullWidth
                            label="Status"
                            name="status"
                            value={examData.status}
                            onChange={handleExamChange}
                            sx={{ mb: 2 }}
                        >
                            <MenuItem value="PASSED">PASSED</MenuItem>
                            <MenuItem value="Proceed to College Interview (College/Program will post the schedule of the Interview)">
                                Proceed to College Interview (College/Program will post the schedule of the Interview)
                            </MenuItem>
                            <MenuItem value="FAILED, Sorry, you did not meet the minimum score for the entrance exam">
                                FAILED, Sorry, you did not meet the minimum score for the entrance exam
                            </MenuItem>
                            <MenuItem value="FAILED">FAILED</MenuItem>
                            <MenuItem value="WAIT, For further instructions">WAIT FOR FURTHER ANNOUNCEMENT</MenuItem>
                            <MenuItem value="CUSTOM">New Status</MenuItem>
                        </TextField>

                        {examData.status === "CUSTOM" && (
                            <TextField
                                fullWidth
                                label="Custom Status"
                                name="custom_status"
                                value={examData.custom_status}
                                onChange={handleExamChange}
                                sx={{ mb: 2 }}
                            />
                        )}
                    </Box>

                    <Button
                        sx={{ ml: 2, backgroundColor: "maroon" }}
                        variant="contained"
                        color="success"
                        onClick={handleSaveExam}
                    >
                        Save Qualifying Exam
                    </Button>
                </TableContainer>


                <>
                </>

            </Box >
        </Box >
    );
};

export default QualifyingExam;