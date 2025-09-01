import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';

const DepartmentSection = () => {
  const [dprtmntSection, setDprtmntSection] = useState({
    curriculum_id: '',
    section_id: '',
  });

  const [curriculumList, setCurriculumList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [departmentSections, setDepartmentSections] = useState([]);

  useEffect(() => {
    fetchCurriculum();
    fetchSections();
    fetchDepartmentSections();
  }, []);

  const fetchCurriculum = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get_curriculum');
      setCurriculumList(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await axios.get('http://localhost:5000/section_table');
      setSectionsList(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartmentSections = async () => {
    try {
      const response = await axios.get('http://localhost:5000/department_section');
      setDepartmentSections(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDprtmntSection((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddDepartmentSection = async () => {
    const { curriculum_id, section_id } = dprtmntSection;
    if (!curriculum_id || !section_id) {
      alert("Please select both curriculum and section.");
      return;
    }

    try {
      await axios.post('http://localhost:5000/department_section', dprtmntSection);
      setDprtmntSection({ curriculum_id: '', section_id: '' });
      fetchDepartmentSections();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', mt: 5, px: 2 }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        color="maroon"
        textAlign="center"
        gutterBottom
      >
        Department Section Panel
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4,
          mt: 4,
        }}
      >
        {/* Form Section */}
        <Box
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 2,
            boxShadow: 2,
            bgcolor: 'white',
          }}
        >
          <Typography variant="h6" gutterBottom textAlign="center">
            Department Section Assignment
          </Typography>
          <label style={{ fontWeight: 'bold', marginBottom: 4 }} htmlFor="curriculum_id">
            Curriculum:
          </label>
          <FormControl fullWidth sx={{ mb: 3 }} variant="outlined">
            <InputLabel id="curriculum-label">Curriculum</InputLabel>
            <Select
              labelId="curriculum-label"
              name="curriculum_id"
              value={dprtmntSection.curriculum_id}
              onChange={handleChange}
              label="Curriculum"
            >
              <MenuItem value="">Select Curriculum</MenuItem>
              {curriculumList.map((curr) => (
                <MenuItem key={`curr-${curr.curriculum_id}`} value={curr.curriculum_id}>
                  {curr.year_description} - {curr.program_description} | {curr.curriculum_id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <label style={{ fontWeight: 'bold', marginBottom: 4 }} htmlFor="curriculum_id">
            Section:
          </label>
          <FormControl fullWidth sx={{ mb: 3 }} variant="outlined">
            <InputLabel id="section-label">Section</InputLabel>
            <Select
              labelId="section-label"
              name="section_id"
              value={dprtmntSection.section_id}
              onChange={handleChange}
              label="Section"
            >
              <MenuItem value="">Select Section</MenuItem>
              {sectionsList.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>


          <Button
            variant="contained"
            fullWidth
            onClick={handleAddDepartmentSection}
            sx={{ bgcolor: 'maroon', ':hover': { bgcolor: '#800000' } }}
          >
            Insert
          </Button>
        </Box>

        {/* Display Section */}
        <Box
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 2,
            boxShadow: 2,
            bgcolor: 'white',
            overflowY: 'auto',
            maxHeight: 500,
          }}
        >
          <Typography variant="h6" gutterBottom textAlign="center">
            Department Sections
          </Typography>

          <Box sx={{ overflowY: 'auto', maxHeight: 400 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f5f5f5' }}>
                <tr>
                  <th style={styles.tableCell}>Curriculum Name</th>
                  <th style={styles.tableCell}>Section Description</th>
                  <th style={styles.tableCell}>Status</th>
                </tr>
              </thead>
              <tbody>
                {departmentSections.map((section, index) => (
                  <tr key={`dept-${section.ds_id || section.id || index}`}>
                    <td style={styles.tableCell}>
                      {section.program_code}-{section.year_description}
                    </td>
                    <td style={styles.tableCell}>{section.section_description}</td>
                    <td style={styles.tableCell}>
                      {section.dsstat === 0 ? 'Inactive' : 'Active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const styles = {
  tableCell: {
    border: '1px solid #ccc',
    padding: '10px',
    textAlign: 'center',
  },
};

export default DepartmentSection;
