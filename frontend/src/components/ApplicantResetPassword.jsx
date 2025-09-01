import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';

const passwordRules = [
  { label: 'Minimum of 8 characters', test: pw => pw.length >= 8 },
  { label: 'At least one lowercase letter (e.g. abc)', test: pw => /[a-z]/.test(pw) },
  { label: 'At least one uppercase letter (e.g. ABC)', test: pw => /[A-Z]/.test(pw) },
  { label: 'At least one number (e.g. 123)', test: pw => /\d/.test(pw) },
  { label: 'At least one special character (! # $ ^ * @)', test: pw => /[!#$^*@]/.test(pw) },
];

const ApplicantResetPassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validations, setValidations] = useState([]);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [message, setMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarType, setSnackbarType] = useState('success');
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");

  // do not alter
  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");

    if (storedUser && storedRole && storedID) {
      setUser(storedUser);
      setUserRole(storedRole);
      setUserID(storedID);

      if (storedRole === "applicant") {

      } else {
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    const results = passwordRules.map(rule => rule.test(newPassword));
    setValidations(results);
  }, [newPassword]);

  const isValid = validations.every(Boolean) && newPassword === confirmPassword;

  const handleUpdate = async () => {
    try {
      const person_id = localStorage.getItem('person_id');
      const response = await axios.post('http://localhost:5000/applicant-change-password', {
        person_id,
        currentPassword,
        newPassword,
      });

      setSnackbarType('success');
      setMessage(response.data.message);
      setOpenSnackbar(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSnackbarType('error');
      setMessage(err.response?.data?.message || 'Error updating password.');
      setOpenSnackbar(true);
    }
  };

  const toggleShowPassword = field => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

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

  return (
    <Box
      sx={{
        height: '100vh',

        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'auto',
      }}
    >
      <Container maxWidth="sm" sx={{ height: '90%', overflowY: 'auto', marginTop: "-40px" }}>
        <Box
          sx={{
            borderRadius: 4,
            boxShadow: 3,
            p: 3,
            mt: 1,
            border: "3px solid maroon",
            backgroundColor: '#fff',
          }}
        >
          <Typography variant="h5" fontWeight="bold" color="maroon" textAlign="center" gutterBottom>
            Reset your password
          </Typography>
          <Typography fontSize={12} mt={-1} color="black" textAlign="center" gutterBottom>
            Enter a new password for your account
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* Current Password */}
          <label className="w-40 font-medium">Current Password:</label>
          <TextField
            label="Current Password"
            type={showPassword.current ? 'text' : 'password'}
            fullWidth
            margin="dense"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => toggleShowPassword('current')} edge="end">
                    {showPassword.current ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* New Password */}
          <label className="w-40 font-medium">New Password:</label>
          <TextField
            label="New Password"
            type={showPassword.new ? 'text' : 'password'}
            fullWidth
            margin="dense"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => toggleShowPassword('new')} edge="end">
                    {showPassword.new ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Confirm Password */}
          <label className="w-40 font-medium">Confirm Password:</label>
          <TextField
            label="Confirm New Password"
            type={showPassword.confirm ? 'text' : 'password'}
            fullWidth
            margin="dense"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            error={confirmPassword && confirmPassword !== newPassword}
            helperText={confirmPassword && confirmPassword !== newPassword ? 'Passwords do not match' : ''}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => toggleShowPassword('confirm')} edge="end">
                    {showPassword.confirm ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Typography variant="subtitle2" mt={2} gutterBottom>
            Your new password must include:
          </Typography>

          <List dense disablePadding sx={{ mb: 1 }}>
            {passwordRules.map((rule, i) => (
              <ListItem key={i}>
                <ListItemIcon>
                  {validations[i] ? (
                    <CheckCircle sx={{ color: 'green' }} />
                  ) : (
                    <Cancel sx={{ color: 'red' }} />
                  )}
                </ListItemIcon>
                <ListItemText primary={rule.label} />
              </ListItem>
            ))}
          </List>

          <Typography variant="body2" color="warning.main" mt={1}>
            Note: You are required to change your password to continue using the system securely.
          </Typography>

          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, py: 1 }}
            disabled={!isValid}
            onClick={handleUpdate}
          >
            Update Password
          </Button>
        </Box>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          onClose={() => setOpenSnackbar(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setOpenSnackbar(false)}
            severity={snackbarType}
            sx={{ width: '100%' }}
          >
            {message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );

};

export default ApplicantResetPassword;
