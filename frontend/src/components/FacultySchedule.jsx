import React, {useState, useEffect} from 'react';
import axios from 'axios';

const FacultySchedule = () => {
    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [profData, setPerson] = useState({
        prof_id: '',
        fname: '',
        mname: '',
        lname: '',
        profile_img: '',
        room_id: '',
        room_description: '',
        department_section_id: '',
        subject_id: '',
        active_school_year_id: '',
        mappings: [] 
    });
      
    useEffect(() => {
        const storedUser = localStorage.getItem("email");
        const storedRole = localStorage.getItem("role");
        const storedID = localStorage.getItem("person_id");

        if (storedUser && storedRole && storedID) {
            setUser(storedUser);
            setUserRole(storedRole);
            setUserID(storedID);

            if (storedRole !== "faculty") {
                window.location.href = "/dashboard";
            } else {
                fetchPersonData(storedID);
            }
        } else {
            window.location.href = "/login";
        }
    }, []);

    const fetchPersonData = async (id) => {
        try{
            const res = await axios.get(`http://localhost:5000/get_prof_data/${id}`);
            const first = res.data[0];
            
            const profInfo = {
                prof_id: first.prof_id,
                fname: first.fname,
                mname: first.mname,
                lname: first.lname,
                profile_img: first.profile_image,
                room_id: first.department_room_id,
                room_description: first.room_description,
                department_section_id: first.department_section_id, // optional, if needed
                subject_id: first.subject_id, // optional, if needed
                active_school_year_id: first.school_year_id,
                mappings: res.data.map(row => ({
                    room_id: row.department_room_id,
                    room_description: row.room_description,
                }))
            };
      
            setPerson(profInfo);
        } catch (err) {
            setLoading(false);
            setMessage("Error Fetching person's data");
        }
    }

    useEffect(() => {
        if (!profData.prof_id || !profData.room_id) return; 
        
        const fetchSchedule = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/get_room/${profData.prof_id}/${profData.room_id}`);
            
                setSchedule(response.data);
            } catch (err) {
                setLoading(false)
                setMessage('Error fetching professor schedule:');
            }
        };

        fetchSchedule();
    }, [profData.prof_id, profData.room_id]);

    const isTimeInSchedule = (start, end, day) => {
        const parseTime = (timeStr) => {
            
            const time = new Date(`1970-01-01T${new Date('1970-01-01 ' + timeStr).toTimeString().slice(0,8)}`);
            return time;
        };
      
        return schedule.some(entry => {
            if (entry.day !== day) return false;
                const slotStart = parseTime(start);
                const slotEnd = parseTime(end);
                const profStart = parseTime(entry.start_time);
                const profEnd = parseTime(entry.end_time);
                return slotStart >= profStart && slotEnd <= profEnd;
        });
    };

    const hasAdjacentSchedule = (start, end, day, direction = "top") => {
        const parseTime = (timeStr) => new Date(`1970-01-01T${new Date('1970-01-01 ' + timeStr).toTimeString().slice(0,8)}`);
      
        const minutesOffset = direction === "top" ? -60 : 60;
      
        const newStart = new Date(parseTime(start).getTime() + minutesOffset * 60000);
        const newEnd = new Date(parseTime(end).getTime() + minutesOffset * 60000);
      
        return schedule.some(entry => {
          if (entry.day !== day) return false;
      
          const profStart = parseTime(entry.start_time);
          const profEnd = parseTime(entry.end_time);
      
          return newStart >= profStart && newEnd <= profEnd;
        });
    };
          
    return (
        <div className='overflow-y-scroll h-screen relative'>
            <div className="temp-container">
                {profData.mappings && profData.mappings
                .filter((item, index, self) =>
                    index === self.findIndex(v => v.room_id === item.room_id)
                )
                .map((map, index) => (
                <button
                    key={`${map.room_id}`} 
                    onClick={() => {
                        setPerson(prev => ({
                          ...prev,
                          room_id: map.room_id,
                          room_description: map.room_description
                        }));
                    }}
                    className="p-2 px-4 rounded font-[500]"
                >
                    {map.room_description}
                </button>
                ))}
            </div>

            <div className='min-h-[10rem] mb-[16rem]'>
                <table className='mt-[0.7rem]'>
                    <thead>
                        <tr className=''>
                            <td className='flex justify-center w-[63rem] text-[38px] font-bold'>FACULTY ASSIGNMENT</td>
                            <td className='flex justify-center w-[63rem] text-[18px] tracking-[-0.5px] mt-[-0.5rem]'>Second Semester: <p className='ml-2'>SY, 2024-2025</p></td>
                        </tr>
                    </thead>
                </table>
                <table className='mt-[0.7rem]'>
                    <thead>
                        <tr>
                            <td className='w-[6.5rem] h-[2.4rem] flex items-center justify-center border border-black text-[14px]'>TIME</td>
                            <td className='p-0 m-0'>
                                <div className='w-[6.6rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>DAY</div>
                                <p className='w-[6.6rem] text-center border border-black border-l-0 text-[11.5px] font-bold mt-[-3px]'>Official Time</p>
                            </td>
                            <td className='p-0 m-0'>
                                <div className='w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>MONDAY</div>
                                <p className='w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00AM</p>
                            </td>
                            <td className='p-0 m-0'>
                                <div className='w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>TUESDAY</div>
                                <p className='w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>9:00AM - 10:00AM</p>
                            </td>
                            <td className='p-0 m-0'>
                                <div className='w-[7rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>WEDNESDAY</div>
                                <p className='w-[7rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00AM</p>
                            </td>
                            <td className='p-0 m-0'>
                                <div className='w-[6.9rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>THURSDAY</div>
                                <p className='w-[6.9rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>9:00AM - 10:00AM</p>
                            </td>
                            <td className='p-0 m-0'>
                                <div className='w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>FRIDAY</div>
                                <p className='w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>9:00AM - 10:00AM</p>
                            </td>
                            <td className='p-0 m-0'>
                                <div className='w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>SATUDAY</div>
                                <p className='w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>9:00AM - 10:00AM</p>
                            </td>
                            <td className='p-0 m-0'>
                                <div className='w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>SUNDAY</div>
                                <p className='w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>9:00AM - 10:00AM</p>
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>7:00 AM - 8:00 AM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "MON") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "MON") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "TUE") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "TUE") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "WED") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "WED") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "THU") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "THU") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "FRI") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "FRI") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "SAT") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "SAT") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "SUN") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "SUN") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>
                        
                        <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>8:00 AM - 9:00 AM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "MON") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "MON") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "TUE") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "TUE") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "WED") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "WED") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "THU") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "THU") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "FRI") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "FRI") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "SAT") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "SAT") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "SUN") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "SUN") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>

                        <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>9:00 AM - 10:00 AM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "MON") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "MON") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "TUE") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "TUE") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "WED") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "WED") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "THU") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "THU") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "FRI") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "FRI") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "SAT") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "SAT") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "SUN") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "SUN") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>

                        <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>10:00 AM - 11:00 AM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "MON") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "MON") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "TUE") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "TUE") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "WED") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "WED") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "THU") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "THU") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "FRI") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "FRI") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "SAT") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "SAT") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "SUN") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "SUN") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>

                        <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>11:00 AM - 12:00 PM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "MON") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "MON") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "TUE") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "TUE") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "WED") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "WED") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "THU") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "THU") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "FRI") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "FRI") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "SAT") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "SAT") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "SUN") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "SUN") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>

                        <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>12:00 PM - 1:00 PM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "MON") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "MON") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "TUE") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "TUE") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "WED") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "WED") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "THU") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "THU") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "FRI") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "FRI") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "SAT") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "SAT") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "SUN") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "SUN") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>

                        <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>1:00 PM - 2:00 PM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "MON") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "MON") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "TUE") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "TUE") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "WED") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "WED") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "THU") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "THU") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "FRI") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "FRI") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "SAT") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "SAT") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "SUN") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "SUN") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>

                        <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>2:00 PM - 3:00 PM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "MON") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "MON") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "TUE") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "TUE") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "WED") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "WED") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "THU") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "THU") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "FRI") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "FRI") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "SAT") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "SAT") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "SUN") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "SUN") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>

                       <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>3:00 PM - 4:00 PM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "MON") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "MON") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "TUE") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "TUE") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "WED") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "WED") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "THU") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "THU") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "FRI") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "FRI") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "SAT") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "SAT") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "SUN") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "SUN") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>
                        
                        <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>4:00 PM - 5:00 PM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "MON") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "MON") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "TUE") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "TUE") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "WED") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "WED") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "THU") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "THU") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "FRI") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "FRI") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "SAT") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "SAT") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "SUN") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "SUN") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>

                       <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>5:00 PM - 6:00 PM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "MON") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "MON") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "TUE") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "TUE") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "WED") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "WED") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "THU") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "THU") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "FRI") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "FRI") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "SAT") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "SAT") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "SUN") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "SUN") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>

                        <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>6:00 PM - 7:00 PM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "MON") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "MON") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "TUE") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "TUE") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "WED") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "WED") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "THU") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "THU") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "FRI") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "FRI") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "SAT") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "SAT") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "SUN") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "SUN") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>

                        <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>7:00 PM - 8:00 PM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "MON") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "MON") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "TUE") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "TUE") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "WED") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "WED") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "THU") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "THU") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "FRI") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "FRI") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "SAT") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "SAT") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "SUN") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "SUN") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>

                        <tr>
                            <td colSpan={2} className='m-0 p-0'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>8:00 PM - 9:00 PM</div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "MON") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "MON") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "TUE") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "TUE") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "WED") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "WED") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "THU") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "THU") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "FRI") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "FRI") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "SAT") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "SAT") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                            <td className='m-0 p-0'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "SUN") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "SUN") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </td>
                        </tr>

                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default FacultySchedule