import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  Box,
  Button,
  Typography,
  Paper,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  DialogActions,
  Table,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  TableContainer,
  TableCell,
  TableBody,
  TableHead,
  Snackbar,
  Alert,
} from "@mui/material";
import { Search } from '@mui/icons-material';
import { Link, useLocation, useNavigate } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import ListAltIcon from "@mui/icons-material/ListAlt";

const socket = io("http://localhost:5000");


const AssignScheduleToApplicants = () => {
  const tabs = [
    { label: "Room Scheduling", to: "/assign_entrance_exam" },
    { label: "Applicant's Scheduling", to: "/assign_schedule_applicant" },
    { label: "Examination Profile", to: "/examination_profile" },
    { label: "Applicant's Score", to: "/applicant_scoring" },
    { label: "Proctor's Applicant List", to: "/proctor_applicant_list" },  
  ];




  const location = useLocation();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(3);
  const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));


  const handleStepClick = (index, to) => {
    setActiveStep(index);
    navigate(to); // this will actually change the page
  };


  const [applicants, setApplicants] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [selectedApplicants, setSelectedApplicants] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [persons, setPersons] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [person, setPerson] = useState({
    campus: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    document_status: "",
    extension: "",
    emailAddress: "",
    program: "",
  });
  const [selectedApplicantStatus, setSelectedApplicantStatus] = useState("");
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


  useEffect(() => {
    axios.get("http://localhost:5000/api/applied_program")
      .then(res => {
        setAllCurriculums(res.data);
        setCurriculumOptions(res.data);
      });
  }, []);


  const [allCurriculums, setAllCurriculums] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  const handleCloseSnack = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack(prev => ({ ...prev, open: false }));
  };


  useEffect(() => {
    fetchSchedules();
    fetchAllApplicants();
  }, []);

  // ✅ Keep your original function (exam_schedules)
  const fetchSchedules = async () => {
    try {
      const res = await axios.get("http://localhost:5000/exam_schedules");
      setSchedules(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    }
  };

  // ✅ Create a separate one for schedules with counts
  const fetchSchedulesWithCount = async () => {
    try {
      const res = await axios.get("http://localhost:5000/exam_schedules_with_count");
      setSchedules(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching schedules with count:", err);
    }
  };

  // ⬇️ Initial load
  useEffect(() => {
    fetchSchedulesWithCount();
    fetchAllApplicants();
  }, []);

  // ⬇️ Socket update refreshes the "with_count" one
  useEffect(() => {
    socket.on("schedule_updated", ({ schedule_id }) => {
      console.log("📢 Schedule updated:", schedule_id);
      fetchSchedulesWithCount();  // ✅ always refresh counts
      fetchAllApplicants();
    });

    return () => socket.off("schedule_updated");
  }, []);

  // ⬇️ Add this inside ApplicantList component, before useEffect
  const fetchAllApplicants = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/not-emailed-applicants");

      setPersons(res.data);  // ⬅️ keep all applicants
      setSelectedApplicants(prev => {
        const newSet = new Set(prev);
        res.data.forEach((a) => {
          if (a.schedule_id !== null) newSet.delete(a.applicant_number);
        });
        return newSet;
      });
    } catch (err) {
      console.error("Error fetching all-applicants:", err);
    }
  };

  // ================= FUNCTIONS =================
  const [customCount, setCustomCount] = useState(0);


  // toggleSelectApplicant
  const handleAssignSingle = (id) => {
    if (!selectedSchedule) {
      setSnack({
        open: true,
        message: "Please select a schedule first.",
        severity: "warning",
      });
      return;
    }

    socket.emit("update_schedule", { schedule_id: selectedSchedule, applicant_numbers: [id] });

    socket.once("update_schedule_result", (res) => {
      if (res.success) {
        setSnack({
          open: true,
          message: `Applicant ${id} assigned successfully.`,
          severity: "success",
        });
        fetchAllApplicants();
      } else {
        setSnack({
          open: true,
          message: res.error || "Failed to assign applicant.",
          severity: "error",
        });
      }
    });
  };


  // handleAssign40 (assign max up to room_quota)
  const handleAssign40 = () => {
    if (!selectedSchedule) {
      setSnack({ open: true, message: "Please select a schedule first.", severity: "warning" });
      return;
    }

    const schedule = schedules.find(s => s.schedule_id === selectedSchedule);
    if (!schedule) {
      setSnack({ open: true, message: "Selected schedule not found.", severity: "error" });
      return;
    }

    const currentCount = schedule.current_occupancy || 0;   // ✅ define it here
    const maxSlots = schedule.room_quota || 40;             // ✅ use DB quota if available
    const availableSlots = maxSlots - currentCount;

    if (availableSlots <= 0) {
      setSnack({ open: true, message: `This schedule is already full (${maxSlots} applicants).`, severity: "error" });
      return;
    }

    // take as many unassigned as we can up to availableSlots
    const unassigned = persons
      .filter(a => a.schedule_id == null)
      .slice(0, availableSlots)
      .map(a => a.applicant_number);

    if (unassigned.length === 0) {
      setSnack({ open: true, message: "No unassigned applicants available.", severity: "warning" });
      return;
    }

    socket.emit("update_schedule", { schedule_id: selectedSchedule, applicant_numbers: unassigned });

    socket.once("update_schedule_result", (res) => {
      if (res.success) {
        setSnack({
          open: true,
          message: `Assigned: ${res.assigned?.length || 0}, Updated: ${res.updated?.length || 0}, Skipped: ${res.skipped?.length || 0}`,
          severity: "success"
        });
        fetchAllApplicants();
        setSchedules(prev =>
          prev.map(s =>
            s.schedule_id === selectedSchedule
              ? { ...s, current_occupancy: currentCount + (res.assigned?.length || 0) }
              : s
          )
        );
      } else {
        setSnack({ open: true, message: res.error || "Failed to assign applicants.", severity: "error" });
      }
    });
  };


  // handleUnassignImmediate
  const handleUnassignImmediate = async (applicant_number) => {
    try {
      await axios.post("http://localhost:5000/unassign_schedule", { applicant_number });

      setPersons(prev =>
        prev.map(p =>
          p.applicant_number === applicant_number
            ? { ...p, schedule_id: null }
            : p
        )
      );

      setSelectedApplicants(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicant_number);
        return newSet;
      });

      setSnack({ open: true, message: `Applicant ${applicant_number} unassigned successfully.`, severity: "success" });
    } catch (err) {
      console.error("Error unassigning applicant:", err);
      setSnack({ open: true, message: err.response?.data?.error || "Failed to unassign applicant.", severity: "error" });
    }
  };

  // handleAssignCustom
  const handleAssignCustom = () => {
    if (!selectedSchedule) {
      setSnack({ open: true, message: "Please select a schedule first.", severity: "warning" });
      return;
    }
    if (customCount <= 0) {
      setSnack({ open: true, message: "Please enter a valid number of applicants.", severity: "warning" });
      return;
    }

    const schedule = schedules.find(s => s.schedule_id === selectedSchedule);
    if (!schedule) {
      setSnack({ open: true, message: "Selected schedule not found.", severity: "error" });
      return;
    }

    const currentCount = schedule.current_occupancy || 0;
    const maxSlots = schedule.room_quota || 40; // <-- ✅ use DB quota, fallback 40
    const availableSlots = maxSlots - currentCount;

    if (availableSlots <= 0) {
      setSnack({ open: true, message: `This schedule is already full (${maxSlots} applicants).`, severity: "error" });
      return;
    }

    const assignCount = Math.min(customCount, availableSlots);

    const unassigned = persons
      .filter(a => a.schedule_id == null)
      .slice(0, assignCount)
      .map(a => a.applicant_number);

    if (unassigned.length === 0) {
      setSnack({ open: true, message: "No unassigned applicants available.", severity: "warning" });
      return;
    }

    socket.emit("update_schedule", { schedule_id: selectedSchedule, applicant_numbers: unassigned });

    socket.once("update_schedule_result", (res) => {
      if (res.success) {
        setSnack({
          open: true,
          message: `Assigned: ${res.assigned?.length || 0}, Updated: ${res.updated?.length || 0}, Skipped: ${res.skipped?.length || 0}`,
          severity: "success"
        });
        fetchAllApplicants();
        setSchedules(prev =>
          prev.map(s =>
            s.schedule_id === selectedSchedule
              ? { ...s, current_occupancy: currentCount + (res.assigned?.length || 0) }
              : s
          )
        );
      } else {
        setSnack({ open: true, message: res.error || "Failed to assign applicants.", severity: "error" });
      }
    });
  };

  // handleUnassignAll
  const handleUnassignAll = async () => {
    if (!selectedSchedule) {
      setSnack({ open: true, message: "Please select a schedule first.", severity: "warning" });
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/unassign_all_from_schedule", { schedule_id: selectedSchedule });
      setSnack({ open: true, message: res.data.message, severity: "success" });

      fetchAllApplicants();
      setSchedules(prev =>
        prev.map(s =>
          s.schedule_id === selectedSchedule
            ? { ...s, current_occupancy: 0 }
            : s
        )
      );
    } catch (err) {
      console.error("Error unassigning all:", err);
      setSnack({ open: true, message: err.response?.data?.error || "Failed to unassign all applicants.", severity: "error" });
    }
  };

  // handleSendEmails
  const handleSendEmails = () => {
    if (!selectedSchedule) {
      setSnack({ open: true, message: "Please select a schedule first.", severity: "warning" });
      return;
    }
    setConfirmOpen(true);
  };

  const confirmSendEmails = () => {
    setConfirmOpen(false);

    if (!selectedSchedule) {
      setSnack({ open: true, message: "Please select a schedule first.", severity: "warning" });
      return;
    }

    // ✅ get applicants from persons already assigned to this schedule
    const assignedApplicants = persons
      .filter(p => p.schedule_id === selectedSchedule)
      .map(p => p.applicant_number);

    if (assignedApplicants.length === 0) {
      setSnack({ open: true, message: "No applicants assigned to this schedule.", severity: "warning" });
      return;
    }

    // ✅ directly send the emails
    socket.emit("send_schedule_emails", { schedule_id: selectedSchedule, applicant_numbers: assignedApplicants });

    socket.once("send_schedule_emails_result", (emailRes) => {
      if (emailRes.success) {
        setSnack({
          open: true,
          message: emailRes.message || "Emails sent successfully.",
          severity: "success"
        });
        setSelectedApplicants(new Set()); // clear selections
      } else {
        setSnack({
          open: true,
          message: emailRes.error || "Failed to send emails.",
          severity: "error"
        });
      }
    });


  };





  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await axios.get("http://localhost:5000/exam_schedules_with_count");
        setSchedules(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching schedules:", err);
      }
    };

    fetchSchedules();
  }, []);


  const [itemsPerPage, setItemsPerPage] = useState(100);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim() === "") return;

      try {
        const res = await axios.get("http://localhost:5000/api/search-person", {
          params: { query: searchQuery }
        });

        setPerson(res.data); // ❌ don't do this
      } catch (err) {
        setSearchError("Applicant not found");
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("");
  const [department, setDepartment] = useState([]);


  // ✅ Step 1: Filtering
  const filteredPersons = persons.filter((personData) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${personData.first_name ?? ""} ${personData.middle_name ?? ""} ${personData.last_name ?? ""}`.toLowerCase();

    const matchesApplicantID = personData.applicant_number?.toString().toLowerCase().includes(query);
    const matchesName = fullName.includes(query);
    const matchesEmail = personData.emailAddress?.toLowerCase().includes(query); // ✅ included

    const programInfo = allCurriculums.find(
      (opt) => opt.curriculum_id?.toString() === personData.program?.toString()
    );
    const matchesProgramQuery = programInfo?.program_code?.toLowerCase().includes(query);

    const matchesDepartment =
      selectedDepartmentFilter === "" || programInfo?.dprtmnt_name === selectedDepartmentFilter;

    const matchesProgramFilter =
      selectedProgramFilter === "" || programInfo?.program_code === selectedProgramFilter;

    return (
      (matchesApplicantID || matchesName || matchesEmail || matchesProgramQuery) &&
      matchesDepartment &&
      matchesProgramFilter
    );
  });


  const sortedPersons = [...filteredPersons].sort((a, b) => {
    if (sortBy === "name") {
      // ✅ sort by last name first, then first + middle
      const nameA = `${a.last_name ?? ""} ${a.first_name ?? ""} ${a.middle_name ?? ""}`.toLowerCase();
      const nameB = `${b.last_name ?? ""} ${b.first_name ?? ""} ${b.middle_name ?? ""}`.toLowerCase();
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }

    if (sortBy === "id") {
      const idA = a.applicant_number ?? "";
      const idB = b.applicant_number ?? "";
      return sortOrder === "asc" ? idA - idB : idB - idA;
    }

    if (sortBy === "email") {
      const emailA = a.emailAddress?.toLowerCase() ?? "";
      const emailB = b.emailAddress?.toLowerCase() ?? "";
      return sortOrder === "asc" ? emailA.localeCompare(emailB) : emailB.localeCompare(emailA);
    }

    return 0;
  });

  // ✅ Step 3: Pagination (use sortedPersons instead of filteredPersons)
  const totalPages = Math.ceil(sortedPersons.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPersons = sortedPersons.slice(indexOfFirstItem, indexOfLastItem);


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
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [filteredPersons.length, totalPages]);




  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent" }}>

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
          APPLICANT SCHEDULING
        </Typography>

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
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />

      <br />
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



      <div style={{ height: "40px" }}></div>


      <TableContainer component={Paper} sx={{ width: '100%', border: "2px solid maroon", }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#6D2323' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', textAlign: "Center" }}>Schedule</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      <Paper
        sx={{
          width: "100%",

          p: 3,

          border: "3px solid maroon",
          bgcolor: "white",
          boxShadow: "0 3px 12px rgba(0,0,0,0.1)",

        }}
      >
        <Box >

          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* Select Schedule */}
            <Grid item xs={12} md={3}>
              <Typography textAlign="left" color="maroon" sx={{ mb: 1 }}>
                Select Schedule:
              </Typography>
              <TextField
                select
                fullWidth
                value={selectedSchedule}
                onChange={(e) => setSelectedSchedule(e.target.value)}
                variant="outlined"
                sx={{
                  border: "3px solid maroon",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  bgcolor: "white",
                }}
              >
                <MenuItem value="">-- Select Schedule --</MenuItem>
                {schedules.map((s) => (
                  <MenuItem key={s.schedule_id} value={s.schedule_id}>
                    {s.proctor} - {s.day_description} | {s.room_description} |{" "}
                    {new Date(`1970-01-01T${s.start_time}`).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    -{" "}
                    {new Date(`1970-01-01T${s.end_time}`).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </MenuItem>

                ))}
              </TextField>
            </Grid>

            {/* Proctor */}
            <Grid item xs={12} md={3}>
              <Typography textAlign="left" color="maroon" sx={{ mb: 1 }}>
                Proctor:
              </Typography>
              <TextField
                fullWidth
                value={
                  selectedSchedule
                    ? schedules.find((s) => s.schedule_id === selectedSchedule)?.proctor || "Not assigned"
                    : ""
                }
                InputProps={{ readOnly: true }}
                variant="outlined"
                sx={{
                  border: "3px solid maroon",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  bgcolor: "#f9f9f9",
                }}
              />
            </Grid>

            {/* Room Quota */}
            <Grid item xs={12} md={3}>
              <Typography textAlign="left" color="maroon" sx={{ mb: 1 }}>
                Room Quota:
              </Typography>
              <TextField
                fullWidth
                value={
                  selectedSchedule
                    ? schedules.find((s) => s.schedule_id === selectedSchedule)?.room_quota || "N/A"
                    : ""
                }
                InputProps={{ readOnly: true }}
                variant="outlined"
                sx={{
                  border: "3px solid maroon",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  bgcolor: "#f9f9f9",
                }}
              />
            </Grid>

            {/* Current Occupancy */}
            <Grid item xs={12} md={3}>
              <Typography textAlign="left" color="maroon" sx={{ mb: 1 }}>
                Current Occupancy:
              </Typography>
              <TextField
                fullWidth
                value={
                  selectedSchedule
                    ? (() => {
                      const s = schedules.find((x) => x.schedule_id === selectedSchedule);
                      return s ? `${s.current_occupancy}/${s.room_quota}` : "";
                    })()
                    : ""
                }
                InputProps={{ readOnly: true }}
                variant="outlined"
                sx={{
                  border: "3px solid maroon",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  bgcolor: "#f9f9f9",
                }}
              />
            </Grid>
          </Grid>

        </Box>
        {/* === ROW 1: Sort + Buttons === */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          {/* LEFT SIDE: Sort By + Sort Order */}
          <Box display="flex" alignItems="center" gap={2}>
            {/* Sort By */}
            <Box display="flex" alignItems="center" gap={1} marginLeft={-4}>
              <Typography fontSize={13} sx={{ minWidth: "80px", textAlign: "right" }}>
                Sort By:
              </Typography>
              <FormControl size="small" sx={{ width: "200px" }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="name">Applicant's Name</MenuItem>
                  <MenuItem value="id">Applicant ID</MenuItem>
                  <MenuItem value="email">Email Address</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Sort Order */}
            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={13} sx={{ minWidth: "80px", textAlign: "right" }}>
                Sort Order:
              </Typography>
              <FormControl size="small" sx={{ width: "150px" }}>
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>


          {/* RIGHT SIDE: Action Buttons */}
          <Box display="flex" gap={2} alignItems="center">
            <Button
              variant="contained"
              color="secondary"
              onClick={handleAssign40}
              sx={{ minWidth: 150 }}
            >
              Assign Max
            </Button>


            {/* 🔥 New Custom Assign Input + Button */}
            <TextField
              type="number"
              size="small"
              label="Custom Count"
              value={customCount}
              onChange={(e) => setCustomCount(Number(e.target.value))}
              sx={{ width: 120 }}
            />
            <Button
              variant="contained"
              color="warning"
              onClick={handleAssignCustom}
              sx={{ minWidth: 150 }}
            >
              Assign Custom
            </Button>

            {/* 🔥 New Unassign All Button */}
            <Button
              variant="contained"
              color="error"
              onClick={handleUnassignAll}
              sx={{ minWidth: 150 }}
            >
              Unassign All
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={handleSendEmails}
              sx={{ minWidth: 150 }}
            >
              Send Emails
            </Button>
          </Box>

        </Box>

        {/* === ROW 2: Department + Program === */}
        <Box display="flex" alignItems="center" gap={3} mb={2}>
          {/* Department Filter */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontSize={13} sx={{ minWidth: "100px" }}>Department:</Typography>
            <FormControl size="small" sx={{ width: "350px" }}>
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

          {/* Program Filter */}
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


      </Paper>

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

      <TableContainer component={Paper} sx={{ width: "100%", border: "2px solid maroon" }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#F1F1F1", }}>
            <TableRow>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>#</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>Applicant ID</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>Name</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>Program</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>Email Address</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", color: "maroon", border: "2px solid maroon" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentPersons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center", p: 2 }}>
                  No applicants found.
                </TableCell>
              </TableRow>
            ) : (
              currentPersons.map((person, index) => {
                const id = person.applicant_number;
                const isAssigned = person.schedule_id !== null;
                const isSelected = selectedApplicants.has(id);

                return (
                  <TableRow key={person.person_id}>
                    {/* Auto-increment # */}
                    <TableCell sx={{ textAlign: "center", border: "1px solid maroon", borderLeft: "2px solid maroon", fontSize: "12px" }}>
                      {indexOfFirstItem + index + 1}
                    </TableCell>

                    {/* Applicant ID */}
                    <TableCell sx={{ textAlign: "center", border: "1px solid maroon", fontSize: "12px" }}>
                      {person.applicant_number ?? "N/A"}
                    </TableCell>

                    {/* Applicant Name */}
                    <TableCell sx={{ textAlign: "left", border: "1px solid maroon", fontSize: "12px" }}>
                      {`${person.last_name}, ${person.first_name} ${person.middle_name ?? ""} ${person.extension ?? ""}`}
                    </TableCell>

                    {/* Program */}
                    <TableCell sx={{ textAlign: "center", border: "1px solid maroon", fontSize: "12px" }}>
                      {curriculumOptions.find(
                        (item) => item.curriculum_id?.toString() === person.program?.toString()
                      )?.program_code ?? "N/A"}
                    </TableCell>

                    {/* Email */}
                    <TableCell sx={{ textAlign: "center", border: "1px solid maroon", fontSize: "12px" }}>
                      {person.emailAddress ?? "N/A"}
                    </TableCell>

                    {/* Action Buttons (from AssignScheduleToApplicants) */}
                    {/* Action Buttons (from AssignScheduleToApplicants) */}
                    <TableCell
                      sx={{
                        textAlign: "center",
                        border: "1px solid maroon",
                        borderRight: "2px solid maroon",
                      }}
                    >
                      {!isAssigned ? (
                        // ✅ Not assigned → Assign only
                        <Button
                          variant="outlined"
                          color="success"
                          size="small"
                          onClick={() => handleAssignSingle(id)} // new helper for 1 applicant
                        >
                          Assign
                        </Button>
                      ) : (
                        // ✅ Already assigned → show Unassign + Send Email
                        <Box display="flex" gap={1} justifyContent="center">
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleUnassignImmediate(id)}
                          >
                            Unassign
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => {
                              setConfirmOpen(true);                // open confirmation dialog
                              setSelectedApplicants(new Set([id])); // pick only this applicant
                            }}
                          >
                            Send Email
                          </Button>
                        </Box>
                      )}
                    </TableCell>

                  </TableRow>
                );
              })
            )}
          </TableBody>



        </Table>
      </TableContainer>

      <br />



      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={handleCloseSnack} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>





      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Email Sending</DialogTitle>
        <DialogContent>
          Are you sure you want to send exam schedule emails? Please confirm that
          the Applicant's Emailed Address are correct.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="error">
            Cancel
          </Button>
          <Button onClick={confirmSendEmails} color="success" variant="contained">
            Yes, Send Emails
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AssignScheduleToApplicants;
