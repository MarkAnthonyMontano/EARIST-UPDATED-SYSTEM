import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ExamScheduler = () => {
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  const handleAddSlot = () => { 
    if (!newDate || !newStartTime || !newEndTime) return alert("Please fill all fields.");

    axios.post('http://localhost:3001/add_exam_slot', {
      exam_date: newDate,
      start_time: newStartTime,
      end_time: newEndTime
    })
    .then(res => {
      alert(res.data.message);
      setNewDate('');
      setNewStartTime('');
      setNewEndTime('');
    })
    .catch(err => alert(err.response?.data?.error || "Error adding slot"));
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-lg rounded-lg">
      {/* New Slot Form */}
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Exam Slot</h3>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleAddSlot();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block mb-1 font-medium text-gray-700" htmlFor="exam-date">Date</label>
          <input
            id="exam-date"
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700" htmlFor="start-time">Start Time</label>
          <input
            id="start-time"
            type="time"
            value={newStartTime}
            onChange={e => setNewStartTime(e.target.value)}
            required
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700" htmlFor="end-time">End Time</label>
          <input
            id="end-time"
            type="time"
            value={newEndTime}
            onChange={e => setNewEndTime(e.target.value)}
            required
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
          style={{background: 'green', color: 'white', padding: '1rem 0rem', width: '100%', marginTop: '1rem'}}
        >
          Add Slot
        </button>
      </form>
    </div>
  );
};

export default ExamScheduler;
