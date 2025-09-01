import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Box,
} from '@mui/material';

const SectionPanel = () => {
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await axios.get('http://localhost:5000/section_table');
      setSections(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post('http://localhost:5000/section_table', { description });
      setDescription('');
      fetchSections();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3 }}>
      <Typography variant="h4" color="maroon" fontWeight="bold" textAlign="center" gutterBottom>
        Section Panel Form
      </Typography>
      <Box display="flex" gap={3}>
        {/* Left Form Section */}
        <Paper elevation={3} sx={{ flex: 1, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Section Panel Form
          </Typography>

          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Section Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                required
              />
              <Button
                type="submit"
                variant="contained"
                sx={{ backgroundColor: '#7b1f1f', color: '#fff' }}
              >
                Insert
              </Button>
            </Box>
          </form>
        </Paper>

        {/* Right Table Display Section */}
        <Paper elevation={3} sx={{ flex: 2, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Section List
          </Typography>
          <TableContainer sx={{ maxHeight: 400, overflowY: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Section Description</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sections.map((section) => (
                  <TableRow key={section.id}>
                    <TableCell>{section.id}</TableCell>
                    <TableCell>{section.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
};

export default SectionPanel;
