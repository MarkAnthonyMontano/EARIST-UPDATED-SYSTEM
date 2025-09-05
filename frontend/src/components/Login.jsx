import React, { useState } from "react";
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
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
import '../styles/Container.css';
import Logo from '../assets/Logo.png';
import SchoolImage from '../assets/image.png';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  const handleLogin = async () => {
    if (!email || !password) {
      setSnack({ open: true, message: "Please fill in all fields", severity: "warning" });
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/login_applicant", { email, password }, {
        headers: { "Content-Type": "application/json" }
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("email", response.data.email);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("person_id", response.data.person_id);

      setIsAuthenticated(true);
      setSnack({ open: true, message: "Login Successfully", severity: "success" });

      navigate("/applicant_dashboard");
    } catch (error) {
      setSnack({
        open: true,
        message: error.response?.data?.message || "Invalid credentials",
        severity: "error"
      });
    }
  };

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnack(prev => ({ ...prev, open: false }));
  };

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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleLogin(); // ✅ Trigger login on Enter
                    }
                  }}
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

              <div className="TextField" style={{ position: 'relative' }}>
                <label htmlFor="password">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleLogin(); 
                    }
                  }}
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

              <div className="Button" onClick={handleLogin}>
                <span>Log In</span>
              </div>

              <div className="LinkContainer">
                <span><Link to="/applicant_forgot_password">Forgot your password</Link></span>
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
      </Box>
    </>
  );
};

export default Login;
