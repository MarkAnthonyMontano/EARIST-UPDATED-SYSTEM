import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Button, Grid, MenuItem, TextField, Typography, Paper } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

import { useNavigate } from "react-router-dom";

const AssignEntranceExam = () => {
  const tabs = [
    { label: "Room Scheduling", to: "/assign_entrance_exam" },
    { label: "Applicant's Scheduling", to: "/assign_schedule_applicant" },
    { label: "Examination Profile", to: "/examination_profile" },
    { label: "Entrance Examation Scores", to: "/applicant_scoring" },
    { label: "Qualifying Examination Scores", to: "/qualifying_exam_scores" },
    { label: "Proctor's Applicant List", to: "/proctor_applicant_list" },
  ];


  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(3);
  const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));


  const handleStepClick = (index, to) => {
    setActiveStep(index);
    navigate(to); // this will actually change the page
  };

  const [day, setDay] = useState("");
  const [roomId, setRoomId] = useState("");            // store selected room_id
  const [rooms, setRooms] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState("");
  const [roomQuota, setRoomQuota] = useState("");
  const [proctor, setProctor] = useState("");
  const [roomNo, setRoomNo] = useState("");



  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get("http://localhost:5000/room_list");
        // expect res.data = [{ room_id: 1, room_description: "Room A" }, ...]
        setRooms(res.data);
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setMessage("Could not load rooms. Check backend /room_list.");
      }
    };
    fetchRooms();
  }, []);

  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await axios.get("http://localhost:5000/exam_schedules_with_count");
        setSchedules(res.data);
      } catch (err) {
        console.error("Error fetching schedules:", err);
      }
    };
    fetchSchedules();
  }, []);


  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setMessage("");

    const sel = rooms.find((r) => String(r.room_id) === String(roomId));
    if (!sel) {
      setMessage("Please select a valid room.");
      return;
    }

    // 🔎 Check conflict
    const conflict = schedules.some(s =>
      s.day_description === day &&
      s.room_description === sel.room_description &&
      !(
        endTime <= s.start_time || startTime >= s.end_time // no overlap
      )
    );

    if (conflict) {
      setMessage("Conflict detected: This room is already booked for that time.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/insert_exam_schedule", {
        day_description: day,
        room_description: sel.room_description,
        room_no: roomNo,
        start_time: startTime,
        end_time: endTime,
        proctor,
        room_quota: roomQuota || 40,
      });

      setMessage("Entrance exam schedule saved successfully.");
      setDay("");
      setRoomId("");
      setStartTime("");
      setEndTime("");
      setProctor("");
      setRoomQuota("");

      // refresh schedules so conflicts update
      const res = await axios.get("http://localhost:5000/exam_schedules_with_count");
      setSchedules(res.data);

    } catch (err) {
      console.error("Error saving schedule:", err);
      setMessage("Failed to save schedule.");
    }
  };

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
          ROOM SCHEDULING
        </Typography>


      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />

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

      <Box
        display="flex"
        justifyContent="center"
        alignItems="flex-start"
        width="100%"
        mt={3}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            maxWidth: 500,
            width: "100%",
            borderRadius: 3,
            bgcolor: "background.paper",
            border: "3px solid maroon", // keep the maroon border
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            mb={2}
            textAlign="center"
            color="maroon"
          >
            ADD SCHEDULE
          </Typography>

          <form onSubmit={handleSaveSchedule}>
            <Grid container spacing={1}>
              {/* Day */}
              <Grid item xs={12}>
                <Typography fontWeight={500}>
                  Day
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  required
                  variant="outlined"
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                    (d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Grid>

              {/* Room */}
              <Grid item xs={12}>
                <Typography fontWeight={500}>
                  Building
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  required
                  variant="outlined"
                >
                  {Array.isArray(rooms) && rooms.length > 0 ? (
                    rooms.map((r) => (
                      <MenuItem key={r.room_id} value={r.room_id}>
                        {r.room_description}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No rooms available</MenuItem>
                  )}

                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Typography fontWeight={500}>
                  Room No.:
                </Typography>
                <TextField
                  fullWidth
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                  required
                  variant="outlined"
                  placeholder="Enter Room Number"
                />
              </Grid>


              {/* Start Time */}
              <Grid item xs={12}>
                <Typography fontWeight={500}>Start Time</Typography>
                <TextField
                  fullWidth
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  inputProps={{ step: 300 }} // 5-min step
                  required
                  variant="outlined"
                />
              </Grid>

              {/* End Time */}
              <Grid item xs={12}>
                <Typography fontWeight={500}>End Time</Typography>
                <TextField
                  fullWidth
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  inputProps={{ step: 300 }}
                  required
                  variant="outlined"
                />
              </Grid>


              {/* Proctor */}
              <Grid item xs={12}>
                <Typography fontWeight={500}>
                  Proctor
                </Typography>
                <TextField
                  fullWidth
                  value={proctor}
                  onChange={(e) => setProctor(e.target.value)}
                  required
                  variant="outlined"
                  placeholder="Enter proctor name"
                />
              </Grid>

              {/* Room Quota */}
              <Grid item xs={12}>
                <Typography fontWeight={500}>Room Quota</Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={roomQuota}
                  onChange={(e) => setRoomQuota(e.target.value)}
                  required
                  variant="outlined"
                  inputProps={{ min: 1 }}
                />
              </Grid>


              {/* Submit Button */}
              <Grid item xs={12} display="flex" justifyContent="center">
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    bgcolor: "#800000",
                    "&:hover": { bgcolor: "#a00000" },
                    px: 6,
                    py: 1.5,
                    mt: 2,
                    borderRadius: 2,
                  }}
                >
                  Save Schedule
                </Button>
              </Grid>

              {/* Message */}
              {message && (
                <Grid item xs={12}>
                  <Typography textAlign="center" color="maroon">
                    {message}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default AssignEntranceExam;
