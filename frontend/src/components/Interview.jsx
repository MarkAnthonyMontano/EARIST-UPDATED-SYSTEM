import React, { useState, useEffect } from "react";
import axios from 'axios';
import {
    Box,
    Button,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    Card,
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
    { label: "Interview / Qualifiying Exam", to: "/interview", icon: <SchoolIcon /> },
    { label: "College Approval", to: "/college_approval", icon: <CheckCircleIcon /> },
    { label: "Medical Clearance", to: "/medical_clearance", icon: <LocalHospitalIcon /> },
     { label: "Student Numbering", to: "/student_numbering", icon: <HowToRegIcon /> },

];

const Interview = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(3);
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
            navigate("/qualifying_exam"); // if no pid in session, just go raw
        }
    };







    const [uploads, setUploads] = useState([]);
    const [persons, setPersons] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFiles, setSelectedFiles] = useState({});
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [remarksMap, setRemarksMap] = useState({});
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
    const [editingRemarkId, setEditingRemarkId] = useState(null);
    const [fetchedInterview, setFetchedInterview] = useState(null);

    const fetchInterviewData = async (applicant_number) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/interview/${applicant_number}`);
            if (res.data) {
                setFetchedInterview(res.data);
                setInterviewData(res.data);
                setOriginalData(res.data);
            } else {
                setFetchedInterview(null);
            }
        } catch (err) {
            console.error("❌ Failed to fetch interview:", err);
        }
    };

    // when a person is selected
    useEffect(() => {
        if (selectedPerson?.applicant_number) {
            fetchInterviewData(selectedPerson.applicant_number);
        }
    }, [selectedPerson]);


    useEffect(() => {
        if (editingRemarkId !== null) {
            const stillEditing = uploads.find((u) => u.upload_id === editingRemarkId);
            if (stillEditing?.remarks === remarksMap[editingRemarkId]) {
                setEditingRemarkId(null); // reset only when new data matches
            }
        }
    }, [uploads]);



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

    const [examData, setExamData] = useState([]);
    // scores + percentages
    const [totalScore, setTotalScore] = useState(0);
    const [totalPercentage, setTotalPercentage] = useState(0);
    const [avgScore, setAvgScore] = useState(0);
    const [avgPercentage, setAvgPercentage] = useState(0);


    useEffect(() => {
        // No search text: keep explicit selection if present
        if (!searchQuery.trim()) {
            if (!explicitSelection) {
                setSelectedPerson(null);
                setPerson({
                    profile_img: "",
                    last_name: "",
                    first_name: "",
                    middle_name: "",
                    extension: "",
                });

                // reset exam data
                setExamData([
                    { TestArea: "English", RawScore: "", Percentage: "", User: "", DateCreated: "" },
                    { TestArea: "Science", RawScore: "", Percentage: "", User: "", DateCreated: "" },
                    { TestArea: "Filipino", RawScore: "", Percentage: "", User: "", DateCreated: "" },
                    { TestArea: "Math", RawScore: "", Percentage: "", User: "", DateCreated: "" },
                    { TestArea: "Abstract", RawScore: "", Percentage: "", User: "", DateCreated: "" },
                ]);

                setTotalScore(0);
                setTotalPercentage(0);
                setAvgScore(0);
                setAvgPercentage(0);
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
                last_name: "",
                first_name: "",
                middle_name: "",
                extension: "",
            });

            setExamData([
                { TestArea: "English", RawScore: "", Percentage: "", User: "", DateCreated: "" },
                { TestArea: "Science", RawScore: "", Percentage: "", User: "", DateCreated: "" },
                { TestArea: "Filipino", RawScore: "", Percentage: "", User: "", DateCreated: "" },
                { TestArea: "Math", RawScore: "", Percentage: "", User: "", DateCreated: "" },
                { TestArea: "Abstract", RawScore: "", Percentage: "", User: "", DateCreated: "" },
            ]);

            setTotalScore(0);
            setTotalPercentage(0);
            setAvgScore(0);
            setAvgPercentage(0);
        }
    }, [searchQuery, persons, explicitSelection]);

    const fetchPersons = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/upload_documents');
            setPersons(res.data);
        } catch (err) {
            console.error('Error fetching persons:', err);
        }
    };

    const handleStatusChange = async (uploadId, remarkValue) => {
        const remarks = remarksMap[uploadId] || ""; // get remarks for this upload ID

        try {
            await axios.put(`http://localhost:5000/uploads/remarks/${uploadId}`, {
                status: remarkValue,   // keep it as number now
                remarks: remarks,
            });

            if (selectedPerson?.applicant_number) {
                await fetchUploadsByApplicantNumber(selectedPerson.applicant_number);
                setEditingRemarkId(null);
            }
        } catch (err) {
            console.error('Error updating Status:', err);
        }
    };


    // Add state at top of Interview component
    const [interviewData, setInterviewData] = useState({
        entrance_exam_interviewer: "",
        college_interviewer: "",
        entrance_exam_score: 0,
        college_exam_score: 0,
        status: "",
        custom_status: "",
        remarks: ""
    });


    const [originalData, setOriginalData] = useState(interviewData);

    const handleInterviewChange = (e) => {
        const { name, value } = e.target;
        setInterviewData(prev => ({ ...prev, [name]: value }));
    };

    const saveInterview = async () => {
        try {
            if (!selectedPerson?.applicant_number) {
                alert("❌ Please select a valid applicant first.");
                return;
            }

            // ✅ Correct payload field names matching backend
            const payload = {
                applicant_number: selectedPerson.applicant_number,
                entrance_exam_interviewer: interviewData.entrance_exam_interviewer,
                college_interviewer: interviewData.college_interviewer,
                entrance_exam_score: interviewData.entrance_exam_score,
                college_exam_score: interviewData.college_exam_score,
                total_score:
                    (Number(interviewData.entrance_exam_score) +
                        Number(interviewData.college_exam_score)) /
                    2,
                status: interviewData.status,
                custom_status: interviewData.custom_status,
                remarks: interviewData.remarks,
            };

            await axios.post("http://localhost:5000/api/interview", payload);
            alert("✅ Interview saved successfully!");

            setOriginalData(interviewData);
            setFetchedInterview(interviewData);
        } catch (error) {
            console.error("❌ Error saving interview:", error);
            alert("Failed to save interview.");
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
                        INTERVIEW
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

                <TableContainer component={Paper} sx={{ width: "100%", border: "2px solid maroon" }}>
                    {/* Header Row: Centered Title */}
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
                        <Typography
                            sx={{
                                fontSize: "24px",
                                fontWeight: "bold",
                                fontFamily: "Arial",
                                color: "maroon",
                                textAlign: "center",
                            }}
                        >
                            Interview
                        </Typography>
                    </Box>

                    {/* Interviewer & Image Row */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 2,
                            p: 2,
                        }}
                    >
                        {/* Interviewer Fields (Left) */}
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ mb: 1, fontWeight: "bold" }}>Proctor</Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        name="entrance_exam_interviewer"
                                        value={interviewData.entrance_exam_interviewer}
                                        onChange={handleInterviewChange}
                                    />
                                </Box>

                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ mb: 1, fontWeight: "bold" }}>College Interviewer</Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        name="college_interviewer"
                                        value={interviewData.college_interviewer}
                                        onChange={handleInterviewChange}
                                    />
                                </Box>
                            </Box>
                        </Box>

                        {/* Profile Image (Right) */}
                        {person.profile_img && (
                            <Box
                                sx={{
                                    width: "2.1in",
                                    height: "2.1in",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                    mt: -8,
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

                    {/* ===== Rest of Form Section ===== */}
                    <Box sx={{ p: 2, mt: -5 }}>
                        {/* Scores */}
                        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ mb: 1, fontWeight: "bold" }}>Qualifying Exam Score (0-100)</Typography>
                                <TextField
                                    type="number"
                                    fullWidth
                                    name="entrance_exam_score"
                                    value={interviewData.entrance_exam_score || 0}
                                    onChange={handleInterviewChange}
                                />
                            </Box>

                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ mb: 1, fontWeight: "bold" }}>Qualifying Interview Score (0-100)</Typography>
                                <TextField
                                    type="number"
                                    fullWidth
                                    name="college_exam_score"
                                    value={interviewData.college_exam_score || 0}
                                    onChange={handleInterviewChange}
                                />
                            </Box>

                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ mb: 1, fontWeight: "bold" }}>Total Score (Average)</Typography>
                                <TextField
                                    fullWidth
                                    value={
                                        (Number(interviewData.entrance_exam_score || 0) +
                                            Number(interviewData.college_exam_score || 0)) / 2
                                    }
                                    InputProps={{ readOnly: true }}
                                />
                            </Box>
                        </Box>

                        {/* Status */}
                        <Typography sx={{ mb: 1, fontWeight: "bold" }}>Status</Typography>
                        <TextField
                            select
                            fullWidth
                            name="status"
                            value={interviewData.status}
                            onChange={handleInterviewChange}
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

                        {interviewData.status === "CUSTOM" && (
                            <>
                                <Typography sx={{ mb: 1, fontWeight: "bold" }}>Custom Status</Typography>
                                <TextField
                                    fullWidth
                                    name="custom_status"
                                    value={interviewData.custom_status}
                                    onChange={handleInterviewChange}
                                    sx={{ mb: 2 }}
                                />
                            </>
                        )}

                        {/* Remarks */}
                        <Typography sx={{ mb: 1, fontWeight: "bold" }}>Remarks</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            name="remarks"
                            value={interviewData.remarks}
                            onChange={handleInterviewChange}
                            sx={{ mb: 2 }}
                        />

                        {/* Buttons */}
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <Button variant="contained" color="error" onClick={() => setInterviewData({})}>
                                Reset
                            </Button>
                            <Button variant="contained" color="success" onClick={saveInterview}>
                                Save
                            </Button>
                            <Button variant="contained" color="warning" onClick={() => setInterviewData(originalData)}>
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                </TableContainer>

                <>




                </>

            </Box >
        </Box >
    );
};

export default Interview;