import React, { useState, useEffect } from "react";
import "../styles/TempStyles.css";
import axios from "axios";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Avatar,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import EventIcon from "@mui/icons-material/Event";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

const ApplicantDashboard = () => {
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [applicantID, setApplicantID] = useState("");
  const [person, setPerson] = useState({
    last_name: "",
    first_name: "",
    middle_name: "",
    extension: "",
    profile_image: "",
  });
  const [proctor, setProctor] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");

    if (storedUser && storedRole && storedID) {
      setUser(storedUser);
      setUserRole(storedRole);
      setUserID(storedID);

      if (storedRole === "applicant") {
        fetchPersonData(storedID);
        fetchApplicantNumber(storedID);
      } else {
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  const fetchProctorSchedule = async (id) => {
    if (!id) return; // 🔒 safeguard
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/applicant-schedule/${id}`
      );
      console.log("✅ Schedule fetched:", data);
      setProctor(data);
    } catch (err) {
      console.error("Error fetching schedule:", err);
      setProctor(null);
    }
  };

  const [requirementsCompleted, setRequirementsCompleted] = useState(
    localStorage.getItem("requirementsCompleted") === "1"
  );

  useEffect(() => {
    const checkRequirements = () => {
      setRequirementsCompleted(localStorage.getItem("requirementsCompleted") === "1");
    };

    // Run on mount
    checkRequirements();

    // Optional: Listen for storage changes across tabs/components
    window.addEventListener("storage", checkRequirements);

    return () => window.removeEventListener("storage", checkRequirements);
  }, []);

  const [allRequirementsCompleted, setAllRequirementsCompleted] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("person_id");
    if (id) {
      checkRequirements(id);
    }
  }, []);

  const checkRequirements = async (personId) => {
    try {
      const res = await axios.get("http://localhost:5000/uploads", {
        headers: { "x-person-id": personId },
      });

      const uploadsData = res.data;
      const rebuiltSelectedFiles = {};

      uploadsData.forEach((upload) => {
        const desc = upload.description.toLowerCase();
        if (desc.includes("form 138")) rebuiltSelectedFiles["Form138"] = true;
        if (desc.includes("good moral")) rebuiltSelectedFiles["GoodMoralCharacter"] = true;
        if (desc.includes("birth certificate")) rebuiltSelectedFiles["BirthCertificate"] = true;
        if (desc.includes("graduating class")) rebuiltSelectedFiles["CertificateOfGraduatingClass"] = true;
        if (desc.includes("vaccine card")) rebuiltSelectedFiles["VaccineCard"] = true;
      });

      const allRequired = ["Form138", "GoodMoralCharacter", "BirthCertificate", "CertificateOfGraduatingClass", "VaccineCard"]
        .every((key) => rebuiltSelectedFiles[key]);

      setAllRequirementsCompleted(allRequired);
      localStorage.setItem("requirementsCompleted", allRequired ? "1" : "0");
    } catch (err) {
      console.error("Failed to check requirements:", err);
    }
  };




  const fetchApplicantNumber = async (personID) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/applicant_number/${personID}`
      );
      if (res.data && res.data.applicant_number) {
        setApplicantID(res.data.applicant_number);

        // fetch schedule once applicant number is known
        fetchProctorSchedule(res.data.applicant_number);
      }
    } catch (error) {
      console.error("Failed to fetch applicant number:", error);
    }
  };

  const fetchPersonData = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/person_with_applicant/${id}`);
      setPerson(res.data); // includes document_status + applicant_number
      if (res.data.applicant_number) {
        setApplicantID(res.data.applicant_number);
        fetchProctorSchedule(res.data.applicant_number);
      }
    } catch (error) {
      console.error("Failed to fetch person_with_applicant:", error);
    }
  };


  // Format start and end time
  const formatTime = (time) =>
    time
      ? new Date(`1970-01-01T${time}`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      : "";

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Box
      sx={{
        p: 4,
        marginLeft: "-2rem",
        paddingRight: 8,
        height: "calc(100vh - 150px)",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Applicant Dashboard
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ marginBottom: "1rem" }}
        gutterBottom
      >
        Date: {formattedDate}
      </Typography>

      <Grid container spacing={3}>
        {/* Applicant Information */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              marginLeft: "10px",
              p: 2,
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                {!person?.profile_image ? (
                  <PersonIcon sx={{ color: "maroon" }} fontSize="large" />
                ) : (
                  <Avatar
                    src={`http://localhost:5000/uploads/${person.profile_image}`}
                    sx={{ width: 50, height: 50 }}
                  />
                )}
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {person.last_name?.toUpperCase()}, {person.first_name}{" "}
                    {person.middle_name} {person.extension}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Applicant ID: {applicantID || "N/A"}
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Application Status
              </Typography>
              <Typography style={{color: "maroon", fontWeight: "bold"}} >
                {allRequirementsCompleted
                  ? "Your application is registered."
                  : "Please complete all required documents to register your application."}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
  <Card
    sx={{
      borderRadius: 3,
      marginLeft: "10px",
      boxShadow: 3,
      p: 2,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <CardContent sx={{ textAlign: "center" }}>
      <Typography variant="h6" gutterBottom>
        Application Form
      </Typography>
      <button
        style={{
          padding: "10px 20px",
          backgroundColor: "maroon",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginTop: "10px",
        }}
        onClick={() => {
          // 🔑 generate random keys if not already set
          if (!localStorage.getItem("dashboardKeys")) {
            const generateKey = () =>
              Math.random().toString(36).substring(2, 10);

            const dashboardKeys = {
              step1: generateKey(),
              step2: generateKey(),
              step3: generateKey(),
              step4: generateKey(),
              step5: generateKey(),
            };

            localStorage.setItem(
              "dashboardKeys",
              JSON.stringify(dashboardKeys)
            );
          }

          const keys = JSON.parse(localStorage.getItem("dashboardKeys"));
          window.location.href = `/dashboard/${keys.step1}`;
        }}
      >
        Start Application
      </button>
    </CardContent>
  </Card>
</Grid>



        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              minHeight: 220,
              marginLeft: "10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <DescriptionIcon sx={{ color: "maroon" }} fontSize="large" />
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                Document Submitted
              </Typography>

              {person?.document_status === "Documents Verified & ECAT" ? (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", color: "green" }}
                >
                  ✅ Your documents have been verified. <br />
                  ECAT Examination Permit has been issued.
                </Typography>
              ) : (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", color: "gray" }}
                >
                  Status: Pending
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>


        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              minHeight: 220,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <AssignmentTurnedInIcon sx={{ color: "maroon" }} fontSize="large" />
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                Admission / Entrance Exam
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Check schedule and results of your exam.
              </Typography>

              {!proctor?.email_sent && (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", color: "gray" }}
                >
                  Status: Pending
                </Typography>
              )}

              {proctor?.email_sent === 1 && (
                <>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    👨‍🏫 Proctor: {proctor?.proctor || "TBA"}
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    📅 Date: {proctor?.day_description || "TBA"}
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    🏫 Building: {proctor?.room_description || "TBA"}
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    🏷️ Room No: {proctor?.room_no || "TBA"}
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    ⏰ Time: {formatTime(proctor?.start_time)} – {formatTime(proctor?.end_time)}
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    Take note: Proceed to the Examination Day Schedule. Failure to attend the examination schedule shall result in forfeiture of the application.
                  </Typography>

                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              minHeight: 220,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <EventIcon sx={{ color: "maroon" }} fontSize="large" />
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                Interview Schedule / Qualifying Exam 
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: "bold", color: "gray" }}>
                Status: Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>


        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              minHeight: 220,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <CheckCircleIcon sx={{ color: "maroon" }} fontSize="large" />
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                College Approval
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: "bold", color: "gray" }}>
                Status: Application is on process
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              minHeight: 220,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <LocalHospitalIcon sx={{ color: "maroon" }} fontSize="large" />
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                Medical Submitted
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: "bold", color: "gray" }}>
                Status: Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              minHeight: 220,
              marginLeft: "10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <PersonIcon sx={{ color: "maroon" }} fontSize="large" />
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                Applicant Status
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: "bold", color: "gray" }}>
                Status: Application is on process
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Announcement */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              marginLeft: "10px",
              boxShadow: 3,
              p: 2,
              minHeight: 220, // 🔹 make them consistent height
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)", // 🔹 zoom effect
                boxShadow: 6,
              },
            }}
          >
            <CardContent>
              <Typography sx={{ textAlign: "center" }} variant="h6" gutterBottom>
                Announcement
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Stay tuned for updates on admission results, schedules, and
                other important notices.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApplicantDashboard;
