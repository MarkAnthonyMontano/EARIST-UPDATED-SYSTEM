import React, { useState, useEffect } from "react";
import axios from "axios";

const StudentProfileForm = () => {
  const [formData, setFormData] = useState({
    branch: "",
    student_number: "",
    LRN: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    middle_initial: "",
    extension: "",
    mobile_number: "",
    residential_address: "",
    residential_region: "",
    residential_province: "",
    residential_municipality: "",
    residential_telephone: "",
    permanent_address: "",
    permanent_region: "",
    permanent_province: "",
    permanent_municipality: "",
    permanent_telephone: "",
    monthly_income: "",
    ethnic_group: "",
    pwd_type: "",
    date_of_birth: "",
    place_of_birth: "",
    gender: "",
    religion: "",
    citizenship: "",
    civil_status: "",
    blood_type: "",
    nstp_serial_number: "",
    transfer_status: "",
    previous_school: "",
    transfer_date: "",
    school_year: "",
    term: "",
    transfer_reason: "",
    department: "",
    program: "",
    year_level: "",
    section: "",
    curriculum_type: "",
    curriculum_year: "",
    admission_year: "",
    assessment_type: "",
    admission_status: "",
    enrollment_status: "",
    academic_status: ""
  });

  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get("http://localhost:5000/student_profile_table");
      setRecords(response.data);
    } catch (error) {
      console.error("Error fetching records", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/student_profile_table/${editingId}`, formData);
      } else {
        await axios.post("http://localhost:5000/student_profile_table", formData);
      }
      fetchRecords();
      setFormData({});
      setEditingId(null);
    } catch (error) {
      console.error("Error saving record", error);
    }
  };

  const handleEdit = (record) => {
    setFormData(record);
    setEditingId(record.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/student_profile_table/${id}`);
      fetchRecords();
    } catch (error) {
      console.error("Error deleting record", error);
    }
  };

  return (
    <div>
      <h2>Student Profile Form</h2>
      <form onSubmit={handleSubmit}>
        {Object.keys(formData).map((key) => (
          <input
            key={key}
            type="text"
            name={key}
            placeholder={key.replace(/_/g, " ").toUpperCase()}
            value={formData[key]}
            onChange={handleChange}
            required
          />
        ))}
        <button type="submit">{editingId ? "Update" : "Add"} Profile</button>
      </form>
      <h2>Student Profiles List</h2>
      <ul>
        {records.map((record) => (
          <li key={record.id}>
            {Object.values(record).join(" - ")}
            <button onClick={() => handleEdit(record)}>Edit</button>
            <button onClick={() => handleDelete(record.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentProfileForm;