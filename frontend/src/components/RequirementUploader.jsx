import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  Container,
  TableHead,
  TableRow,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import ErrorIcon from "@mui/icons-material/Error";

const requiredDocs = [
  { label: 'PSA Birth Certificate', key: 'BirthCertificate' },
  { label: 'Form 138 (4th Quarter / No failing Grades)', key: 'Form138' },
  { label: 'Certificate of Good Moral Character', key: 'GoodMoralCharacter' },
  { label: 'Certificate Belonging to Graduating Class', key: 'CertificateOfGraduatingClass' }
];

const vaccineDoc = { label: 'Copy of Vaccine Card (1st and 2nd Dose)', key: 'VaccineCard' };

const RequirementUploader = () => {
  const [uploads, setUploads] = useState([]);
  const [userID, setUserID] = useState('');
  const [selectedFiles, setSelectedFiles] = useState({});
  const [allRequirementsCompleted, setAllRequirementsCompleted] = useState(
    localStorage.getItem("requirementsCompleted") === "1"
  );
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const id = localStorage.getItem('person_id');
    if (id) {
      setUserID(id);
      fetchUploads(id);
    }
  }, []);

  const fetchUploads = async (personId) => {
    try {
      const res = await axios.get('http://localhost:5000/uploads', {
        headers: { 'x-person-id': personId }
      });

      const uploadsData = res.data;
      setUploads(uploadsData);

      const rebuiltSelectedFiles = {};
      uploadsData.forEach((upload) => {
        const description = upload.description.toLowerCase();
        const filename = upload.original_name;

        if (description.includes('form 138')) rebuiltSelectedFiles['Form138'] = filename;
        if (description.includes('good moral')) rebuiltSelectedFiles['GoodMoralCharacter'] = filename;
        if (description.includes('birth certificate')) rebuiltSelectedFiles['BirthCertificate'] = filename;
        if (description.includes('graduating class')) rebuiltSelectedFiles['CertificateOfGraduatingClass'] = filename;
        if (description.includes('vaccine card')) rebuiltSelectedFiles['VaccineCard'] = filename;
      });

      setSelectedFiles(rebuiltSelectedFiles);

      const allRequired = [...requiredDocs, vaccineDoc].every(
        (doc) => rebuiltSelectedFiles[doc.key]
      );

      // ✅ Only show snackbar when going from incomplete → complete
      if (!allRequirementsCompleted && allRequired) {
        setSnack({
          open: true,
          message:
            "🎉 Congratulations! You have successfully confirmed your slot at Eulogio Amang Rodriguez Institute of Science and Technology.",
          severity: "success",
        });
      }

      setAllRequirementsCompleted(allRequired);
      localStorage.setItem("requirementsCompleted", allRequired ? "1" : "0");
    } catch (err) {
      console.error("Fetch uploads failed:", err);
    }
  };



  const handleUpload = async (key, file) => {
    if (!file) return;

    setSelectedFiles((prev) => ({ ...prev, [key]: file.name }));

    const requirementId = await getRequirementIdByKey(key);
    if (!requirementId) return alert('Requirement not found.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('requirements_id', requirementId);
    formData.append('person_id', userID);

    try {
      await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      fetchUploads(userID);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload. Please try again.');
    }
  };

  const getRequirementIdByKey = async (key) => {
    const res = await axios.get('http://localhost:5000/requirements');
    const match = res.data.find((r) => {
      const lower = r.description.toLowerCase();
      if (key === 'Form138') return lower.includes('form 138');
      if (key === 'GoodMoralCharacter') return lower.includes('good moral');
      if (key === 'BirthCertificate') return lower.includes('birth certificate');
      if (key === 'CertificateOfGraduatingClass') return lower.includes('graduating class');
      if (key === 'VaccineCard') return lower.includes('vaccine card');
      return false;
    });
    return match?.id || null;
  };

  const handleDelete = async (uploadId) => {
    try {
      await axios.delete(`http://localhost:5000/uploads/${uploadId}`, {
        headers: { 'x-person-id': userID }
      });

      fetchUploads(userID);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete. Please try again.');
    }
  };

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack(prev => ({ ...prev, open: false }));
  };

  const renderRow = (doc) => {
    const uploaded = uploads.find((u) =>
      u.description.toLowerCase().includes(doc.label.toLowerCase())
    );

    return (
      <TableRow key={doc.key}>
        <TableCell sx={{ fontWeight: 'bold', width: '25%', border: "2px solid maroon" }}>{doc.label}</TableCell>
        <TableCell sx={{ width: '25%', border: "2px solid maroon", textAlign: "Center" }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Box sx={{ width: '220px', flexShrink: 0, textAlign: "center" }}>
              {selectedFiles[doc.key] ? (
                <Box
                  sx={{
                    backgroundColor: '#e0e0e0',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={selectedFiles[doc.key]}
                >
                  {selectedFiles[doc.key]}
                </Box>
              ) : (
                <Box sx={{ height: '40px' }} />
              )}
            </Box>

            <Box sx={{ flexShrink: 0 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{
                  backgroundColor: '#F0C03F',
                  color: 'white',
                  fontWeight: 'bold',
                  height: '40px',
                  textTransform: 'none',
                  minWidth: '140px',
                }}
              >
                Browse File
                <input
                  key={selectedFiles[doc.key] || Date.now()}
                  hidden
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleUpload(doc.key, e.target.files[0])}
                />
              </Button>
            </Box>
          </Box>
        </TableCell>

        <TableCell sx={{ width: "25%", border: "2px solid maroon" }}>
          <Typography
            sx={{
              fontStyle: uploaded?.remarks ? "normal" : "italic",
              color: uploaded?.remarks ? "inherit" : "#888",
            }}
          >
            {uploaded?.remarks || ""}
          </Typography>

          {uploaded?.status == 1 || uploaded?.status == 2 ? (
            <Typography
              sx={{
                mt: 0.5,
                fontSize: "14px",
                color: uploaded?.status == 1 ? "green" : "red",
                fontWeight: "bold",
              }}
            >
              {uploaded?.status == 1 ? "Verified" : "Rejected"}
            </Typography>
          ) : null}
        </TableCell>

        <TableCell sx={{ width: '10%', border: "2px solid maroon" }}>
          {uploaded && (
            <Button
              variant="contained"
              color="primary"
              href={`http://localhost:5000${uploaded.file_path}`}
              target="_blank"
              startIcon={<VisibilityIcon />}
              sx={{
                height: '40px',
                textTransform: 'none',
                minWidth: '100px',
                width: '100%',
              }}
            >
              Preview
            </Button>
          )}
        </TableCell>

        <TableCell sx={{ width: '10%', border: "2px solid maroon" }}>
          {uploaded && (
            <Button
              onClick={() => handleDelete(uploaded.upload_id)}
              startIcon={<DeleteIcon />}
              sx={{
                backgroundColor: 'maroon',
                color: 'white',
                '&:hover': { backgroundColor: '#600000' },
                fontWeight: 'bold',
                height: '40px',
                textTransform: 'none',
                minWidth: '100px',
                width: '100%',
              }}
            >
              Delete
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent" }}>
      {/* ✅ Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={handleClose} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center", // ✅ Center horizontally
          width: "100%",
          mt: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center", // ✅ Center content inside full-width box
            gap: 2,
            width: "100%", // ✅ Still takes full width
            textAlign: "center",
            p: 2,
            borderRadius: "10px",
            backgroundColor: "#fffaf5",
            border: "1px solid #6D2323",
            boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
            whiteSpace: "nowrap",
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
              width: 50,
              height: 50,
              flexShrink: 0,
            }}
          >
            <ErrorIcon sx={{ color: "white", fontSize: 40 }} />
          </Box>

          {/* Text */}
          <Typography
            sx={{
              fontSize: "15px",
              fontFamily: "Arial",
              color: "#3e3e3e",
              textAlign: "center",
            }}
          >
            <strong style={{ color: "maroon" }}>Notice:</strong> &nbsp;
            <strong>
              PLEASE NOTE: ONLY JPG, JPEG, PNG or PDF WITH MAXIMUM OF FILE SIZE OF 4MB ARE ALLOWED
            </strong>
          </Typography>
        </Box>
      </Box>


      <Box sx={{ mt: 2, px: 2, marginLeft: "-10px" }}>
        <Container>
          <h1 style={{ fontSize: "50px", fontWeight: "bold", textAlign: "center", color: "maroon", marginTop: "25px" }}>UPLOAD DOCUMENTS</h1>
          <div style={{ textAlign: "center" }}>Complete the applicant form to secure your place for the upcoming academic year at EARIST.</div>
        </Container>

        <div style={{ height: "25px" }}></div>



        <TableContainer component={Paper} sx={{ width: '95%', border: "2px solid maroon" }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#6D2323', border: "2px solid maroon" }}>
              <TableRow>
                <TableCell sx={{ color: 'white', border: "2px solid maroon" }}>Document</TableCell>
                <TableCell sx={{ color: 'white', border: "2px solid maroon" }}>Upload</TableCell>
                <TableCell sx={{ color: 'white' }}>Remarks</TableCell>
                <TableCell sx={{ color: 'white' }}>Preview</TableCell>
                <TableCell sx={{ color: 'white' }}>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{requiredDocs.map((doc) => renderRow(doc))}</TableBody>
          </Table>
        </TableContainer>

        <Container>
          <h1 style={{ fontSize: "50px", fontWeight: "bold", textAlign: "center", color: "maroon", marginTop: "25px" }}> UPLOAD MEDICAL DOCUMENTS</h1>

        </Container>



        <TableContainer component={Paper} sx={{ width: '95%', mt: 2, border: "2px solid maroon" }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#6D2323', border: "2px solid maroon" }}>
              <TableRow>
                <TableCell sx={{ color: 'white' }}>Document</TableCell>
                <TableCell sx={{ color: 'white' }}>Upload</TableCell>
                <TableCell sx={{ color: 'white' }}>Remarks</TableCell>
                <TableCell sx={{ color: 'white' }}>Preview</TableCell>
                <TableCell sx={{ color: 'white' }}>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{renderRow(vaccineDoc)}</TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default RequirementUploader;
