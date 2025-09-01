import React, {useState, useRef, useEffect} from 'react';
import axios from 'axios';
import EaristLogo from '../assets/EaristLogo.png';

const FacultyWorkload = () => {
    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [schedule, setSchedule] = useState([]);
    const [profData, setPerson] = useState({
        prof_id: "",
        fname: "",
        mname: "",
        lname: "",
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
          const res = await axios.get(`http://localhost:5000/get_prof_data/${id}`)
          const first = res.data[0];
    
          const profInfo = {
            prof_id: first.prof_id,
            fname: first.fname,
            mname: first.mname,
            lname: first.lname,
            profile_image: first.profile_image,
          };
    
          setPerson(profInfo);
        } catch (err) {
          setLoading(false);
          setMessage("Error Fetching Professor Personal Data");
        }
      }
    

    useEffect(() => {
        if (!profData.prof_id) return; 
        
        const fetchSchedule = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/professor-schedule/${profData.prof_id}`);
                console.log(response.data);
                setSchedule(response.data);
            } catch (err) {
                console.error('Error fetching professor schedule:', err);
            }
        };

        fetchSchedule();
    }, [profData.prof_id]);

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

    const divToPrintRef = useRef();

    const printDiv = () => {
        window.print();
    };
          
    return (
        <div className='overflow-y-scroll h-screen relative body'>
            <button onClick={printDiv} className='bg-maroon-500 w-[10rem] h-[3rem] text-[18px] mt-[1rem] text-white rounded fixed right-[2rem]'>
                Print
            </button>
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                        
                    }

                    .body{
                        margin-top: -22rem;
                        margin-left: -27rem;
                        overflow: visible !important;  /* show all content */
                        height: auto !important;       /* expand height */
                        max-height: none !important;   /* no max height limit */
                        
                    }
                    .print-container, .print-container * {
                        visibility: visible;
                    }
                    .print-container {
                        scale: 0.62;
                        position: absolute;
                        left:1.5rem;
                        top: 1rem;
                        width: 100%;
                        font-family: "Poppins", sans-serif;
                        margin: 0;
                        padding: 0;
                    }
                    button {
                        display: none !important; /* hide buttons */
                    }
                    .signature-container, .signature-content{
                        margin-left: 1rem;
                    }
                    .conforme{
                        font-size: 12.5px;
                        
                    }
                    .information{
                        width: 160rem;
                    }
                    .designation{
                        width: 160rem;
                    }

                    .conforme-title{
                        font-size: 11.65px;
                        margin-left: 3px;
                    }
                    .conforme-cont{
                        width: 29rem;
                    }
                    
                    @page {
                        size: A4;
                        margin: 0;
                    }

                    .line{
                        min-width: 61rem;
                    }
                }
                `}
            </style>
            <div className='min-h-[10rem] mb-[16rem] print-container' ref={divToPrintRef}>
                <div className='mt-[2rem]'>
                    <div>
                        <div className='flex align-center information'>
                            <div className='w-[8rem] '>
                                <img src={EaristLogo} alt="" srcSet="" className='max-w-[5rem] earist-logo'/>
                            </div>
                            <div className='w-[48rem] prof-details mt-[0.8rem]'>
                                <p className='text-[11px] employee-number'>Employee No: 2013-4507</p> {/* EmployeeNumber */}
                                <p className='text-[18px] bold employee-name'>{profData.fname} {profData.mname} {profData.lname}</p>
                                <p className='text-[11px] employee-status'>Status Rank: Insdivuctor I</p>
                            </div>
                            <div>
                                <img src={`http://localhost:5000/uploads/${profData.profile_image}`} className='w-[5rem]'/>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='mt-[1rem]'>
                    <div>
                        <div className='flex designation'>
                            <div className='bg-gray-300 border border-black min-w-[13rem] border-r-0 h-[3rem] flex items-center justify-center designation-title' >
                                <p className='text-[14px] font-bold tracking-[-1px]'>DESIGNATION</p>
                            </div>
                            <div className='w-[48rem] border border-black flex items-center justify-center designation-details'>
                                <p className='text-[11px]'>Chief, INFORMATION SYSTEM</p>   
                            </div>
                        </div>
                    </div>
                </div>
                <div className='mt-[1rem]'>
                    <div className='flex educ-con'>
                        <div>
                            <div className='education-bg bg-gray-300 border border-black w-[13rem] h-full flex items-center justify-center'>
                                <p className='text-[14px] font-bold tracking-[-1px]'>EDUCATIONAL BACKGROUND</p>
                            </div>
                        </div>
                        <div className='flex flex-col'>
                            <div className='border border-black border-b-0 border-l-0 w-[48rem] h-[2rem] p-0 flex  educ-details'>
                                <div className='educ-title text-[12px] tracking-[-1px] border border-black m-0 px-1 border-b-0 border-l-0 border-t-0 min-w-[8rem] h-full flex items-center'>BACHELOR'S DEGREE</div>
                                <p className='educ-content text-[12px] h-full flex items-center ml-1' >BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY</p>
                            </div>
                            <div className='border border-black border-b-0 border-l-0 w-[48rem] h-[2rem] p-0 flex  educ-details'>
                                <div className='educ-title text-[12px] tracking-[-1px] border border-black m-0 px-1 border-b-0 border-l-0 border-t-0 min-w-[8rem] h-full flex items-center'>MASTER'S DEGREE</div>
                                <p className='educ-content text-[12px] h-full flex items-center ml-1' >MASTER OF INFORMATION TECHNOLOGY (CITY OF MALABON)</p>
                            </div>
                            <div className='border border-black border-b-0 border-l-0 w-[48rem] h-[2rem] p-0 flex  educ-details'>
                                <div className='educ-title text-[12px] tracking-[-1px] border border-black m-0 px-1 border-b-0 border-l-0 border-t-0 min-w-[8rem] h-full flex items-center'>DOCTORAL'S DEGREE</div>
                                <p className='educ-content text-[12px]  h-full flex items-center ml-1 MIN-' >DOCTOR OF INFORMATION TECHNOLOGY (AMA, ongoing)</p>
                            </div>
                            <div className='border border-black border-l-0 w-[48rem] h-[2rem] p-0 flex educ-details'>
                                <div className='educ-title text-[12px] tracking-[-1px] border border-black m-0 px-1 border-b-0 border-l-0 border-t-0 min-w-[8rem] h-full flex items-center'>SPECIAL TRAINING</div>
                                <p className='educ-content text-[12px] h-full flex items-center ml-1' ></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='mt-[0.7rem]'>
                    <div>
                        <div className=''>
                            <div className='flex justify-center w-[63rem] text-[38px] font-bold'>FACULTY ASSIGNMENT</div>
                            <div className='flex justify-center w-[63rem] text-[18px] tracking-[-0.5px] mt-[-0.5rem]'>Second Semester: <p className='ml-2'>SY, 2024-2025</p></div>
                        </div>
                    </div>
                </div>
                <div className='mt-[0.7rem]'>
                    <div>
                        <div className='flex align-center'>
                            <div className='min-w-[6.5rem] min-h-[2.2rem] flex items-center justify-center border border-black text-[14px]'>TIME</div>
                            <div className='p-0 m-0'>
                                <div className='min-w-[6.6rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>DAY</div>
                                <p className='min-w-[6.6rem] text-center border border-black border-l-0 text-[11.5px] font-bold mt-[-3px]'>Official Time</p>
                            </div>
                            <div className='p-0 m-0'>
                                <div className='min-w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>MONDAY</div>
                                <p className='min-w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
                            </div>
                            <div className='p-0 m-0'>
                                <div className='min-w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>TUESDAY</div>
                                <p className='min-w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
                            </div>
                            <div className='p-0 m-0'>
                                <div className='min-w-[7rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>WEDNESDAY</div>
                                <p className='min-w-[7rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
                            </div>
                            <div className='p-0 m-0'>
                                <div className='min-w-[6.9rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>THURSDAY</div>
                                <p className='min-w-[6.9rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
                            </div>
                            <div className='p-0 m-0'>
                                <div className='min-w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>FRIDAY</div>
                                <p className='min-w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
                            </div>
                            <div className='p-0 m-0'>
                                <div className='min-w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>SATUDAY</div>
                                <p className='min-w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
                            </div>
                            <div className='p-0 m-0'>
                                <div className='min-w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>SUNDAY</div>
                                <p className='min-w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col mt-[-0.1px]'>
                        <div className='flex w-full'>
                            <div className='m-0 p-0'>
                                <div className='min-w-[13.1rem] h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>07:00 AM - 08:00 AM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={` h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "MON") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "MON") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "TUE") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "TUE") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "WED") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "WED") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "THU") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "THU") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "FRI") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "FRI") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "SAT") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "SAT") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 AM", "8:00 AM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "SUN") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 AM", "8:00 AM", "SUN") && hasAdjacentSchedule("7:00 AM", "8:00 AM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>
                        
                        <div className='flex w-full'>
                            <div className='m-0 p-0 min-w-[13.1rem]'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>08:00 AM - 09:00 AM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 AM", "9:00 AM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "MON") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "MON") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 AM", "9:00 AM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "TUE") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "TUE") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 AM", "9:00 AM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "WED") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "WED") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 AM", "9:00 AM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "THU") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "THU") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 AM", "9:00 AM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "FRI") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "FRI") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 AM", "9:00 AM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "SAT") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "SAT") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 AM", "9:00 AM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "SUN") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 AM", "9:00 AM", "SUN") && hasAdjacentSchedule("8:00 AM", "9:00 AM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>

                        <div className='flex w-full'>
                            <div className='m-0 p-0 min-w-[13.1rem]'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>09:00 AM - 10:00 AM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "MON") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "MON") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "TUE") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "TUE") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "WED") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "WED") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "THU") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "THU") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "FRI") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "FRI") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "SAT") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "SAT") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("9:00 AM", "10:00 AM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "SUN") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("9:00 AM", "10:00 AM", "SUN") && hasAdjacentSchedule("9:00 AM", "10:00 AM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>

                        <div className='flex w-full'>
                            <div className='m-0 p-0 min-w-[13.1rem]'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>10:00 AM - 11:00 AM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "MON") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "MON") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "TUE") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "TUE") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "WED") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "WED") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "THU") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "THU") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "FRI") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "FRI") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "SAT") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "SAT") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("10:00 AM", "11:00 AM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "SUN") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("10:00 AM", "11:00 AM", "SUN") && hasAdjacentSchedule("10:00 AM", "11:00 AM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>

                        <div className='flex w-full'>
                            <div className='m-0 p-0 min-w-[13.1rem]'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>11:00 AM - 12:00 PM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "MON") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "MON") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "TUE") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "TUE") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "WED") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "WED") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "THU") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "THU") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "FRI") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "FRI") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "SAT") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "SAT") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("11:00 AM", "12:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "SUN") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("11:00 AM", "12:00 PM", "SUN") && hasAdjacentSchedule("11:00 AM", "12:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>

                        <div className='flex w-full'>
                            <div  className='m-0 p-0 min-w-[13.1rem]'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>12:00 PM - 01:00 PM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "MON") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "MON") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "TUE") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "TUE") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "WED") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "WED") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "THU") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "THU") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "FRI") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "FRI") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "SAT") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "SAT") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("12:00 PM", "1:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "SUN") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("12:00 PM", "1:00 PM", "SUN") && hasAdjacentSchedule("12:00 PM", "1:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>

                        <div className='flex w-full'>
                            <div className='m-0 p-0 min-w-[13.1rem]'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>01:00 PM - 02:00 PM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "MON") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "MON") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "TUE") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "TUE") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "WED") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "WED") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "THU") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "THU") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "FRI") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "FRI") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "SAT") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "SAT") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("1:00 PM", "2:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "SUN") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("1:00 PM", "2:00 PM", "SUN") && hasAdjacentSchedule("1:00 PM", "2:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>

                        <div className='flex w-full'>
                            <div  className='m-0 p-0 min-w-[13.1rem]'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>02:00 PM - 03:00 PM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "MON") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "MON") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "TUE") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "TUE") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "WED") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "WED") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "THU") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "THU") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "FRI") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "FRI") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "SAT") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "SAT") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("2:00 PM", "3:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "SUN") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("2:00 PM", "3:00 PM", "SUN") && hasAdjacentSchedule("2:00 PM", "3:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>

                       <div className='flex w-full'>
                            <div  className='m-0 p-0 min-w-[13.1rem]'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>03:00 PM - 04:00 PM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "MON") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "MON") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "TUE") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "TUE") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "WED") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "WED") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "THU") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "THU") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "FRI") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "FRI") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "SAT") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "SAT") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("3:00 PM", "4:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "SUN") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("3:00 PM", "4:00 PM", "SUN") && hasAdjacentSchedule("3:00 PM", "4:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>
                        
                        <div className='flex w-full'>
                            <div  className='m-0 p-0 min-w-[13.1rem]'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>04:00 PM - 05:00 PM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "MON") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "MON") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "TUE") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "TUE") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "WED") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "WED") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "THU") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "THU") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "FRI") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "FRI") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "SAT") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "SAT") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("4:00 PM", "5:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "SUN") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("4:00 PM", "5:00 PM", "SUN") && hasAdjacentSchedule("4:00 PM", "5:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>

                       <div className='flex w-full'>
                            <div  className='m-0 p-0 min-w-[13.1rem]'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>05:00 PM - 06:00 PM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "MON") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "MON") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "TUE") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "TUE") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "WED") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "WED") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "THU") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "THU") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "FRI") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "FRI") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "SAT") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "SAT") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("5:00 PM", "6:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "SUN") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("5:00 PM", "6:00 PM", "SUN") && hasAdjacentSchedule("5:00 PM", "6:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>

                        <div className='flex w-full'>
                            <div  className='m-0 p-0 min-w-[13.1rem]'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>06:00 PM - 07:00 PM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "MON") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "MON") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "TUE") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "TUE") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "WED") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "WED") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "THU") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "THU") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "FRI") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "FRI") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "SAT") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "SAT") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("6:00 PM", "7:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "SUN") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("6:00 PM", "7:00 PM", "SUN") && hasAdjacentSchedule("6:00 PM", "7:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>

                        <div className='flex w-full'>
                            <div  className='m-0 p-0 min-w-[13.1rem]'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>07:00 PM - 08:00 PM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "MON") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "MON") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "TUE") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "TUE") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "WED") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "WED") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "THU") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "THU") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "FRI") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "FRI") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "SAT") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "SAT") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("7:00 PM", "8:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "SUN") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("7:00 PM", "8:00 PM", "SUN") && hasAdjacentSchedule("7:00 PM", "8:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>

                        <div className='flex w-full'>
                            <div  className='m-0 p-0 min-w-[13.1rem]'>
                                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>08:00 PM - 09:00 PM</div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "MON") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "MON") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "MON", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "MON") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "MON", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "TUE") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "TUE") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "TUE", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "TUE") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "TUE", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[7rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "WED") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "WED") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "WED", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "WED") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "WED", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.9rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "THU") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "THU") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "THU", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "THU") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "THU", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "FRI") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "FRI") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "FRI", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "FRI") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "FRI", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "SAT") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "SAT") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "SAT", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "SAT") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "SAT", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                            <div className='m-0 p-0 min-w-[6.8rem]'>
                                <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  ${isTimeInSchedule("8:00 PM", "9:00 PM", "SUN") ? 'bg-yellow-300' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "SUN") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "SUN", "top") ? 'border-t-0' : ''} ${isTimeInSchedule("8:00 PM", "9:00 PM", "SUN") && hasAdjacentSchedule("8:00 PM", "9:00 PM", "SUN", "bottom") ? 'border-b-0' : ''}`}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='mt-[1rem]'>
                    <div>
                        <div className='max-w-[61rem]'>
                            <div className='bg-black text-white text-[12px] font-[500] tracking-[0.5px] h-[1.8rem] min-w-[61rem] text-center'>SUMMARY</div>
                        </div>
                    </div>
                    <div className='flex'>
                        <div className='border border-black max-w-[37rem]'>
                            <div className='flex flex-col'>
                                <div className='mmin-w-[37rem] text-center text-[11px] font-[500]'>DAILY WORKLOAD DISTRIBUTION</div>
                                <div className='flex'>
                                    <div className='border border border-black border-l-0 border-b-0 min-w-[11rem] text-[11px] text-center'>DAY</div>
                                    <div className='border border border-black border-l-0 border-b-0  text-[11px] px-[0.7rem] min-w-[3.2rem]'>MON</div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.1rem]'>TUE</div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.3rem]'>WED</div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.08rem]'>THU</div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[2.8rem]'>FRI</div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.20rem]'>SAT</div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.3rem]'>SUN</div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] border-r-0 px-[0.9rem] min-w-[3.9rem]'>TOTAL</div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                    <div className='border border border-black border-l-0 border-b-0 min-w-[11rem] text-[10px]'>REGULAR TEACHING LOAD</div>
                                    <div className='border border border-black border-l-0 border-b-0  text-[11px] px-[0.7rem] min-w-[3.2rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.1rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.08rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[2.8rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.20rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] border-r-0 px-[0.9rem] min-w-[3.9rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                    <div className='border border border-black border-l-0 border-b-0 min-w-[11rem] text-[10px]'>OVERLOAD (OL)</div>
                                    <div className='border border border-black border-l-0 border-b-0  text-[11px] px-[0.7rem] min-w-[3.2rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.1rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.08rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[2.8rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.20rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] border-r-0 px-[0.9rem] min-w-[3.9rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                    <div className='border border border-black border-l-0 border-b-0 min-w-[11rem] text-[10px]'>EMERGENCY LOAD (EL)</div>
                                    <div className='border border border-black border-l-0 border-b-0  text-[11px] px-[0.7rem] min-w-[3.2rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.1rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.08rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[2.8rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.20rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] border-r-0 px-[0.9rem] min-w-[3.9rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                    <div className='border border border-black border-l-0 border-b-0 min-w-[11rem] text-[9.5px]'>TEMPORARY SUBSTITUTION (TS)</div>
                                    <div className='border border border-black border-l-0 border-b-0  text-[11px] px-[0.7rem] min-w-[3.2rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.1rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.08rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[2.8rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.20rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] border-r-0 px-[0.9rem] min-w-[3.9rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                    <div className='border border border-black border-l-0 border-b-0 min-w-[11rem] text-[10px]'>DESIGNATION</div>
                                    <div className='border border border-black border-l-0 border-b-0  text-[11px] px-[0.7rem] min-w-[3.2rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.1rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.08rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[2.8rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.20rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] border-r-0 px-[0.9rem] min-w-[3.9rem]'></div>
                                </div>
                            </div>
                            <div className='flex'>
                                <div className='max-w-[4.3rem]'>
                                    <div className='min-w-[4.3rem] border border-black border-l-0 border-b-0 text-[10px] text-center flex items-center h-full px-[0.4rem]'>OTHER <br /> FUNCTIONS</div>
                                </div>
                                <div>
                                    <div className='flex'>
                                        <div className='border border border-black border-l-0 border-b-0 min-w-[6.7rem] text-[9px] text-center font-[600] min-h-[1rem]'><i>Research</i></div>
                                        <div className='border border border-black border-l-0 border-b-0  text-[11px] px-[0.7rem] min-w-[3.2rem]'></div>
                                        <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.1rem]'></div>
                                        <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.3rem]'></div>
                                        <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.08rem]'></div>
                                        <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[2.8rem]'></div>
                                        <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.20rem]'></div>
                                        <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.3rem]'></div>
                                        <div className='border border border-black border-l-0 border-b-0 text-[11px] border-r-0 px-[0.9rem] min-w-[3.9rem]'></div>
                                        </div>
                                    <div className='flex'>
                                        <div className='border border border-black border-l-0 border-b-0 min-w-[6.7rem] text-[9px] text-center font-[600] min-h-[1rem]'><i>Extension</i></div>
                                        <div className='border border border-black border-l-0 border-b-0  text-[11px] px-[0.7rem] min-w-[3.2rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.1rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.08rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[2.8rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.20rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] border-r-0 px-[0.9rem] min-w-[3.9rem]'></div>
                                    </div>
                                    <div className='flex'>
                                        <div className='border border border-black border-l-0 border-b-0 min-w-[6.7rem] text-[9px] text-center font-[600] min-h-[1rem]'><i>Production</i></div>
                                        <div className='border border border-black border-l-0 border-b-0  text-[11px] px-[0.7rem] min-w-[3.2rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.1rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.08rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[2.8rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.20rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] border-r-0 px-[0.9rem] min-w-[3.9rem]'></div>
                                    </div>
                                    <div className='flex'>
                                        <div className='border border border-black border-l-0 border-b-0 min-w-[6.7rem] text-[9px] text-center min-h-[1rem] font-[600]'><i>Accreditation</i></div>
                                        <div className='border border border-black border-l-0 border-b-0  text-[11px] px-[0.7rem] min-w-[3.2rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.1rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.08rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[2.8rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.20rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] border-r-0 px-[0.9rem] min-w-[3.9rem]'></div>
                                    </div>
                                </div>

                            </div>
                            
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                    <div className='border border border-black border-l-0 border-b-0 min-w-[11rem] text-[9px] flex items-center justify-center min-h-[1rem] font-[600]'><i className='mt-[0.2px]'>Consultation</i></div>
                                    <div className='border border border-black border-l-0 border-b-0  text-[11px] px-[0.7rem] min-w-[3.2rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.1rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.08rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[2.8rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.20rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] border-r-0 px-[0.9rem] min-w-[3.9rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                    <div className='border border border-black border-l-0 border-b-0 min-w-[11rem] text-[8px] flex items-center justify-center min-h-[1rem] font-[400]'><i className='mt-[2px]'>Lesson Preparation ( Off-Campus )</i></div>
                                    <div className='border border border-black border-l-0 border-b-0  text-[11px] px-[0.7rem] min-w-[3.2rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.1rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.08rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[2.8rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.20rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] border-r-0 px-[0.9rem] min-w-[3.9rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                            <div className='flex'>
                                    <div className='border border border-black border-l-0 border-b-0 min-w-[11rem] text-[8px] flex items-center justify-center min-h-[1rem] font-[400]'><i className='mt-[2px]'>Total</i></div>
                                    <div className='border border border-black border-l-0 border-b-0  text-[11px] px-[0.7rem] min-w-[3.2rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.1rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px]  px-[0.9rem] min-w-[3.08rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[2.8rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.20rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] px-[0.9rem] min-w-[3.3rem]'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[11px] border-r-0 px-[0.9rem] min-w-[3.9rem]'></div>
                                </div>
                            </div>
                        </div>
                        <div className='border border-black border-l-0 max-w-[24rem]'>
                            <div>
                                <div className='min-w-[27rem] text-center text-[11px] font-[500]'>EXTRA TEACHING LOADS FOR HONORARIUM</div>
                            </div> 
                            <div className='flex max-h-[2.15rem]'> 
                                <div className='border border-black border-l-0 min-h-[2.15rem] flex items-center justify-center w-[9rem]'>
                                    <span className='text-[10px] tracking-[-1px]'>Teaching Assignment</span>
                                </div>
                                <div className='border border-black border-l-0 min-h-[2.15rem] flex items-center justify-center w-[2rem]'>
                                    <span className='text-[10px] tracking-[-1px]'>Units</span>
                                </div>
                                <div className='border border-black border-l-0 min-h-[2.15rem] flex items-center justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'>Load Type</span>
                                </div>
                                <div className='border border-black border-l-0 min-h-[2.15rem] flex items-center justify-center w-[6rem]'>
                                    <span className='text-[10px] tracking-[-1px]'>Class</span>
                                </div>
                                <div className='border border-black border-l-0 min-h-[2.15rem] flex items-center border-r-0 justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'>Class Type</span>
                                </div>
                            </div>
                            <div className='flex max-h-[2rem]'> 
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[9rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[2rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[6rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center border-r-0 justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                            </div>  
                            <div className='flex max-h-[2rem]'> 
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[9rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[2rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[6rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center border-r-0 justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                            </div> 
                            <div className='flex max-h-[2rem]'> 
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[9rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[2rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[6rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center border-r-0 justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                            </div> 
                            <div className='flex max-h-[2rem]'> 
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[9rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[2rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[6rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center border-r-0 justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                            </div> 
                            <div className='flex max-h-[2rem]'> 
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[9rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[2rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[6rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center border-r-0 justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                            </div> 
                            <div>
                                <div>
                                <div className='border border border-black border-l-0 border-t-0  border-b-0 max-w-[8.97rem] text-[10px] text-center'>TOTAL</div>
                                <div className='border border border-black border-l-0 border-b-0  border-t-0 text-[10px] min-w-[2rem] text-center'></div>
                                </div>
                            </div> 
                        </div>
                    </div>
                    <div>
                        <div>
                            <div className='bg-black min-h-[1.2rem] max-w-[61rem] line'></div>
                        </div>
                    </div>
                    <div className='flex'>
                        <div className='border border-black'>
                            <div className='flex flex-col'>
                                <div className='w-[37rem] text-center text-[11px] font-[500]'>FTE CALCULATOR</div>
                                <div className='flex min-h-[1.05rem]'>
                                <div className='border border border-black border-l-0 border-b-0 min-w-[19.5rem] text-[10px] text-center'>Regular Teaching Assignments</div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] text-center'>Units</div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] text-center'>Class</div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] text-center'>Class Type</div>
                                <div className='border border border-black border-l-0 border-b-0 text-[8px] tracking-[-1px] w-[3rem] flex items-center'>No. of Students</div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] border-r-0 text-center w-[3.1rem]'>FTE</div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                <div className='border border border-black border-l-0 border-b-0 w-[19.5rem] text-[10px] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[8px] tracking-[-1px] h-[1rem] w-[3.0rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] border-r-0 text-center h-[1rem] w-[3.1rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                <div className='border border border-black border-l-0 border-b-0 w-[19.5rem] text-[10px] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[8px] tracking-[-1px] h-[1rem] w-[3rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] border-r-0 text-center h-[1rem] w-[3.1rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                <div className='border border border-black border-l-0 border-b-0 w-[19.5rem] text-[10px] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[8px] tracking-[-1px] h-[1rem] w-[3rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] border-r-0 text-center h-[1rem] w-[3.1rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                <div className='border border border-black border-l-0 border-b-0 w-[19.5rem] text-[10px] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[8px] tracking-[-1px] h-[1rem] w-[3rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] border-r-0 text-center h-[1rem] w-[3.1rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                    <div className='border border border-black border-l-0 border-b-0 w-[19.5rem] text-[10px] h-[1rem] text-center'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[8px] tracking-[-1px] h-[1rem] w-[3rem] text-center'></div>
                                    <div className='border border border-black border-l-0 border-b-0 text-[10px] border-r-0 text-center h-[1rem] w-[3.1rem]'></div>
                                </div>
                            </div>
                            
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                <div className='border border border-black border-l-0 border-b-0 w-[19.5rem] text-[10px] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[8px] tracking-[-1px] h-[1rem] w-[3rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] border-r-0 text-center h-[1rem] w-[3.1rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                <div className='border border border-black border-l-0 border-b-0 w-[19.5rem] text-[10px] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[8px] tracking-[-1px] h-[1rem] w-[3rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] border-r-0 text-center h-[1rem] w-[3.1rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                <div className='border border border-black border-l-0 border-b-0 w-[19.5rem] text-[10px] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[8px] tracking-[-1px] h-[1rem] w-[3rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] border-r-0 text-center h-[1rem] w-[3.1rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                <div className='border border border-black border-l-0 border-b-0 w-[19.5rem] text-[10px] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[8px] tracking-[-1px] h-[1rem] w-[3rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] border-r-0 text-center h-[1rem] w-[3.1rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                <div className='border border border-black border-l-0 border-b-0 w-[19.5rem] text-[10px] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[8px] tracking-[-1px] h-[1rem] w-[3rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] border-r-0 text-center h-[1rem] w-[3.1rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                <div className='border border border-black border-l-0 border-b-0 w-[19.5rem] text-[10px] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] w-[3.8rem] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[8px] tracking-[-1px] h-[1rem] w-[3rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] border-r-0 text-center h-[1rem] w-[3.1rem]'></div>
                                </div>
                            </div>
                            <div className='flex flex-col'>
                                
                                <div className='flex'>
                                <div className='border border border-black border-l-0 border-b-0 min-w-[19.5rem] text-[10px] h-[1rem] text-center'></div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] min-w-[14.4rem] h-[1rem] text-center'>Total FTE</div>
                                <div className='border border border-black border-l-0 border-b-0 text-[10px] border-r-0 text-center h-[1rem] w-[3.1rem]'></div>
                                </div>
                            </div>
                        </div>
                        <div className='border border-black border-l-0 max-w-[23.9rem]'>
                            <div>
                                <div className='min-w-[27rem] text-center text-[11px] font-[500]'>EXTRA TEACHING LOADS FOR SERVICE CREDIT</div>
                            </div> 
                            <div className='flex max-h-[2.15rem]'> 
                                <div className='border border-black border-l-0 min-h-[2.15rem] flex items-center justify-center w-[9rem]'>
                                    <span className='text-[10px] tracking-[-1px]'>Teaching Assignment</span>
                                </div>
                                <div className='border border-black border-l-0 min-h-[2.15rem] flex items-center justify-center w-[2rem]'>
                                    <span className='text-[10px] tracking-[-1px]'>Units</span>
                                </div>
                                <div className='border border-black border-l-0 min-h-[2.15rem] flex items-center justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'>Load Type</span>
                                </div>
                                <div className='border border-black border-l-0 min-h-[2.15rem] flex items-center justify-center w-[6rem]'>
                                    <span className='text-[10px] tracking-[-1px]'>Class</span>
                                </div>
                                <div className='border border-black border-l-0 min-h-[2.15rem] flex items-center border-r-0 justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'>Class Type</span>
                                </div>
                            </div>
                            <div className='flex max-h-[2rem]'> 
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[9rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[2rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[6rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center border-r-0 justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                            </div>  
                            <div className='flex max-h-[2rem]'> 
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[9rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[2rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[6rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center border-r-0 justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                            </div> 
                            <div className='flex max-h-[2rem]'> 
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[9rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[2rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[6rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center border-r-0 justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                            </div> 
                            <div className='flex max-h-[2rem]'> 
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[9rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[2rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[6rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center border-r-0 justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                            </div> 
                            <div className='flex max-h-[2rem]'> 
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[9rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[2rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center justify-center w-[6rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                                <div className='border border-black border-t-0 border-l-0 min-h-[2rem] flex items-center border-r-0 justify-center w-[3.5rem]'>
                                    <span className='text-[10px] tracking-[-1px]'></span>
                                </div>
                            </div> 
                            <div>
                                <div>
                                <div className='border border border-black border-l-0 border-t-0  border-b-0 max-w-[8.97rem] text-[10px] text-center'>TOTAL</div>
                                <div className='border border border-black border-l-0 border-b-0  border-t-0 text-[10px] min-w-[2rem] text-center'></div>
                                </div>
                            </div> 
                        </div>
                    </div>
                    <div>
                        <div>
                            <div className='bg-black min-h-[1.2rem] max-w-[61rem] line'></div>
                        </div>
                    </div>
                </div>

                <div className='mt-[1rem]'>
                    <div className='flex'>
                        <div className='border border-black flex flex-col'>
                            <div className='w-[27rem] text-[11px] p-[0.2rem] font-[600] conforme-cont'>CONFORME:</div>
                            <div className='mt-[0.6rem]'></div>
                            <div className='text-[10.5px] tracking-[-1px] font-[600] conforme-title'>
                                I fully understand the extent of my roles and responsibilities in relationto my assignment as a <br/>
                                faculty member and therefore COMMIT myself to:
                            </div>
                            <div  className='text-[10.5px] tracking-[-1px] font-[600] conforme'>
                                (A) be punctual and be available in the institute during official working hours; <br />
                                (B) conduct assigned classes and other functions at the scheduled times; <br />
                                (C) evaluate and record students performance in an objective and fair manner; and, <br />
                                (D) submit all required reports on time.
                            </div>
                            <div className='mt-[0.6rem]'></div>
                            <div className='flex p-0 m-0'>
                                <div className='bg-black text-white p-[0.2rem] flex items-center justify-center w-[13.5rem]'>
                                    <span className='text-[14px] font-[500]'>EARIST-QSF-INST-015</span>
                                </div>
                                <div className='flex flex-col items-center w-[13.5rem]'>
                                    <span className='text-[11px] font-[500] underline'>Mr. DHANI SAN JOSE</span>
                                    <span className='mt-[-2px]  text-[10px]'>Faculty Member</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className='flex signature-container'>
                                <div className='w-[13.5rem] h-[6rem] '>
                                    <div><i className='text-[11.5px] font-[500] ml-[3px]'>Prepared By:</i></div>
                                    <div className='flex flex-col mt-[2rem] w-full items-center'>
                                        <span className='text-[12px] '>Prof. HAZEL F. ANUNCIO</span><br />
                                        <span className='text-[11px] mt-[-1.7rem] font-[500] tracking-[-1px]'>Information Technology Department Head</span>
                                    </div>
                                </div>
                                <div className='w-[19.5rem] h-[6rem] signature-content' >
                                    <div><i className='text-[11.5px] font-[500] ml-[3px]'>Certified Corrected By:</i></div>
                                    <div className='flex flex-col mt-[2rem] w-full items-center'>
                                        <span className='text-[12px] '>DR. JESUS PANGUIGAN</span><br />
                                        <span className='text-[11px] mt-[-1.7rem] font-[500] tracking-[-1px]'>Dean, CCS</span>
                                    </div>
                                </div>
                            </div>
                            <div className='flex signature-container'>
                                <div className='w-[13.5rem] h-[6rem] '>
                                    <div><i className='text-[11.5px] font-[500] ml-[3px]'>Recommending Approval:</i></div>
                                    <div className='flex flex-col mt-[2rem] w-full items-center'>
                                        <span className='text-[12px] '>DR. ERIC C. MENDOZA</span><br />
                                        <span className='text-[11px] mt-[-1.7rem] font-[500] tracking-[-1px]'>VPAA</span>
                                    </div>
                                </div>
                                <div className='w-[19.5rem] h-[6rem] signature-content'>
                                    <div><i className='text-[11.5px] font-[500] ml-[3px]'>Approved:</i></div>
                                    <div className='flex flex-col mt-[2rem] w-full items-center'>
                                        <span className='text-[12px] '>Engr. ROGELIO T. MAMARADLO, Edb</span><br />
                                        <span className='text-[11px] mt-[-1.7rem] font-[500] tracking-[-1px]'>President</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FacultyWorkload;
