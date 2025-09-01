import { useRef, useState, useEffect } from "react";
import { Box, Container, } from "@mui/material";
import EaristLogo from "../assets/EaristLogo.png";
import ForwardIcon from '@mui/icons-material/Forward';
import { FcPrint } from "react-icons/fc";

const AdmissionFormProcess = () => {

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");

  // do not alter
useEffect(() => {
  const storedUser = localStorage.getItem("email");
  const storedRole = localStorage.getItem("role");
  const storedID = localStorage.getItem("person_id");

  if (storedUser && storedRole && storedID) {
    setUser(storedUser);
    setUserRole(storedRole);
    setUserID(storedID);

    if (storedRole === "applicant" || storedRole === "registrar") {
      // ✅ allowed roles
    } else {
      window.location.href = "/login";
    }
  } else {
    window.location.href = "/login";
  }
}, []);



  const divToPrintRef = useRef();

  const printDiv = () => {
    const divToPrint = divToPrintRef.current;
    if (divToPrint) {
      const newWin = window.open('', 'Print-Window');
      newWin.document.open();
      newWin.document.write(`
      <html>
        <head>
          <title>Print</title>
       <style>
  @page {
    size: Legal;
    margin: 0;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 210mm;
    height: 297mm;
    font-family: Arial, sans-serif;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

.print-container {
  width: 100%;
  height: auto;
  padding: 10px 20px;
}

  .student-table {
    margin-top: 0 !important;
  }

  button {
    display: none;
  }

    .student-table {
    margin-top: -40px !important;
  }

  svg.MuiSvgIcon-root {
  margin-top: -53px;
    width: 70px !important;
    height: 70px !important;
  }
</style>

        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 100);">
          <div class="print-container">
            ${divToPrint.innerHTML}
          </div>
        </body>
      </html>
    `);
      newWin.document.close();
    } else {
      console.error("divToPrintRef is not set.");
    }
  };

  // 🔒 Disable right-click
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // 🔒 Block DevTools shortcuts silently
  document.addEventListener('keydown', (e) => {
    const isBlockedKey =
      e.key === 'F12' ||
      e.key === 'F11' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
      (e.ctrlKey && e.key === 'U');

    if (isBlockedKey) {
      e.preventDefault();
      e.stopPropagation();
    }
  });



  return (
    <Box sx={{ height: 'calc(95vh - 80px)', overflowY: 'auto', paddingRight: 1, backgroundColor: 'transparent' }}>
      <Container>
        <h1 style={{ fontSize: "40px", fontWeight: "bold", textAlign: "Left", color: "maroon", marginTop: "25px" }}> ADMISSION FORM (PROCESS)</h1>
        <hr style={{ border: "1px solid #ccc", width: "50%" }} />
        <button
          onClick={printDiv}
          style={{
            marginBottom: "1rem",
            padding: "10px 20px",
            border: "2px solid black",
            backgroundColor: "#f0f0f0",
            color: "black",
            borderRadius: "5px",
            marginTop: "20px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "background-color 0.3s, transform 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#d3d3d3")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
          onMouseDown={(e) => (e.target.style.transform = "scale(0.95)")}
          onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FcPrint size={20} />
            Print Admission Form
          </span>
        </button>

      </Container>


      <Container>



        <div ref={divToPrintRef}>

          <Container>

            <div style={{
              width: "8in", // matches table width assuming 8in for 40 columns
              maxWidth: "100%",
              margin: "0 auto", // center the content
              fontFamily: "Times New Roman",
              boxSizing: "border-box",
              padding: "10px 0", // reduced horizontal padding

            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap"
              }}>
                {/* Logo */}
                <div style={{ flexShrink: 0, marginRight: "20px" }}>
                  <img
                    src={EaristLogo}
                    alt="Earist Logo"
                    style={{ width: "120px", height: "120px", objectFit: "contain", marginLeft: "10px", marginTop: "-25px" }}
                  />
                </div>



                <div style={{
                  flexGrow: 1,
                  textAlign: "center",
                  fontSize: "12px",
                  fontFamily: "Arial",
                  letterSpacing: "5",
                  lineHeight: 1.4,
                  paddingTop: 0,

                  paddingBottom: 0
                }}>
                  <div style={{ marginLeft: "-155px", fontFamily: "Arial", fontSize: "12px", }}>Republic of the Philippines</div>
                  <div style={{ marginLeft: "-155px", fontFamily: "Arial", letterSpacing: '2px' }}><b>EULOGIO "AMANG" RODRIGUEZ </b></div>
                  <div style={{ marginLeft: "-155px", fontFamily: "Arial", letterSpacing: '2px' }}><b>INSTITUTE OF SCIENCE AND TECHNOLOGY</b></div>
                  <div style={{ marginLeft: "-155px", fontFamily: "Arial", fontSize: "12px" }}>Nagtahan, Sampaloc, Manila 1008</div>
                  <div style={{ marginLeft: "-155px", fontFamily: "Arial", letterSpacing: '1px', }}><b>OFFICE OF THE ADMISSION SERVICES</b></div>

                  <br />

                  <div style={{
                    fontSize: "21px",
                    fontFamily: "Arial",
                    fontWeight: "bold",
                    marginBottom: "5px",
                    marginTop: "0",
                    marginLeft: "-145px",
                    textAlign: "center",
                  }}>
                    Admission Form (Process)
                  </div>
                </div>
              </div>
            </div>
          </Container>
          <br />
          <br />
          <table
            className="student-table"
            style={{
              borderCollapse: "collapse",
              fontFamily: "Arial, Helvetica, sans-serif",
              width: "8in",
              margin: "0 auto",


              textAlign: "center",
              tableLayout: "fixed",
            }}
          >

            <tbody>
              <tr>

                <td
                  colSpan={40}
                  style={{
                    fontFamily: "Times New Roman",
                    fontSize: "16px",
                    paddingTop: "5px",
                    marginTop: 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <span style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>
                      Name of Student:
                    </span>
                    <span
                      style={{
                        flexGrow: 1,
                        borderBottom: "1px solid black",
                        display: "inline-block",
                        height: "1.2em", // gives visible height to the line
                      }}
                    >
                      {/* Full name goes here */}
                    </span>
                  </div>
                </td>

              </tr>


              <tr>
                <td colSpan={40} style={{ fontFamily: "Times New Roman", fontSize: "14px", paddingTop: "2px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "80%", marginLeft: "140px" }}>

                    <span>Last Name</span>
                    <span>Given Name</span>
                    <span>Middle Name</span>
                    <span>Middle Initial</span>

                  </div>
                </td>
              </tr>

              {/* Email & Applicant ID */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={20}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Email:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={20}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Applicant Id No.:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>

              {/* Permanent Address */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={40}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Permanent Address:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>

              {/* Cellphone No, Civil Status, Gender */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={13}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Cellphone No:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={13}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Civil Status:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={14}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Gender:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>

              {/* Date of Birth, Place of Birth, Age */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={13}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Date of Birth:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={14}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Place of Birth:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={13}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Age:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>

              {/* Please Check, Freshman, Transferee, Others */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={10}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Please Check (✓):</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={10}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Freshman:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={10}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Transferee:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={10}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Others:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>

              {/* Last School Attended */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={40}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Last School Attended:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>

              {/* Degree/Program & Major */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={20}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>DEGREE/PROGRAM APPLIED:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={20}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>MAJOR:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>



              <tr>
                <td colSpan="40" style={{ height: "20px" }}></td>
              </tr>

              <tr>

                <td
                  colSpan={40}
                  style={{
                    height: "0.2in",
                    fontSize: "72.5%",
                    color: "white", // This is just a fallback; overridden below
                  }}
                >
                  <div
                    style={{
                      color: "black",
                      fontFamily: "Times New Roman",
                      fontSize: "13px",
                      textAlign: "left",
                      display: "block",
                    }}
                  >
                    <b>{"\u00A0\u00A0"}APPLICATION PROCEDURE:</b>
                    {"\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}For Enrollment Officer: Please sign and put Remarks box if they done
                  </div>
                </td>

              </tr>

              <tr>
                <td colSpan={15} style={{ border: "1px solid black", textAlign: "left", padding: "8px", fontSize: "12px" }}>
                  <b> Guidance Office</b> (as per Schedule)
                  <br />
                  <b> Step 1:</b> ECAT Examination
                </td>
                <td
                  colSpan={5}
                  style={{

                    height: "50px",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >

                </td>

                <td colSpan={16} style={{ fontSize: "12px", fontFamily: "Arial", border: "1px solid black", padding: "8px", textAlign: "left" }}> <b>College Dean's Office</b>
                  <br />
                  <b>Step 2: </b>College Interview, Qualifying / Aptitude Test and College Approval

                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",
                    height: "35px",

                  }}
                >

                </td>
              </tr>
              <tr>
                <td colSpan={15} style={{ border: "1px solid black", textAlign: "center", padding: "8px", fontSize: "12px" }}>

                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",
                    height: "50px",

                  }}
                >

                  <ForwardIcon
                    sx={{
                      marginTop: "-53px",
                      fontSize: 70, // normal screen size
                      '@media print': {
                        fontSize: 14, // smaller print size
                        margin: 0,
                      }
                    }}
                  />

                </td>
                <td colSpan={5} style={{ border: "1px solid black", textAlign: "center", padding: "8px", fontSize: "12px" }}>

                </td>
                <td colSpan={6} style={{ border: "1px solid black", textAlign: "center", padding: "8px", fontSize: "12px" }}>

                </td>
                <td colSpan={5} style={{ border: "1px solid black", textAlign: "center", padding: "8px", fontSize: "12px" }}>

                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >

                  <ForwardIcon
                    sx={{
                      marginTop: "-53px",
                      fontSize: 70, // normal screen size
                      '@media print': {
                        fontSize: 14, // smaller print size
                        margin: 0,
                      }
                    }}
                  />

                </td>

              </tr>


              <tr>
                <td colSpan="40" style={{ height: "20px" }}></td>
              </tr>


              <tr>
                <td colSpan={10} style={{ border: "1px solid black", textAlign: "left", padding: "8px", fontSize: "12px", }}>
                  <b> Medical and Dental Service Office</b><br />   <b>Step 3:</b> Medical Examination
                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",

                  }}
                >

                </td>

                <td colSpan={11} style={{ fontSize: "12px", fontFamily: "Arial", border: "1px solid black", padding: "8px", textAlign: "left" }}> <b>Registrar's Office</b><br /><b>Step 4:</b> Submission of Original Cridentials

                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",

                  }}
                >

                </td>
                <td colSpan={10} style={{ fontSize: "12px", fontFamily: "Arial", border: "1px solid black", padding: "8px", textAlign: "left" }}> <b>College Dean's Office</b><br /><b>Step 5:</b>College Enrollment</td>
              </tr>

              <tr>
                <td colSpan={10} style={{ border: "1px solid black", textAlign: "center", padding: "8px", fontSize: "12px", }}>

                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >

                  <ForwardIcon
                    sx={{
                      marginTop: "-53px",
                      fontSize: 70, // normal screen size
                      '@media print': {
                        fontSize: 14, // smaller print size
                        margin: 0,
                      }
                    }}
                  />

                </td>


                <td colSpan={11} style={{ height: "50px", fontSize: "12px", fontFamily: "Arial", border: "1px solid black", padding: "8px", textAlign: "left" }}>

                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >

                  <ForwardIcon
                    sx={{
                      marginTop: "-53px",
                      fontSize: 70, // normal screen size
                      '@media print': {
                        fontSize: 14, // smaller print size
                        margin: 0,
                      }
                    }}
                  />

                </td>
                <td colSpan={10} style={{ fontSize: "12px", fontFamily: "Arial", border: "1px solid black", padding: "8px", textAlign: "left" }}> </td>
              </tr>

              <tr>
                <td colSpan="40" style={{ height: "20px" }}></td>
              </tr>


              <tr>
                <td colSpan={40} style={{ height: "0.2in", fontSize: "72.5%", border: "transparent", color: "white" }}>
                  <div style={{ fontWeight: "normal", fontSize: "14px", color: "black", fontFamily: "Times New Roman", textAlign: "right" }}>
                    Registrar's Copy
                  </div>
                </td>
              </tr>


            </tbody>

          </table>

          <hr
            style={{
              width: "100%",
              maxWidth: "770px",
              border: "none",
              borderTop: "1px dashed black",
              margin: "10px auto",
            }}
          />


          <Container>
            <div style={{
              width: "8in", // matches table width assuming 8in for 40 columns
              maxWidth: "100%",
              margin: "0 auto", // center the content
              fontFamily: "Times New Roman",
              boxSizing: "border-box",
              padding: "10px 0", // reduced horizontal padding

            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap"
              }}>
                {/* Logo */}
                <div style={{ flexShrink: 0, marginRight: "20px" }}>
                  <img
                    src={EaristLogo}
                    alt="Earist Logo"
                    style={{ width: "120px", height: "120px", objectFit: "contain", marginLeft: "10px", marginTop: "-25px" }}
                  />
                </div>



                <div style={{
                  flexGrow: 1,
                  textAlign: "center",
                  fontSize: "12px",
                  fontFamily: "Arial",
                  letterSpacing: "5",
                  lineHeight: 1.4,
                  paddingTop: 0,

                  paddingBottom: 0
                }}>
                  <div style={{ marginLeft: "-155px", fontFamily: "Arial", fontSize: "12px", }}>Republic of the Philippines</div>
                  <div style={{ marginLeft: "-155px", fontFamily: "Arial", letterSpacing: '2px' }}><b>EULOGIO "AMANG" RODRIGUEZ </b></div>
                  <div style={{ marginLeft: "-155px", fontFamily: "Arial", letterSpacing: '2px' }}><b>INSTITUTE OF SCIENCE AND TECHNOLOGY</b></div>
                  <div style={{ marginLeft: "-155px", fontFamily: "Arial", fontSize: "12px" }}>Nagtahan, Sampaloc, Manila 1008</div>
                  <div style={{ marginLeft: "-155px", fontFamily: "Arial", letterSpacing: '1px', }}><b>OFFICE OF THE ADMISSION SERVICES</b></div>
                  <br />

                  <div style={{
                    fontSize: "21px",
                    fontFamily: "Arial",
                    fontWeight: "bold",
                    marginBottom: "5px",
                    marginTop: "0",
                    marginLeft: "-145px",
                    textAlign: "center",
                  }}>
                    Admission Form (Process)
                  </div>
                </div>
              </div>
            </div>
          </Container>
          <br />
          <br />
          <table
            className="student-table"
            style={{
              borderCollapse: "collapse",
              fontFamily: "Arial, Helvetica, sans-serif",
              width: "8in",
              margin: "0 auto",


              textAlign: "center",
              tableLayout: "fixed",
            }}
          >

            <tbody>
              <tr>

                <td
                  colSpan={40}
                  style={{
                    fontFamily: "Times New Roman",
                    fontSize: "16px",
                    paddingTop: "5px",
                    marginTop: 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <span style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>
                      Name of Student:
                    </span>
                    <span
                      style={{
                        flexGrow: 1,
                        borderBottom: "1px solid black",
                        display: "inline-block",
                        height: "1.2em", // gives visible height to the line
                      }}
                    >
                      {/* Full name goes here */}
                    </span>
                  </div>
                </td>

              </tr>


              <tr>
                <td colSpan={40} style={{ fontFamily: "Times New Roman", fontSize: "14px", paddingTop: "2px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "80%", marginLeft: "140px" }}>

                    <span>Last Name</span>
                    <span>Given Name</span>
                    <span>Middle Name</span>
                    <span>Middle Initial</span>

                  </div>
                </td>
              </tr>

              {/* Email & Applicant ID */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={20}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Email:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={20}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Applicant Id No.:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>

              {/* Permanent Address */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={40}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Permanent Address:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>

              {/* Cellphone No, Civil Status, Gender */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={13}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Cellphone No:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={13}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Civil Status:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={14}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Gender:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>

              {/* Date of Birth, Place of Birth, Age */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={13}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Date of Birth:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={14}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Place of Birth:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={13}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Age:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>

              {/* Please Check, Freshman, Transferee, Others */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={10}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Please Check (✓):</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={10}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Freshman:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={10}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Transferee:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={10}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Others:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>

              {/* Last School Attended */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={40}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>Last School Attended:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>

              {/* Degree/Program & Major */}
              <tr style={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <td colSpan={20}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>DEGREE/PROGRAM APPLIED:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
                <td colSpan={20}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <label style={{ fontWeight: "bold", whiteSpace: "nowrap", marginRight: "10px" }}>MAJOR:</label>
                    <span style={{ flexGrow: 1, borderBottom: "1px solid black", height: "1.2em" }}></span>
                  </div>
                </td>
              </tr>



              <tr>
                <td colSpan="40" style={{ height: "20px" }}></td>
              </tr>

              <tr>

                <td
                  colSpan={40}
                  style={{
                    height: "0.2in",
                    fontSize: "72.5%",
                    color: "white", // This is just a fallback; overridden below
                  }}
                >
                  <div
                    style={{
                      color: "black",
                      fontFamily: "Times New Roman",
                      fontSize: "13px",
                      textAlign: "left",
                      display: "block",
                    }}
                  >
                    <b>{"\u00A0\u00A0"}APPLICATION PROCEDURE:</b>
                    {"\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}For Enrollment Officer: Please sign and put Remarks box if they done
                  </div>
                </td>

              </tr>


              <tr>
                <td colSpan={15} style={{ border: "1px solid black", textAlign: "left", padding: "8px", fontSize: "12px" }}>
                  <b> Guidance Office</b> (as per Schedule)
                  <br />
                  <b> Step 1:</b> ECAT Examination
                </td>
                <td
                  colSpan={5}
                  style={{

                    height: "50px",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >

                </td>

                <td colSpan={16} style={{ fontSize: "12px", fontFamily: "Arial", border: "1px solid black", padding: "8px", textAlign: "left" }}> <b>College Dean's Office</b>
                  <br />
                  <b>Step 2: </b>College Interview, Qualifying / Aptitude Test and College Approval

                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",
                    height: "35px",

                  }}
                >

                </td>
              </tr>
              <tr>
                <td colSpan={15} style={{ border: "1px solid black", textAlign: "center", padding: "8px", fontSize: "12px" }}>

                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",
                    height: "50px",

                  }}
                >

                  <ForwardIcon
                    sx={{
                      marginTop: "-53px",
                      fontSize: 70, // normal screen size
                      '@media print': {
                        fontSize: 14, // smaller print size
                        margin: 0,
                      }
                    }}
                  />

                </td>
                <td colSpan={5} style={{ border: "1px solid black", textAlign: "center", padding: "8px", fontSize: "12px" }}>

                </td>
                <td colSpan={6} style={{ border: "1px solid black", textAlign: "center", padding: "8px", fontSize: "12px" }}>

                </td>
                <td colSpan={5} style={{ border: "1px solid black", textAlign: "center", padding: "8px", fontSize: "12px" }}>

                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >

                  <ForwardIcon
                    sx={{
                      marginTop: "-53px",
                      fontSize: 70, // normal screen size
                      '@media print': {
                        fontSize: 14, // smaller print size
                        margin: 0,
                      }
                    }}
                  />

                </td>

              </tr>


              <tr>
                <td colSpan="40" style={{ height: "20px" }}></td>
              </tr>


              <tr>
                <td colSpan={10} style={{ border: "1px solid black", textAlign: "left", padding: "8px", fontSize: "12px", }}>
                  <b> Medical and Dental Service Office</b><br />   <b>Step 3:</b> Medical Examination
                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",

                  }}
                >

                </td>

                <td colSpan={11} style={{ fontSize: "12px", fontFamily: "Arial", border: "1px solid black", padding: "8px", textAlign: "left" }}> <b>Registrar's Office</b><br /><b>Step 4:</b> Submission of Original Cridentials

                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",

                  }}
                >

                </td>
                <td colSpan={10} style={{ fontSize: "12px", fontFamily: "Arial", border: "1px solid black", padding: "8px", textAlign: "left" }}> <b>College Dean's Office</b><br /><b>Step 5:</b>College Enrollment</td>
              </tr>

              <tr>
                <td colSpan={10} style={{ border: "1px solid black", textAlign: "center", padding: "8px", fontSize: "12px", }}>

                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >

                  <ForwardIcon
                    sx={{
                      marginTop: "-53px",
                      fontSize: 70, // normal screen size
                      '@media print': {
                        fontSize: 14, // smaller print size
                        margin: 0,
                      }
                    }}
                  />

                </td>


                <td colSpan={11} style={{ height: "50px", fontSize: "12px", fontFamily: "Arial", border: "1px solid black", padding: "8px", textAlign: "left" }}>

                </td>
                <td
                  colSpan={5}
                  style={{

                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >

                  <ForwardIcon
                    sx={{
                      marginTop: "-53px",
                      fontSize: 70, // normal screen size
                      '@media print': {
                        fontSize: 14, // smaller print size
                        margin: 0,
                      }
                    }}
                  />

                </td>
                <td colSpan={10} style={{ fontSize: "12px", fontFamily: "Arial", border: "1px solid black", padding: "8px", textAlign: "left" }}> </td>
              </tr>

              <tr>
                <td colSpan="40" style={{ height: "20px" }}></td>
              </tr>


              <tr>
                <td colSpan={40} style={{ height: "0.2in", fontSize: "72.5%", border: "transparent", color: "white" }}>
                  <div style={{ fontWeight: "normal", fontSize: "14px", color: "black", fontFamily: "Times New Roman", textAlign: "right" }}>
                    Dean's Copy
                  </div>
                </td>
              </tr>


            </tbody>

          </table>
        </div>
      </Container>

    </Box>
  );
};

export default AdmissionFormProcess;
