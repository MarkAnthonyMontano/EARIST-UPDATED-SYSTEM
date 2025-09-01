import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Grid,
} from "@mui/material";

const RoomRegistration = () => {
  const [roomName, setRoomName] = useState("");
  const [roomList, setRoomList] = useState([]);

  useEffect(() => {
    fetchRoomList();
  }, []);

  const fetchRoomList = async () => {
    try {
      const res = await axios.get("http://localhost:5000/room_list");
      setRoomList(res.data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  };

  const handleAddRoom = async () => {
    if (!roomName.trim()) return alert("Room name is required");

    try {
      await axios.post("http://localhost:5000/room", { room_name: roomName });
      setRoomName("");
      fetchRoomList();
    } catch (err) {
      console.error("Error adding room:", err);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 5, px: 2 }}>
      <Typography
        variant="h4"
        align="center"
        fontWeight="bold"
        sx={{ color: "#800000", mb: 4 }}
      >
        Room Registration Panel
      </Typography>

      <Grid container spacing={4}>
        {/* Form Section */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3,  }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#000000", }}>
              Register New Room
            </Typography>

            <TextField
              fullWidth
              label="Room Name"
              
              variant="outlined"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              sx={{ mb: 2, }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handleAddRoom}
              sx={{
                backgroundColor: "#800000",
                "&:hover": { backgroundColor: "#a00000" },
              }}
            >
              Save
            </Button>
          </Paper>
        </Grid>

        {/* Room List Section */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#000000" }}>
              Registered Rooms
            </Typography>

            <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Room ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Room Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roomList.map((room, index) => (
                    <TableRow key={index}>
                      <TableCell>{room.room_id}</TableCell>
                      <TableCell>{room.room_description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RoomRegistration;
