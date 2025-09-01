import React, { useState, useEffect, } from "react";
import axios from "axios";
import { Button, Box, Container, Typography, Checkbox, Card, FormControl, Alert, Snackbar, FormControlLabel, FormHelperText } from "@mui/material";
import { Link } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import SchoolIcon from "@mui/icons-material/School";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import InfoIcon from "@mui/icons-material/Info";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import ErrorIcon from '@mui/icons-material/Error';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";


const Dashboard5 = () => {
    const navigate = useNavigate();
    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });
    const [person, setPerson] = useState({
        termsOfAgreement: "",
    });



    // do not alter
    useEffect(() => {
        const storedRole = localStorage.getItem("role");
        const adminPersonId = localStorage.getItem("admin_edit_person_id");

        if (storedRole !== "registrar") {
            window.location.href = "/login";
            return;
        }

        if (adminPersonId) {
            setUserID(adminPersonId);
            fetchPersonData(adminPersonId);
        }
    }, []);


    const [activeStep, setActiveStep] = useState(4);
    const [clickedSteps, setClickedSteps] = useState([]);

    const steps = [
        { label: "Personal Information", icon: <PersonIcon />, path: "/super_admin_dashboard1" },
        { label: "Family Background", icon: <FamilyRestroomIcon />, path: "/super_admin_dashboard2" },
        { label: "Educational Attainment", icon: <SchoolIcon />, path: "/super_admin_dashboard3" },
        { label: "Health Medical Records", icon: <HealthAndSafetyIcon />, path: "/super_admin_dashboard4" },
        { label: "Other Information", icon: <InfoIcon />, path: "/super_admin_dashboard5" },
    ];

    const handleStepClick = (index) => {
        setActiveStep(index);
        setClickedSteps((prev) => [...new Set([...prev, index])]);
        navigate(steps[index].path); // Go to the clicked step’s page
    };

    // Do not alter
    const fetchPersonData = async (id) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/person/${id}`);
            setPerson(res.data);
        } catch (error) { }
    };

    // Do not alter
    const handleUpdate = async () => {
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-GB'); // Format: DD/MM/YYYY

        const updatedPerson = {
            ...person,
            created_at: person.created_at || formattedDate // Only add if not already set
        };

        try {
            await axios.put(`http://localhost:5000/api/person/${userID}`, updatedPerson);
            console.log("Auto-saved with created_at:", updatedPerson.created_at);
        } catch (error) {
            console.error("Auto-save failed:", error);
        }
    };


    // Real-time save on every character typed
    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
        const updatedPerson = {
            ...person,
            [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
        };
        setPerson(updatedPerson);
        handleUpdate(updatedPerson); // No delay, real-time save
    };



    const handleBlur = async () => {
        try {
            await axios.put(`http://localhost:5000/api/person/${userID}`, person);
            console.log("Auto-saved");
        } catch (err) {
            console.error("Auto-save failed", err);
        }
    };

    const [errors, setErrors] = useState({});



    const handleClose = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnack(prev => ({ ...prev, open: false }));
    };


    const links = [
        { to: "/ecat_application_form", label: "ECAT Application Form" },
        { to: "/admission_form_process", label: "Admission Form Process" },
        { to: "/personal_data_form", label: "Personal Data Form" },
        { to: "/office_of_the_registrar", label: "Application For EARIST College Admission" },
        { to: "/admission_services", label: "Application/Student Satisfactory Survey" },
        { to: "/admission_services", label: "Examination Permit" },
    ];

    // 🔒 Disable right-click
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // 🔒 Block DevTools shortcuts silently
    document.addEventListener('keydown', (e) => {
        const isBlockedKey =
            e.key === 'F12' ||
            e.key === 'F11' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'U');

        if (isBlockedKey) {
            e.preventDefault();
            e.stopPropagation();
        }
    });


    // dot not alter
    return (
        <Box sx={{ height: 'calc(100vh - 140px)', overflowY: 'auto', paddingRight: 1, backgroundColor: 'transparent' }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    mt: 2,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        borderRadius: "10px",
                        backgroundColor: "#fffaf5",
                        border: "1px solid #6D2323",
                        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
                        whiteSpace: "nowrap", // Prevent text wrapping
                    }}
                >
                    {/* Icon */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#6D2323",
                            borderRadius: "8px",
                            width: 40,
                            height: 40,
                            flexShrink: 0,
                        }}
                    >
                        <ErrorIcon sx={{ color: "white", fontSize: 28 }} />
                    </Box>

                    {/* Text in one row */}
                    <Typography
                        sx={{
                            fontSize: "15px",
                            fontFamily: "Arial",
                            color: "#3e3e3e",
                        }}
                    >
                        <strong style={{ color: "maroon" }}>Notice:</strong> &nbsp;
                        <strong>1.</strong> Kindly type <strong>'NA'</strong> in boxes where there are no possible answers to the information being requested. &nbsp; | &nbsp;
                        <strong>2.</strong> To use the letter <strong>'Ñ'</strong>, press <kbd>ALT</kbd> + <kbd>165</kbd>; for <strong>'ñ'</strong>, press <kbd>ALT</kbd> + <kbd>164</kbd>. &nbsp; | &nbsp;
                        <strong>3.</strong> This is the list of all printable files.
                    </Typography>
                </Box>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    mt: 2,
                    pb: 1,

                    justifyContent: "center", // Centers all cards horizontally
                }}
            >
                {links.map((lnk, i) => (
                    <motion.div
                        key={i}
                        style={{ flex: "0 0 calc(30% - 16px)" }} // fixed width for consistent centering
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.4 }}
                    >
                        <Card
                            sx={{
                                minHeight: 60,
                                borderRadius: 2,

                                border: "2px solid #6D2323",
                                backgroundColor: "#fff",
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center", // Centers content inside each card
                                textAlign: "center",
                                p: 1.5,
                                "&:hover": {
                                    transform: "scale(1.05)",
                                    transition: "0.3s ease-in-out",
                                },
                            }}
                        >
                            <PictureAsPdfIcon sx={{ fontSize: 35, color: "#6D2323", mr: 1.5 }} />
                            <Link
                                to={lnk.to}
                                style={{
                                    textDecoration: "none",
                                    color: "#6D2323",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    fontSize: "0.85rem",
                                }}
                            >
                                {lnk.label}
                            </Link>
                        </Card>
                    </motion.div>
                ))}
            </Box>

            <Container maxWidth="lg">


                <Container>
                    <h1 style={{ fontSize: "50px", fontWeight: "bold", textAlign: "center", color: "maroon", marginTop: "25px" }}>
                        APPLICANT FORM
                    </h1>
                    <div style={{ textAlign: "center" }}>
                        Complete the applicant form to secure your place for the upcoming academic year at EARIST.
                    </div>
                </Container>
                <br />
                <Box sx={{ display: "flex", justifyContent: "center", width: "100%", px: 4 }}>
                    {steps.map((step, index) => (
                        <React.Fragment key={index}>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    cursor: "pointer",
                                }}
                                onClick={() => handleStepClick(index)}
                            >
                                <Box
                                    sx={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: "50%",
                                        backgroundColor: activeStep === index ? "#6D2323" : "#E8C999",
                                        color: activeStep === index ? "#fff" : "#000",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {step.icon}
                                </Box>
                                <Typography
                                    sx={{
                                        mt: 1,
                                        color: activeStep === index ? "#6D2323" : "#000",
                                        fontWeight: activeStep === index ? "bold" : "normal",
                                        fontSize: 14,
                                    }}
                                >
                                    {step.label}
                                </Typography>
                            </Box>
                            {index < steps.length - 1 && (
                                <Box
                                    sx={{
                                        height: "2px",
                                        backgroundColor: "#6D2323",
                                        flex: 1,
                                        alignSelf: "center",
                                        mx: 2,
                                    }}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </Box>



                <br />
                <form>
                    <Container maxWidth="100%" sx={{ backgroundColor: "#6D2323", border: "2px solid black", color: "white", borderRadius: 2, boxShadow: 3, padding: "4px" }}>
                        <Box sx={{ width: "100%" }}>
                            <Typography style={{ fontSize: "20px", padding: "10px", fontFamily: "Arial Black" }}>Step 5: Other Information</Typography>
                        </Box>
                    </Container>
                    <Container maxWidth="100%" sx={{ backgroundColor: "#f1f1f1", border: "2px solid black", padding: 4, borderRadius: 2, boxShadow: 3 }}>
                        <Typography style={{ fontSize: "20px", color: "#6D2323", fontWeight: "bold" }}>
                            Other Information:
                        </Typography>
                        <hr style={{ border: "1px solid #ccc", width: "100%" }} />
                        <Typography style={{ fontWeight: "bold", textAlign: "Center" }}>
                            Data Subject Consent Form
                        </Typography>
                        < br />
                        <Typography style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "Left" }}>
                            In accordance with RA 10173 or Data Privacy Act of 2012, I give my consent to the following terms and conditions on the collection, use, processing, and disclosure of my personal data:
                        </Typography>
                        < br />
                        <Typography style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "Left" }}>
                            1. I am aware that the Eulogio "Amang" Rodriguez Institute of Science and Technology (EARIST) has collected and stored my personal data during my admission/enrollment at EARIST. This data includes my demographic profile, contact details like home address, email address, landline numbers, and mobile numbers.
                        </Typography>
                        <Typography style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "Left" }}>
                            2. I agree to personally update these data through personal request from the Office of the registrar.
                        </Typography>
                        <Typography style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "Left" }}>
                            3. In consonance with the above stated Act, I am aware that the University will protect my school records related to my being a student/graduated of EARIST. However, I have the right to authorize a representative to claim the same subject to the policy of the University.
                        </Typography>

                        <Typography style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "Left" }}>
                            4. In order to promote efficient management of the organization’s records, I authorize the University to manage my data for data sharing with industry partners, government agencies/embassies, other educational institutions, and other offices for the university for employment, statistics, immigration, transfer credentials, and other legal purposes that may serve me best.
                        </Typography>
                        < br />
                        <Typography style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "Left" }}>
                            By clicking the submit button, I warrant that I have read, understood all of the above provisions, and agreed to its full implementation.
                        </Typography>
                        <br />
                        <hr style={{ border: "1px solid #ccc", width: "100%" }} />
                        < br />
                        <Typography style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "Left" }}>
                            I certify that the information given above are true, complete, and accurate to the best of my knowledge and belief. I promise to abide by the rules and regulations of Eulogio "Amang" Rodriguez Institute of Science and Technology regarding the ECAT and my possible admission. I am aware that any false or misleading information and/or statement may result in the refusal or disqualification of my admission to the institution.
                        </Typography>

                        <FormControl required error={!!errors.termsOfAgreement} component="fieldset" sx={{ mb: 2 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="termsOfAgreement"
                                        checked={person.termsOfAgreement === 1}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                }
                                label="I agree Terms of Agreement"
                            />
                            {errors.termsOfAgreement && (
                                <FormHelperText>This field is required.</FormHelperText>
                            )}
                        </FormControl>



                        <Box display="flex" justifyContent="space-between" mt={4}>
                            {/* Previous Page Button */}
                            <Button
                                variant="contained"
                                component={Link}
                                to="/super_admin_dashboard4"
                                startIcon={
                                    <ArrowBackIcon
                                        sx={{
                                            color: '#000',
                                            transition: 'color 0.3s',
                                        }}
                                    />
                                }
                                sx={{
                                    backgroundColor: '#E8C999',
                                    color: '#000',
                                    '&:hover': {
                                        backgroundColor: '#6D2323',
                                        color: '#fff',
                                        '& .MuiSvgIcon-root': {
                                            color: '#fff',
                                        },
                                    },
                                }}
                            >
                                Previous Step
                            </Button>
                            {/* Next Step (Submit) Button */}
                            <Button
                                variant="contained"
                                onClick={async () => {
                                    handleUpdate(); // Save data

                                    try {
                                        await axios.post("http://localhost:5000/api/notify-submission", {
                                            person_id: userID,
                                        });

                                        setSnack({
                                            open: true,
                                            message:
                                                "Your account has been successfully registered! Wait for further announcement. Please upload your documents.",
                                            severity: "success",
                                        });

                                        setTimeout(() => {
                                            navigate("/requirements_uploader");
                                        }, 2000);
                                    } catch (error) {
                                        console.error("Notification failed:", error);
                                    }
                                }}
                                endIcon={
                                    <FolderIcon
                                        sx={{
                                            color: "#fff",
                                            transition: "color 0.3s",
                                        }}
                                    />
                                }
                                sx={{
                                    backgroundColor: "#6D2323",
                                    color: "#fff",
                                    "&:hover": {
                                        backgroundColor: "#E8C999",
                                        color: "#000",
                                        "& .MuiSvgIcon-root": {
                                            color: "#000",
                                        },
                                    },
                                }}
                            >
                                Submit (Save Information)
                            </Button>


                        </Box>
                        <Snackbar
                            open={snack.open}
                            autoHideDuration={5000}
                            onClose={handleClose}
                            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                        >
                            <Alert severity={snack.severity} onClose={handleClose} sx={{ width: '100%' }}>
                                {snack.message}
                            </Alert>
                        </Snackbar>


                    </Container>

                </form>

            </Container>


        </Box>

    );
};


export default Dashboard5;
