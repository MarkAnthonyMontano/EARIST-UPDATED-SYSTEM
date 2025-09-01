import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ExamScheduler2 = () => {
  const [applicant, setApplicant] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [allSlots, setAllSlots] = useState([]);

  // Fetch applicants
  const fetchApplicant = async () => {
    try {
      const response = await axios.get('http://localhost:3001/get_applicant_schedule');
      setApplicant(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch all slots with occupied counts
  const fetchSlots = async () => {
    try {
      const response = await axios.get('http://localhost:3001/exam_slots');
      setAllSlots(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchApplicant();
    fetchSlots();
  }, []);

  const handleSlotChange = (e) => {
    const slotId = e.target.value;
    const slot = allSlots.find(s => s.exam_id === parseInt(slotId));

    if (slot && slot.occupied >= 7) {
      alert("The Selected Schedule is currently full. Please Select another Date");
      setSelectedSlotId('');
    } else {
      setSelectedSlotId(slotId);
    }
  };

  const handleBooking = (applicant_id) => {
    if (!selectedSlotId) {
      return alert("Please select a schedule slot first.");
    }
    const selectedSlot = allSlots.find(slot => slot.exam_id === parseInt(selectedSlotId));

    if (!selectedSlot || selectedSlot.occupied >= 7) {
      return alert("The Selected Schedule is currently full. Please Select another Date");
    }

    axios.post('http://localhost:3001/applicant_schedule', {
      applicant_id,
      exam_id: selectedSlot.exam_id
    })
    .then(res => {  
      fetchSlots();
      fetchApplicant();
    })
    .catch(err => {
      alert(err.response?.data?.error || "Error booking slot");
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white shadow-lg rounded-lg" style={{ width: '100%' }}>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Assign Exam Schedule</h3>
        <div style={{display: 'flex'}}>
            <div className="w-full" style={{width: '50rem'}}>
                <h2 className="text-lg font-semibold mb-2 text-gray-800">Applicants Waiting for Schedule</h2>
                {applicant.length === 0 ? (
                    <p className="text-gray-500">No applicants available.</p>
                ) : (
                    <div className="space-y-4 max-h-80 overflow-y-auto border rounded p-4">
                        {applicant.map((app, index) => (
                        <div key={index} className="flex justify-between items-center border-b pb-2" style={{width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', marginTop:'1rem'}}>
                            <div>
                            {app.id}. Applicant ID: <span className="font-medium">{app.applicant_id}</span>
                            </div>
                            <button
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                            disabled={!selectedSlotId}
                            onClick={() => handleBooking(app.applicant_id)}
                            >
                            Assign Schedule
                            </button>
                        </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="mb-6">
            <label className="block mb-2 font-semibold text-gray-700">Select a Schedule Slot</label>
            <select
            className="border rounded px-3 py-2 w-full"
            value={selectedSlotId}
            onChange={handleSlotChange}
            >
            <option value="">-- Select a Slot --</option>
            {allSlots.map((slot, index) => (
                <option
                key={index}
                value={slot.exam_id}
                disabled={slot.occupied >=7}
                >
                {slot.exam_date} ({slot.exam_start_time} - {slot.exam_end_time}) - {slot.occupied}/7 {slot.occupied >= 50 ? "(Full)" : ""}
                </option>
            ))}
            </select>
            </div>
        </div>
    </div>
  );
};

export default ExamScheduler2;
