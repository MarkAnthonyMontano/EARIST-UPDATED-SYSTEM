import React, { useState } from "react";
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Modal, TextField } from "@mui/material";
import {
  Container,
  Checkbox,
  Box,
  Typography,
  Button,
  Snackbar,
  Alert
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from "@mui/icons-material";
import '../styles/Container.css';
import Logo from '../assets/Logo.png';
import SchoolImage from '../assets/image.png';
import { useRef, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";

const LoginEnrollment = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });
  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [tempLoginData, setTempLoginData] = useState(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lockout, setLockout] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);


  const navigate = useNavigate();
  // ---------------- HANDLE LOGIN ----------------
  const handleLogin = async () => {
    if (isLoggingIn || lockoutTimer > 0) return; // prevent spam clicks
    setIsLoggingIn(true);

    if (!email || !password) {
      setSnack({ open: true, message: "Please fill in all fields", severity: "warning" });
      setIsLoggingIn(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/login", { email, password });
      setTempLoginData(res.data);

      // ✅ Show OTP modal if login succeeds
      setShowOtpModal(true);
      startResendTimer();
      setSnack({ open: true, message: "OTP sent to your email", severity: "success" });

    } catch (error) {
      const msg = error.response?.data?.message || "Login failed";
      const remaining = error.response?.data?.remaining;

      // Case 1: Wrong password but still has attempts left
      if (error.response?.status === 400 && remaining !== undefined) {
        setSnack({
          open: true,
          message: msg, // backend already sends "Invalid password. You have X attempt(s) remaining."
          severity: "warning",
        });
      }

      // Case 2: Locked out after 3 attempts
      else if (error.response?.status === 429) {
        setSnack({
          open: true,
          message: msg, // backend sends "Too many failed attempts. Locked for 3 minutes."
          severity: "error",
        });

        // Extract lock time from message (default 180s)
        const seconds = parseInt(msg.match(/\d+/)?.[0] || 180, 10);
        setLockout(true);
        setLockoutTimer(seconds);

        // countdown timer
        const interval = setInterval(() => {
          setLockoutTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setLockout(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      // Case 3: Other errors
      else {
        setSnack({
          open: true,
          message: msg,
          severity: "error",
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ---------------- VERIFY OTP ----------------
  const verifyOtp = async () => {
    try {
      const res = await axios.post("http://localhost:5000/verify-otp", {
        email: tempLoginData.email,
        otp,
      });

      // ✅ Only after OTP success, reset attempts automatically (backend clears them)
      localStorage.setItem("token", tempLoginData.token);
      localStorage.setItem("email", tempLoginData.email);
      localStorage.setItem("role", tempLoginData.role);
      localStorage.setItem("person_id", tempLoginData.person_id);

      setIsAuthenticated(true);
      setShowOtpModal(false);

      navigate(
        tempLoginData.role === "registrar" ? "/dashboard"
          : tempLoginData.role === "faculty" ? "/faculty_dashboard"
            : "/student_dashboard"
      );
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || "Invalid OTP", severity: "error" });
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resendOtp = async () => {
    try {
      await axios.post("http://localhost:5000/request-otp", { email: tempLoginData.email });
      setSnack({ open: true, message: "OTP resent to your email", severity: "success" });
      startResendTimer();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || "Failed to resend OTP", severity: "error" });
    }
  };


  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnack(prev => ({ ...prev, open: false }));
  };

  const otpInputRef = useRef(null);

  useEffect(() => {
    if (showOtpModal) {
      requestAnimationFrame(() => {
        otpInputRef.current?.focus();
      });
    }
  }, [showOtpModal]);



  return (
    <>
      <Box
        sx={{
          backgroundImage: `url(${SchoolImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          maxWidth={false}
        >
          <div style={{ border: "5px solid white" }} className="Container">
            <div className="Header">
              <div className="HeaderTitle">
                <div className="CircleCon">
                  <img src={Logo} alt="" />
                </div>
              </div>
              <div className="HeaderBody">
                <strong>EARIST</strong>
                <p>Information System</p>
              </div>
            </div>

            <div className="Body">
              <div className="TextField" style={{ position: "relative" }}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  className="border"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: "2.5rem" }}
                />
                <EmailIcon
                  style={{
                    position: "absolute",
                    top: "2.5rem",
                    left: "0.7rem",
                    color: "rgba(0,0,0,0.4)"
                  }}
                />
              </div>

              <div className="TextField" style={{ position: "relative" }}>
                <label htmlFor="password">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border"
                  style={{ paddingLeft: "2.5rem" }}
                />
                <LockIcon
                  style={{
                    position: "absolute",
                    top: "2.5rem",
                    left: "0.7rem",
                    color: "rgba(0,0,0,0.4)"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    color: "rgba(0,0,0,0.3)",
                    outline: "none",
                    position: "absolute",
                    top: "2.5rem",
                    right: "1rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </button>
              </div>

              <div className="Checkbox">
                <Checkbox id="checkbox" sx={{ color: '#A31D1D', '&.Mui-checked': { color: '#A31D1D' } }} />
                <label htmlFor="checkbox">Remember Me</label>
              </div>

              <div className="Button" onClick={!lockout ? handleLogin : null}>
                <span>{lockout ? `Locked (${lockoutTimer}s)` : "Log In"}</span>
              </div>


              <div className="LinkContainer">
                <span><Link to="/registrar_forgot_password">Forgot your password</Link></span>
              </div>

              <div className="LinkContainer RegistrationLink" style={{ margin: '0.1rem 0rem' }}>
                <p>Doesn't Have an Account?</p>
                <span><Link to={'/register'}>Register Here</Link></span>
              </div>
            </div>

            <div className="Footer">
              <div className="FooterText">
                &copy; 2025 EARIST Information System. All rights reserved.
              </div>
            </div>
          </div>
        </Container>

        {/* Snackbar Notification */}
        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity={snack.severity} onClose={handleClose} sx={{ width: '100%' }}>
            {snack.message}
          </Alert>
        </Snackbar>
        <Modal open={showOtpModal} onClose={() => setShowOtpModal(false)}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "#fff",
              border: "3px solid black",
              p: 4,
              borderRadius: "12px",
              width: 350,
              boxShadow: 24,
              textAlign: "center",
              position: "relative" // Needed for X button positioning
            }}
          >
            {/* ❌ Close button */}
            <button
              onClick={() => setShowOtpModal(false)}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                backgroundColor: "#6D2323", // maroon
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "18px"
              }}
            >
              <CloseIcon fontSize="small" />
            </button>

            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: "bold",
                fontSize: "20px",
                color: "#6D2323",
              }}
            >
              Enter the 6-digit OTP
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mb: 3,
                color: "#666",
              }}
            >
              We sent a verification code to your Gmail address.
            </Typography>

            {/* OTP Input */}
            <TextField
              fullWidth
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              inputRef={otpInputRef}
              inputProps={{
                maxLength: 6,
                style: { textAlign: "center", fontSize: "18px" },
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  verifyOtp(); // ✅ Trigger OTP verification on Enter key
                }
              }}
              sx={{ mb: 3 }}
            />


            <Button
              variant="contained"
              onClick={verifyOtp}
              sx={{
                width: "100%",
                backgroundColor: "#6D2323",
                "&:hover": {
                  backgroundColor: "#6D2323",
                },
                textTransform: "none",
                fontWeight: "bold",
                fontSize: "16px",
                py: 1,
              }}
            >
              Verify OTP
            </Button>

            <Button
              variant="outlined"
              onClick={resendOtp}
              disabled={resendTimer > 0}
              sx={{ mt: 2, width: "100%", textTransform: "none" }}
            >
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
            </Button>
          </Box>
        </Modal>

      </Box>
    </>
  );
};

export default LoginEnrollment;
