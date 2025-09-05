import React, { useState, useEffect } from "react";
import axios from 'axios';
import {
    Box,
    Button,
    Typography,
    Paper,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TextField,
    TableRow,
    MenuItem
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
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

const CollegeApproval = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(4);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));
    const [explicitSelection, setExplicitSelection] = useState(false);

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
            navigate("/medical_clearance"); // if no pid in session, just go raw
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
        program: "",
        last_name: "",
        first_name: "",
        middle_name: "",
        extension: "",
    });
    const [editingRemarkId, setEditingRemarkId] = useState(null);

    // Add this state for components
    const [components, setComponents] = useState([
        { name: "English", percentage: 0, score: 0 },
        { name: "Science", percentage: 0, score: 0 },
        { name: "Filipino", percentage: 0, score: 0 },
        { name: "Math", percentage: 0, score: 0 },
        { name: "Abstract", percentage: 0, score: 0 },
    ]);

// Fetch existing college approval by person_id
const fetchCollegeApproval = async (personID) => {
  try {
    const res = await axios.get(`http://localhost:5000/college_approval/${personID}`);
    if (res.data) {
      setCollegeApprovalData(res.data);

      // Map backend fields → components array
      setComponents([
        { name: "English", percentage: res.data.english_percentage || 0, score: res.data.english_score || 0 },
        { name: "Science", percentage: res.data.science_percentage || 0, score: res.data.science_score || 0 },
        { name: "Filipino", percentage: res.data.filipino_percentage || 0, score: res.data.filipino_score || 0 },
        { name: "Math", percentage: res.data.math_percentage || 0, score: res.data.math_score || 0 },
        { name: "Abstract", percentage: res.data.abstract_percentage || 0, score: res.data.abstract_score || 0 },
      ]);
    }
  } catch (err) {
    console.error("❌ Failed to fetch college approval:", err);
  }
};

   // Save (insert or update)
const handleSaveApproval = async () => {
  if (!selectedPerson?.person_id) {
    alert("⚠ No applicant selected!");
    return;
  }

  try {
    const payload = {
      person_id: selectedPerson.person_id,
      english_percentage: components.find(c => c.name === "English")?.percentage || 0,
      english_score: components.find(c => c.name === "English")?.score || 0,
      science_percentage: components.find(c => c.name === "Science")?.percentage || 0,
      science_score: components.find(c => c.name === "Science")?.score || 0,
      filipino_percentage: components.find(c => c.name === "Filipino")?.percentage || 0,
      filipino_score: components.find(c => c.name === "Filipino")?.score || 0,
      math_percentage: components.find(c => c.name === "Math")?.percentage || 0,
      math_score: components.find(c => c.name === "Math")?.score || 0,
      abstract_percentage: components.find(c => c.name === "Abstract")?.percentage || 0,
      abstract_score: components.find(c => c.name === "Abstract")?.score || 0,
      percentage_score: components.reduce((sum, c) => sum + Number(c.percentage || 0), 0),
      total: components.reduce((sum, c) => sum + Number(c.score || 0), 0),
      status: collegeApprovalData.status || "",
      custom_status: collegeApprovalData.custom_status || null,
    };

    await axios.post("http://localhost:5000/college_approval", payload);
    alert("✅ College Approval saved!");
  } catch (err) {
    console.error("❌ Failed to save college approval:", err);
    alert("Error saving college approval.");
  }
};


    useEffect(() => {
        const totalPercentage = components.reduce((sum, c) => sum + Number(c.percentage || 0), 0);
        const weightedTotal = components.reduce(
            (sum, c) => sum + ((Number(c.score) || 0) * (Number(c.percentage) || 0)) / 100,
            0
        );

        setCollegeApprovalData((prev) => ({
            ...prev,
            percentage_score: totalPercentage,
            total: weightedTotal,
        }));
    }, [components]);



    // Auto compute totals when components change
    useEffect(() => {
        const totalPercentage = components.reduce((sum, c) => sum + Number(c.percentage || 0), 0);
        const totalScore = components.reduce((sum, c) => sum + Number(c.score || 0), 0);

        setCollegeApprovalData((prev) => ({
            ...prev,
            percentage_score: totalPercentage,
            total: totalScore,
        }));
    }, [components]);

    // Update handler
    const handleComponentChange = (index, field, value) => {
        setComponents((prev) =>
            prev.map((c, i) =>
                i === index ? { ...c, [field]: Number(value) } : c
            )
        );
    };



    useEffect(() => {
        if (selectedPerson?.person_id) {
            fetchCollegeApproval(selectedPerson.person_id);
        }
    }, [selectedPerson]);





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




    const [collegeApprovalData, setCollegeApprovalData] = useState({
        person_id: person?.id ?? "",
        percentage_score: "",
        score: "",
        total: "",
        status: "",
        custom_status: "",
        remarks: "",
    });


    const handleCollegeApprovalChange = (e) => {
        const { name, value } = e.target;
        setCollegeApprovalData((prev) => ({
            ...prev,
            [name]: value,
        }));
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
                document_status: res.data.document_status || "", // set default here
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
        if (!searchQuery.trim()) {
            // empty search input: clear everything
            setSelectedPerson(null);
            setPerson({
                profile_img: "",
                generalAverage1: "",
                last_name: "",
                first_name: "",
                middle_name: "",
                extension: "",
            });

            return;
        }

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
    }, [searchQuery, persons]);


    const fetchPersons = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/upload_documents');
            setPersons(res.data);
        } catch (err) {
            console.error('Error fetching persons:', err);
        }
    };


    const [curriculumOptions, setCurriculumOptions] = useState([]);

    useEffect(() => {
        const fetchCurriculums = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/applied_program");
                setCurriculumOptions(response.data);
            } catch (error) {
                console.error("Error fetching curriculum options:", error);
            }
        };

        fetchCurriculums();
    }, []);

    console.log("person.program:", person.program);
    console.log("curriculumOptions:", curriculumOptions);

    {
        curriculumOptions.find(
            (item) =>
                item?.curriculum_id?.toString() === (person?.program ?? "").toString()
        )?.program_description || (person?.program ?? "")

    }





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
                        COLLEGE APPROVAL
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
                            College Approval
                        </Typography>
                    </Box>

                    {/* Interviewer & Image Row */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between", // pushes Program left, Image right
                            alignItems: "center",
                            p: 2,
                            gap: 2,
                        }}
                    >
                        {/* Left side: Program */}
                        <Box sx={{ flex: 1 }}>
                            <Typography
                                sx={{
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    mb: 1,
                                }}
                            >
                                Program:
                            </Typography>

                            <TextField
                                select
                                label="Course & Major"
                                value={person?.program ?? ""}
                                onChange={(e) =>
                                    setPerson((prev) => ({
                                        ...prev,
                                        program: e.target.value,
                                    }))
                                }
                                fullWidth
                                style={{ width: "750px" }}
                                size="small"
                                SelectProps={{ readOnly: true }}
                            >
                                {curriculumOptions.length > 0 ? (
                                    curriculumOptions.map((item) => (
                                        <MenuItem key={item.curriculum_id} value={item.curriculum_id}>
                                            {item.program_description}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>Loading...</MenuItem>
                                )}
                            </TextField>
                        </Box>

                        {/* Right side: Profile Image */}
                        {person.profile_img && (
                            <Box
                                sx={{
                                    width: "2.1in",
                                    height: "2.1in",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                    mt: -9,
                                    flexShrink: 0, // keeps image from shrinking
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


                    {/* Table Section (centered only) */}
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
                        <Table sx={{ border: "2px solid maroon", width: "95%" }}>
                            <TableHead sx={{ backgroundColor: "#6D2323" }}>
                                <TableRow>
                                    <TableCell sx={{ color: "white", textAlign: "center", width: "20%" }}>
                                        COMPONENTS
                                    </TableCell>
                                    <TableCell sx={{ color: "white", textAlign: "center", width: "20%" }}>
                                        PERCENTAGE
                                    </TableCell>
                                    <TableCell sx={{ color: "white", textAlign: "center", width: "20%" }}>
                                        SCORE
                                    </TableCell>
                                    <TableCell sx={{ color: "white", textAlign: "center", width: "15%" }}>
                                        TOTAL
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {components.map((comp, index) => (
                                    <TableRow key={comp.name}>
                                        <TableCell sx={{ border: "1px solid maroon" }}>{comp.name}</TableCell>

                                        {/* Percentage */}
                                        <TableCell sx={{ border: "1px solid maroon" }}>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                type="number"
                                                value={comp.percentage}
                                                onChange={(e) =>
                                                    handleComponentChange(index, "percentage", e.target.value)
                                                }
                                            />
                                        </TableCell>

                                        {/* Score */}
                                        <TableCell sx={{ border: "1px solid maroon" }}>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                type="number"
                                                value={comp.score}
                                                onChange={(e) =>
                                                    handleComponentChange(index, "score", e.target.value)
                                                }
                                            />
                                        </TableCell>

                                        {/* Row Total */}
                                        <TableCell sx={{ border: "1px solid maroon", textAlign: "center" }}>
                                            {Number(comp.percentage || 0) + Number(comp.score || 0)}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {/* Grand Total Row */}
                                <TableRow>
                                    <TableCell sx={{ fontWeight: "bold", border: "1px solid maroon" }}>
                                        FINAL RATING
                                    </TableCell>

                                    {/* Sum of percentages */}
                                    <TableCell sx={{ border: "1px solid maroon", textAlign: "center" }}>
                                        {components.reduce((sum, c) => sum + Number(c.percentage || 0), 0)}
                                    </TableCell>

                                    {/* Sum of raw scores */}
                                    <TableCell sx={{ border: "1px solid maroon", textAlign: "center" }}>
                                        {components.reduce((sum, c) => sum + Number(c.score || 0), 0)}
                                    </TableCell>

                                    {/* Weighted final total */}
                                    <TableCell sx={{ border: "1px solid maroon", textAlign: "center" }}>
                                        {components.reduce(
                                            (sum, c) => sum + ((Number(c.score) || 0) * (Number(c.percentage) || 0)) / 100,
                                            0
                                        ).toFixed(2)}
                                    </TableCell>
                                </TableRow>


                            </TableBody>
                        </Table>
                    </Box>


                    {/* Status Section (left aligned) */}
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

                        <Box sx={{ flex: 1 }}>
                            <TextField
                                select
                                name="status"
                                value={collegeApprovalData.status}
                                onChange={handleCollegeApprovalChange}
                                fullWidth
                                size="small"
                                sx={{ width: "600px" }}
                            >
                                <MenuItem value="Accepted">Accepted</MenuItem>
                                <MenuItem value="On Process">On Process</MenuItem>
                                <MenuItem value="Rejected">Rejected</MenuItem>
                                <MenuItem value="Waiting List">Waiting List</MenuItem>
                                <MenuItem value="Documents Verified & ECAT">Documents Verified & ECAT</MenuItem>
                                <MenuItem value="Disapproved">Disapproved</MenuItem>
                                <MenuItem value="Program Closed">Program Closed</MenuItem>
                                <MenuItem value="Already Student">Already Student</MenuItem>
                            </TextField>
                        </Box>
                    </Box>

                    {collegeApprovalData.status === "CUSTOM" && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}>
                            <Typography
                                sx={{
                                    minWidth: "120px",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    textAlign: "left",
                                }}
                            >
                                Custom Status:
                            </Typography>

                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    fullWidth
                                    name="custom_status"
                                    value={collegeApprovalData.custom_status}
                                    onChange={handleCollegeApprovalChange}
                                    size="small"
                                    sx={{ width: "600px" }}
                                />
                            </Box>
                        </Box>
                    )}

                    <Button
                        variant="contained"
                        sx={{ mt: 2, backgroundColor: "maroon", marginLeft: "40px", mb: 2 }}
                        onClick={handleSaveApproval}
                    >
                        Save
                    </Button>



                </TableContainer>

                <>




                </>

            </Box >
        </Box >
    );
};

export default CollegeApproval;