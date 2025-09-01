import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
} from "@mui/material";
import { Add, Edit, Search, SortByAlpha, FileDownload } from "@mui/icons-material";
import axios from "axios";

const FacultyList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [professors, setProfessors] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({
    person_id: "",
    fname: "",
    mname: "",
    lname: "",
    email: "",
    password: "",
    role: "faculty",
    profileImage: null,
  });

  const fetchProfessors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/professors");
      if (Array.isArray(res.data)) {
        setProfessors(res.data);
      } else {
        setProfessors([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setProfessors([]);
    }
  };

  useEffect(() => {
    fetchProfessors();
  }, []);

  const filteredProfessors = professors
    .filter((p) =>
      `${p.fname} ${p.mname} ${p.lname} ${p.email}`.toLowerCase().includes(searchQuery)
    )
    .sort((a, b) => {
      const nameA = `${a.fname} ${a.lname}`.toLowerCase();
      const nameB = `${b.fname} ${b.lname}`.toLowerCase();
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

  const handleExportCSV = () => {
    const headers = ["Person ID", "Full Name", "Email", "Role", "Status"];
    const rows = filteredProfessors.map((p) => [
      p.person_id,
      `${p.fname} ${p.mname || ""} ${p.lname}`,
      p.email,
      p.role,
      p.status === 1 ? "Active" : "Inactive",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "professors.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChange = (e) => {
    if (e.target.name === "profileImage") {
      setForm({ ...form, profileImage: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async () => {
  const requiredFields = ["fname", "lname", "email"];
  if (!editData) {
    requiredFields.push("password", "profileImage", "person_id");
  }

  const missing = requiredFields.filter((key) => !form[key]);
  if (missing.length > 0) {
    alert(`Please fill out required fields: ${missing.join(", ")}`);
    return;
  }

  const formData = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    if (value) formData.append(key, value);
  });

  try {
    if (editData) {
      // EDIT
      await axios.put(`http://localhost:5000/api/update_prof/${editData.prof_id}`, formData);
    } else {
      // ADD
      await axios.post(`http://localhost:5000/api/register_prof`, formData);
    }

    fetchProfessors();
    handleCloseDialog();
  } catch (err) {
    console.error("Submit Error:", err);
    alert(err.response?.data?.error || "An error occurred");
  }
};



  const handleEdit = (prof) => {
    setEditData(prof);
    setForm({
      person_id: prof.person_id || "",
      fname: prof.fname,
      mname: prof.mname || "",
      lname: prof.lname,
      email: prof.email,
      password: "", // leave blank unless changed
      role: prof.role || "faculty",
      profileImage: null, // new upload optional
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditData(null);
    setForm({
      person_id: "",
      fname: "",
      mname: "",
      lname: "",
      email: "",
      password: "",
      role: "faculty",
      profileImage: null,
    });
  };

  const handleToggleStatus = async (prof_id, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await axios.put(`http://localhost:5000/api/update_prof_status/${prof_id}`, {
        status: newStatus,
      });
      fetchProfessors();
    } catch (err) {
      console.error("Status toggle failed:", err);
    }
  };

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", pr: 1 }}>
      <div style={{ height: "30px" }}></div>
      <Typography variant="h4" color="maroon" fontWeight="bold" gutterBottom>
       Professor Account's
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <TextField
          variant="outlined"
          placeholder="Search by name or email"
          size="small"
          style={{ width: "400px" }}
          onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1 }} />,
          }}
        />

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => {
              setEditData(null);
              setForm({
                person_id: "",
                fname: "",
                mname: "",
                lname: "",
                email: "",
                password: "",
                role: "faculty",
                profileImage: null,
              });
              setOpenDialog(true);
            }}
            sx={{
              backgroundColor: "maroon",
              color: "white",
              textTransform: "none",
            }}
          >
            Add Professor
          </Button>


          <Button
            variant="outlined"
            startIcon={<SortByAlpha />}
            onClick={() => setSortAsc(!sortAsc)}
            sx={{ borderColor: "maroon", color: "maroon" }}
          >
            Sort {sortAsc ? "Z–A" : "A–Z"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExportCSV}
            sx={{ borderColor: "maroon", color: "maroon" }}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>EMPLOYEE ID</TableCell>
            <TableCell>Image</TableCell>
            <TableCell>Full Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Position</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredProfessors.map((prof) => (
            <TableRow key={prof.prof_id}>
              <TableCell>{prof.person_id ?? "N/A"}</TableCell>
              <TableCell>
                <Avatar
                  src={
                    prof.profile_image
                      ? `http://localhost:5000/uploads/${prof.profile_image}`
                      : undefined
                  }
                  alt={prof.fname}
                  sx={{ width: 60, height: 60, borderRadius: 1 }}
                >
                  {prof.fname?.[0]}
                </Avatar>
              </TableCell>
              <TableCell>{`${prof.fname} ${prof.mname || ""} ${prof.lname}`}</TableCell>
              <TableCell>{prof.email}</TableCell>

              <TableCell>{prof.role}</TableCell>
              <TableCell>
                <Button
                  onClick={() => handleToggleStatus(prof.prof_id, prof.status)}
                  sx={{
                    backgroundColor: prof.status === 1 ? "green" : "maroon",
                    color: "white",
                    textTransform: "none",
                  }}
                  variant="contained"
                >
                  {prof.status === 1 ? "Active" : "Inactive"}
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => handleEdit(prof)}
                  sx={{
                    backgroundColor: "#FEF9E1",
                    color: "maroon",
                    textTransform: "none",
                    fontWeight: "bold",
                    "&:hover": {
                      backgroundColor: "#f5f1cf", // Optional hover effect
                    },
                  }}
                  variant="contained"
                >
                  EDIT
                </Button>
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog */}

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
        <DialogTitle sx={{ color: "maroon" }}>
          {editData ? "Edit Professor" : "Add New Professor"}
        </DialogTitle>
        <hr style={{ border: "1px solid #ccc", width: "100%" }} />
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          {editData?.profile_image && (
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2">Current Profile Image</Typography>
              <Avatar
                src={`http://localhost:5000/uploads/${editData.profile_image}`}
                sx={{ width: 100, height: 100, mx: "auto", mb: 2 }}
              />
            </Box>
          )}
          <TextField label="Person ID" name="person_id" value={form.person_id} onChange={handleChange} />
          <TextField label="First Name" name="fname" value={form.fname} onChange={handleChange} required />
          <TextField label="Middle Name" name="mname" value={form.mname} onChange={handleChange} />
          <TextField label="Last Name" name="lname" value={form.lname} onChange={handleChange} required />
          <TextField label="Email" name="email" value={form.email} onChange={handleChange} required />
          {!editData && (
            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          )}
          <input type="file" name="profileImage" accept="image/*" onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              !form.fname || !form.lname || !form.email || (!editData && (!form.password || !form.profileImage || !form.person_id))
            }
          >
            {editData ? "Update" : "Register"}
          </Button>

        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacultyList;
