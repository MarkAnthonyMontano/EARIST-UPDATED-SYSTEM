import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search } from "@mui/icons-material";
import { FcPrint } from "react-icons/fc";
import EaristLogo from "../assets/EaristLogo.png";

const ProctorApplicantList = () => {

  const tabs = [
    { label: "Room Scheduling", to: "/assign_entrance_exam" },
    { label: "Applicant's Scheduling", to: "/assign_schedule_applicant" },
    { label: "Examination Profile", to: "/examination_profile" },
    { label: "Entrance Examation Scores", to: "/applicant_scoring" },
    { label: "Qualifying Examination", to: "/qualifying_exam_scores" },
    { label: "Proctor's Applicant List", to: "/proctor_applicant_list" },
  ];
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(3);
  const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));


  const handleStepClick = (index, to) => {
    setActiveStep(index);
    navigate(to); // this will actually change the page
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [proctor, setProctor] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [person, setPerson] = useState({
    campus: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    program: "",
    extension: "",


  });

  const handleSearch = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/proctor-applicants",
        { params: { query: searchQuery } }
      );
      setProctor(data[0]?.schedule || null); // first schedule if multiple
      setApplicants(data[0]?.applicants || []);
    } catch (err) {
      console.error(err);
    }
  };

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

  const printDiv = () => {
    const newWin = window.open("", "Print-Window");
    newWin.document.open();
    newWin.document.write(`
      <html>
        <head>
          <title>Proctor Applicant List</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
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
  border: 2px solid maroon;
  padding: 6px;
  font-size: 12px;
  text-align: left;   /* default for data */
}
th {
  text-align: center; /* center header text */
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
              <img src="${EaristLogo}" alt="Earist Logo" />
              <div>
                <div>Republic of the Philippines</div>
                <b style="letter-spacing: 1px; font-size: 20px;">
                  Eulogio "Amang" Rodriguez
                </b>
                <div style="letter-spacing: 1px; font-size: 20px;">
                  <b>Institute of Science and Technology</b>
                </div>
                <div>Nagtahan St. Sampaloc, Manila</div>
                <div style="margin-top: 25px;">
                  <b style="font-size: 22px; letter-spacing: 1px;">
                    Proctor Applicant List
                  </b>
                </div>
              </div>
            </div>

         <!-- Proctor Info -->
<div style="margin-top: 20px; width: 100%; display: flex; flex-direction: column; gap: 8px;">

  <!-- Row 1 -->
  <div style="display: flex; justify-content: space-between; width: 100%;">
    <span><b>Proctor:</b> ${proctor?.proctor || "N/A"}</span>
    <span><b>Building:</b> ${proctor?.room_description || "N/A"}</span>
  </div>

  <!-- Row 2 -->
  <div style="display: flex; justify-content: space-between; width: 100%;">
    <span><b>Room:</b> ${proctor?.room_no || "N/A"}</span>
    <span><b>Schedule:</b> 
      ${proctor?.day_description || ""} | 
      ${proctor?.start_time
        ? new Date(`1970-01-01T${proctor.start_time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
        : ""} 
      - 
      ${proctor?.end_time
        ? new Date(`1970-01-01T${proctor.end_time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
        : ""}
    </span>
  </div>

</div>

            <!-- Table -->
           <table>
  <thead>
    <tr>
      <th>#</th>
      <th>Applicant #</th>
      <th>Applicant Name</th>
      <th>Program</th>
    </tr>
  </thead>
  <tbody>
    ${applicants
        .map(
          (a, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${a.applicant_number}</td>
        <td>${a.last_name}, ${a.first_name} ${a.middle_name || ""}</td>
      <td>${curriculumOptions.find(
            (item) => item.curriculum_id?.toString() === a.program?.toString()
          )?.program_code ?? "N/A"
            }</td>

      </tr>
    `
        )
        .join("")}
    <tr>
      <td colspan="4" style="text-align:right; font-weight:bold;">
        Total Applicants: ${applicants.length}
      </td>
    </tr>
  </tbody>
</table>

          </div>
        </body>
      </html>
    `);
    newWin.document.close();
  };


  // 🔎 Auto-search whenever searchQuery changes (debounced)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim() !== "") {
        handleSearch();
      } else {
        setApplicants([]); // clear results if empty search
        setProctor(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);


  return (
    <Box sx={{ height: 'calc(100vh - 150px)', overflowY: 'auto', pr: 1, }}>
      {/* Header with Search aligned right */}
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
            fontWeight: "bold",
            color: "maroon",
            fontSize: "36px",
          }}
        >
          Proctor Applicant List
        </Typography>

        <TextField
          variant="outlined"
          placeholder="Search Proctor Name / Email"
          size="small"
          style={{ width: "450px" }}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // reset page when searching
            handleSearch(); // 🔍 auto-search as you type
          }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1 }} />,
          }}
        />
      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
    
      {applicants.length > 0 && (
        <Button
          onClick={printDiv}
          variant="outlined"
          sx={{
            padding: "5px 20px",
            border: "2px solid black",
            backgroundColor: "#f0f0f0",
            color: "black",
            borderRadius: "5px",
            fontSize: "14px",
            fontWeight: "bold",
            height: "40px",
            display: "flex",
            alignItems: "center",
            gap: 1, // 8px gap between icon and text
            userSelect: "none",
            transition: "background-color 0.3s, transform 0.2s",
            "&:hover": {
              backgroundColor: "#d3d3d3",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
          }}
          startIcon={<FcPrint size={20} />}
        >
          Print Applicant List
        </Button>

      )}
      <br />

     <Box display="flex" sx={{ border: "2px solid maroon", borderRadius: "4px", overflow: "hidden" }}>
  {tabs.map((tab, index) => {
    const isActive = location.pathname === tab.to;

    return (
      <Link
        key={index}
        to={tab.to}
        style={{ textDecoration: "none", flex: 1 }}
      >
        <Box
          sx={{
            backgroundColor: isActive ? "#6D2323" : "#E8C999",  // ✅ active vs default
            padding: "16px",
            color: isActive ? "#ffffff" : "#000000",            // ✅ text color contrast
            textAlign: "center",
            height: "75px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            borderRight: index !== tabs.length - 1 ? "2px solid white" : "none",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: isActive ? "#6D2323" : "#f9f9f9",
              color: isActive ? "#ffffff" : "#6D2323",
            },
          }}
        >
          <Typography sx={{ color: "inherit", fontWeight: "bold", wordBreak: "break-word" }}>
            {tab.label}
          </Typography>
        </Box>
      </Link>
    );
  })}
</Box>

      <br />
      {proctor && (
        <Box
          sx={{
            display: "flex",
            gap: 4,
            flexWrap: "wrap",

            mb: 2,
            fontSize: "16px",
          }}
        >
          <span><b>Proctor:</b> {proctor.proctor || "N/A"}</span>
          <span><b>Building:</b> {proctor.room_description || "N/A"}</span>
          <span><b>Room:</b> {proctor.room_no || "N/A"}</span>
          <span>
            <b>Schedule:</b> {proctor.day_description || ""} |{" "}
            {proctor.start_time
              ? new Date(`1970-01-01T${proctor.start_time}`).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
              : ""}{" "}
            -{" "}
            {proctor.end_time
              ? new Date(`1970-01-01T${proctor.end_time}`).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
              : ""}
          </span>
        </Box>
      )}

      {/* TableContainer */}
      {applicants.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "#6D2323" }}>
              <TableRow>
                <TableCell sx={{ color: "white", textAlign: "center", border: "2px solid maroon" }}>#</TableCell>
                <TableCell sx={{ color: "white", textAlign: "center", border: "2px solid maroon" }}>Applicant</TableCell>
                <TableCell sx={{ color: "white", textAlign: "center", border: "2px solid maroon" }}>Name</TableCell>
                <TableCell sx={{ color: "white", textAlign: "center", border: "2px solid maroon" }}>Program</TableCell>
                <TableCell sx={{ color: "white", textAlign: "center", border: "2px solid maroon" }}>Room</TableCell> {/* ✅ NEW */}
                <TableCell sx={{ color: "white", textAlign: "center", border: "2px solid maroon" }}>Email Sent</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {applicants.map((a, idx) => (
                <TableRow key={idx}>
                  <TableCell align="center" sx={{ border: "2px solid maroon" }}>{idx + 1}</TableCell>
                  <TableCell align="left" sx={{ border: "2px solid maroon" }}>{a.applicant_number}</TableCell>
                  <TableCell align="left" sx={{ border: "2px solid maroon" }}>
                    {`${a.last_name}, ${a.first_name} ${a.middle_name || ""}`}
                  </TableCell>
                  <TableCell align="left" sx={{ border: "2px solid maroon" }}>
                    {curriculumOptions.find(
                      (item) => item.curriculum_id?.toString() === a.program?.toString()
                    )?.program_code ?? "N/A"}
                  </TableCell>
                  <TableCell align="left" sx={{ border: "2px solid maroon" }}>
                    {a.room_no || proctor?.room_no || "N/A"} {/* ✅ NEW */}
                  </TableCell>
                  <TableCell align="left" sx={{ border: "2px solid maroon" }}>
                    {a.email_sent ? "✅ Sent" : "❌ Not Sent"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </TableContainer>

      )}
    </Box>
  );
};

export default ProctorApplicantList;
