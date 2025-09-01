import React, { useState } from "react";
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Container.css';
import Logo from '../assets/Logo.png';
import {
  Container,
  Checkbox,
  Box,
  Snackbar,
  Alert
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from "@mui/icons-material";
import SchoolImage from '../assets/image.png';
import ReCAPTCHA from "react-google-recaptcha";

const Register = () => {
  const [capVal, setCapVal] = useState(null);
  const [usersData, setUserData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  const handleReset = () => {
    if (!email) {
      setSnack({ open: true, message: "Please enter your email.", severity: "warning" });
      return;
    }

    if (!capVal) {
      setSnack({ open: true, message: "Please verify you're not a robot.", severity: "warning" });
      return;
    }

    socket.emit("forgot-password-applicant", email);
  };


  const handleChanges = (e) => {
    const { name, value } = e.target;
    setUserData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnack(prev => ({ ...prev, open: false }));
  };

  const handleRegister = async () => {
    try {
      const response = await axios.post("http://localhost:5000/register", usersData);
      setUserData({ email: '', password: '' });

      localStorage.setItem('person_id', response.data.person_id);

      setSnack({ open: true, message: "Registration Successful", severity: "success" });
      setTimeout(() => navigate('/'), 1500); // Redirect after a short delay
    } catch (error) {
      console.error("Registration failed:", error);
      setSnack({
        open: true,
        message: error.response?.data?.message || "Registration failed",
        severity: "error"
      });
    }
  };

    const isButtonDisabled = !email || !capVal;


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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
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
                  className="border"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={usersData.email}
                  onChange={handleChanges}
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
                  className="border"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={usersData.password}
                  onChange={handleChanges}
                  required
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

              {/* CAPTCHA */}
            <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <ReCAPTCHA
                sitekey="6Lfem44rAAAAAEeAexdQxvN0Lpm1V4KPu1bBxaGy"
                onChange={(val) => setCapVal(val)}
              />
            </Box>

              <div className="Button" onClick={handleRegister}>
                <span>Register</span>
              </div>

             

              <div className="LinkContainer RegistrationLink" style={{ margin: '0.1rem 0rem' }}>
                <p>Already Have an Account?</p>
                <span><Link to={'/login'}>Sign In here</Link></span>
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
      </Box>
    </>
  );
};

export default Register;
