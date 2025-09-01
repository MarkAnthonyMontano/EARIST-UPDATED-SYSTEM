const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const webtoken = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyparser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

require("dotenv").config();
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const XLSX = require("xlsx");
const io = new Server(http, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});


//MIDDLEWARE
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",   // ✅ Explicitly allow Vite dev server
  credentials: true                  // ✅ Allow credentials (cookies, auth)
}));

app.use(bodyparser.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


const uploadPath = path.join(__dirname, "uploads");

app.use("/uploads", express.static(uploadPath));

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: async function (req, file, cb) {
    const person_id = req.body.person_id;
    const requirements_id = req.body.requirements_id;

    // Get requirement label from DB
    const [reqRows] = await db.query("SELECT description FROM requirements_table WHERE id = ?", [requirements_id]);
    const description = reqRows[0]?.description || "Unknown";
    const shortLabel = getShortLabel(description);

    // Get applicant_number using person_id
    const [applicantRows] = await db.query("SELECT applicant_number FROM applicant_numbering_table WHERE person_id = ?", [person_id]);
    const applicant_number = applicantRows[0]?.applicant_number || `PID${person_id}`;

    const timestamp = new Date().getFullYear();
    const ext = path.extname(file.originalname);

    const filename = `${applicant_number}_${shortLabel}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage: multer.memoryStorage() });
const nodemailer = require("nodemailer");



// ---------------- TRANSPORTER ----------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Verify transporter at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email transporter is ready");
  }
});


//MYSQL CONNECTION FOR ADMISSION
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "admission",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


//MYSQL CONNECTION FOR ROOM MANAGEMENT AND OTHERS
const db3 = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "enrollment",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/*---------------------------------START---------------------------------------*/

//ADMISSION
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please fill up all required fields" });
  }

  let person_id = null;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🚫 OPTIONAL: Check if email already exists
    const [existingUser] = await db.query("SELECT * FROM user_accounts WHERE email = ?", [email.trim().toLowerCase()]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // ✅ STEP 1: Insert into person_table
    const [personResult] = await db.query("INSERT INTO person_table () VALUES ()");
    person_id = personResult.insertId;
    console.log("✅ person_table insert:", person_id);

    // ✅ STEP 2: Insert into user_accounts
    await db.query(
      "INSERT INTO user_accounts (person_id, email, password, role) VALUES (?, ?, ?, 'applicant')",
      [person_id, email.trim().toLowerCase(), hashedPassword]
    );
    console.log("✅ user_accounts insert for:", email);

    // ✅ STEP 3: Get year + semester from ENROLLMENT DB (db3)
    const [activeYearResult] = await db3.query(`
      SELECT yt.year_description, st.semester_code
      FROM active_school_year_table sy
      JOIN year_table yt ON yt.year_id = sy.year_id
      JOIN semester_table st ON st.semester_id = sy.semester_id
      WHERE sy.astatus = 1
      LIMIT 1
    `);

    if (activeYearResult.length === 0) {
      throw new Error("No active school year/semester found in ENROLLMENT DB.");
    }

    const year = activeYearResult[0].year_description.split("-")[0]; // e.g. "2025"
    const semCode = activeYearResult[0].semester_code; // e.g. "1"
    console.log("✅ Active Year:", year, "| Semester Code:", semCode);

    // ✅ STEP 4: Generate applicant_number
    const [countRes] = await db.query("SELECT COUNT(*) AS count FROM applicant_numbering_table");
    const padded = String(countRes[0].count + 1).padStart(5, "0"); // → "00001"
    const applicant_number = `${year}${semCode}${padded}`; // → "2025100001"
    console.log("✅ Generated applicant_number:", applicant_number);

    // ✅ STEP 5: Insert into applicant_numbering_table
    await db.query(
      "INSERT INTO applicant_numbering_table (applicant_number, person_id) VALUES (?, ?)",
      [applicant_number, person_id]
    );

    await db.query("INSERT INTO person_status_table (person_id, applicant_id, exam_status, requirements, residency, student_registration_status, exam_result, hs_ave, qualifying_result, interview_result) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [person_id, applicant_number, 0, 0, 0, 0, 0, 0, 0, 0]
    );

    console.log("✅ applicant_numbering_table insert successful");

    // ✅ Final response
    res.status(201).json({
      message: "Registered Successfully",
      person_id,
      applicant_number,
    });

  } catch (error) {
    console.error("❌ Registration Error:", error);

    // Optional rollback if person was already created
    if (person_id) {
      await db.query("DELETE FROM person_table WHERE person_id = ?", [person_id]);
    }

    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});


//GET ADMITTED USERS (UPDATED!)
app.get("/admitted_users", async (req, res) => {
  try {
    const query = "SELECT * FROM user_accounts";
    const [result] = await db.query(query);

    res.status(200).send(result);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ message: "INTERNAL SERVER ERROR!!" });
  }
});

//TRANSFER ENROLLED USER INTO ENROLLMENT (UPDATED!)
app.post("/transfer", async (req, res) => {
  const { person_id } = req.body;

  try {
    const fetchQuery = "SELECT * FROM user_accounts WHERE person_id = ?";
    const [result1] = await db.query(fetchQuery, [person_id]);

    if (result1.length === 0) {
      return res.status(404).send({ message: "User not found in the database" });
    }

    const user = result1[0];

    const insertPersonQuery = "INSERT INTO person_table (first_name, middle_name, last_name) VALUES (?, ?, ?)";
    const [personResult] = await db3.query(insertPersonQuery, [user.first_name, user.middle_name, user.last_name]);

    const newPersonId = personResult.insertId;

    const insertUserQuery = "INSERT INTO user_accounts (person_id, email, password) VALUES (?, ?, ?)";
    await db3.query(insertUserQuery, [newPersonId, user.email, user.password]);

    console.log("User transferred successfully:", user.email);
    return res.status(200).send({ message: "User transferred successfully", email: user.email });
  } catch (error) {
    console.error("ERROR: ", error);
    return res.status(500).send({ message: "Something went wrong in the server", error });
  }
});


// REGISTER API (NEW)
// app.post("/register_account", async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password ) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   try {
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Check if user already exists
//     const checkUserSql = "SELECT * FROM user_accounts WHERE email = ?";
//     const [existingUsers] = await db.query(checkUserSql, [email]);

//     if (existingUsers.length > 0) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // Insert blank record into person_table and get inserted person_id
//     const insertPersonSql = "INSERT INTO person_table () VALUES ()";
//     const [personResult] = await db.query(insertPersonSql);

//     // Step 1: Get the active_school_year_id
//     const activeYearSql = `SELECT asy.id, st.semester_code FROM active_school_year_table AS asy
//     LEFT JOIN
//     semester_table AS st ON asy.semester_id = st.semester_id WHERE astatus = 1 LIMIT 1`;
//     const [yearResult] = await db3.query(activeYearSql);

//     if (yearResult.length === 0) {
//       return res.status(404).json({ error: "No active school year found" });
//     }

//     const activeSchoolYearId = yearResult[0].id;
//     const semester_code = yearResult[0].semester_code;

//     const person_id = personResult.insertId;

//     // Insert user with person_id
//     const insertUserSql = "INSERT INTO user_accounts (email, person_id, password, role) VALUES (?, ?, ?, 'applicant')";
//     await db.query(insertUserSql, [email, person_id, hashedPassword]);

//     res.status(201).json({ message: "User registered successfully", person_id });
//   } catch (error) {
//     console.error("Registration error:", error);
//     res.status(500).json({ message: "Registration failed" });
//   }
// });



// Get applicant_number by person_id
app.get("/api/applicant_number/:person_id", async (req, res) => {
  const { person_id } = req.params;

  try {
    const [rows] = await db.query("SELECT applicant_number FROM applicant_numbering_table WHERE person_id = ?", [person_id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Applicant number not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching applicant number:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// 📌 Converts full requirement description to short label
const getShortLabel = (desc) => {
  const lower = desc.toLowerCase();
  if (lower.includes("form 138")) return "Form138";
  if (lower.includes("good moral")) return "GoodMoralCharacter";
  if (lower.includes("birth certificate")) return "BirthCertificate";
  if (lower.includes("belonging to graduating class")) return "CertificateOfGraduatingClass";
  if (lower.includes("vaccine card")) return "VaccineCard";
  return "Unknown";
};


app.post("/upload", upload.single("file"), async (req, res) => {
  const { requirements_id, person_id } = req.body;

  if (!req.file || !person_id || !requirements_id) {
    return res.status(400).json({ message: "Missing file, person_id, or requirements_id" });
  }

  try {
    // ✅ Fetch description
    const [rows] = await db.query("SELECT description FROM requirements_table WHERE id = ?", [requirements_id]);
    if (!rows.length) return res.status(404).json({ message: "Requirement not found" });

    const fullDescription = rows[0].description;
    const shortLabel = getShortLabel(fullDescription);
    const year = new Date().getFullYear();
    const ext = path.extname(req.file.originalname).toLowerCase();

    // ✅ Fetch applicant number
    const [appRows] = await db.query("SELECT applicant_number FROM applicant_numbering_table WHERE person_id = ?", [person_id]);
    if (!appRows.length) {
      return res.status(404).json({ message: `Applicant number not found for person_id ${person_id}` });
    }
    const applicant_number = appRows[0].applicant_number;

    // ✅ Construct final filename using applicant number
    const filename = `${applicant_number}_${shortLabel}_${year}${ext}`;
    const finalPath = path.join(__dirname, "uploads", filename);

    // ✅ Remove existing file with same person + requirement + year
    const [existingFiles] = await db.query(
      `SELECT upload_id, file_path FROM requirement_uploads 
       WHERE person_id = ? AND requirements_id = ? AND file_path LIKE ?`,
      [person_id, requirements_id, `%${shortLabel}_${year}%`]
    );

    for (const file of existingFiles) {
      const fullFilePath = path.join(__dirname, file.file_path);
      try {
        await fs.promises.unlink(fullFilePath);
      } catch (err) {
        console.warn("File delete warning:", err.message);
      }
      await db.query("DELETE FROM requirement_uploads WHERE upload_id = ?", [file.upload_id]);
    }

    // ✅ Write file to disk
    await fs.promises.writeFile(finalPath, req.file.buffer);

    const filePath = `${filename}`;
    const originalName = req.file.originalname;

    await db.query(
      "INSERT INTO requirement_uploads (requirements_id, person_id, file_path, original_name) VALUES (?, ?, ?, ?)",
      [requirements_id, person_id, filePath, originalName]
    );

    res.status(201).json({ message: "Upload successful", filename });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});


// REQUIREMENTS PANEL (UPDATED!) ADMIN
app.post("/requirements", async (req, res) => {
  const { requirements_description } = req.body;

  // Validate the input
  if (!requirements_description) {
    return res.status(400).json({ error: "Description required" });
  }

  const query = "INSERT INTO requirements_table (description) VALUES (?)";

  try {
    // Execute the query using promise-based `execute` method
    const [result] = await db.execute(query, [requirements_description]);

    // Respond with the inserted ID
    res.status(201).json({ requirements_id: result.insertId });
  } catch (err) {
    console.error("Insert error:", err);
    return res.status(500).json({ error: "Failed to save requirement" });
  }
});

// GET THE REQUIREMENTS (UPDATED!)
app.get("/requirements", async (req, res) => {
  const query = "SELECT * FROM requirements_table";

  try {
    // Execute the query using promise-based `execute` method
    const [results] = await db.execute(query);

    // Send the results in the response
    res.json(results);
  } catch (err) {
    console.error("Fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch requirements" });
  }
});


// DELETE (REQUIREMNET PANEL)
app.delete("/requirements_table/:id", async (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM requirements_table WHERE id = ?";

  try {
    const [result] = await db.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Requirement not found" });
    }

    res.status(200).json({ message: "Requirement deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete requirement" });
  }
});

// ✅ Upload Route
app.post("/api/upload", upload.single("file"), async (req, res) => {
  const { requirements_id, person_id, remarks } = req.body;

  // After saving upload successfully (inside try block):
  const [[appInfo]] = await db.query(`
  SELECT 
    ant.applicant_number,
    pt.last_name,
    pt.first_name,
    pt.middle_name
  FROM applicant_numbering_table ant
  JOIN person_table pt ON ant.person_id = pt.person_id
  WHERE ant.person_id = ?
`, [person_id]);

  const applicant_number = appInfo?.applicant_number || 'Unknown';
  const fullName = `${appInfo?.last_name || ''}, ${appInfo?.first_name || ''} ${appInfo?.middle_name?.charAt(0) || ''}.`;

  const message = `📥 Uploaded new document by Applicant #${applicant_number} - ${fullName}`;


  // Save to DB
  await db.query(
    "INSERT INTO notifications (type, message, applicant_number) VALUES (?, ?, ?)",
    ['upload', message, applicant_number]
  );

  // Emit to frontend
  io.emit("notification", {
    type: "upload",
    message,
    applicant_number,
    timestamp: new Date().toISOString()
  });


  if (!requirements_id || !person_id || !req.file) {
    return res.status(400).json({ error: "Missing required fields or file" });
  }

  try {
    // ✅ Fetch applicant_number based on person_id
    const [applicantRows] = await db.query(
      "SELECT applicant_number FROM applicant_numbering_table WHERE person_id = ?",
      [person_id]
    );

    if (!applicantRows.length) {
      return res.status(404).json({ error: "Applicant number not found" });
    }

    const applicant_number = applicantRows[0].applicant_number;

    // ✅ Get requirement description
    const [descRows] = await db.query("SELECT description FROM requirements_table WHERE id = ?", [requirements_id]);
    if (!descRows.length) return res.status(404).json({ message: "Requirement not found" });

    const description = descRows[0].description;
    const year = new Date().getFullYear();
    const ext = path.extname(req.file.originalname).toLowerCase();

    // ✅ Convert description to short label
    const getShortLabel = (desc) => {
      const lower = desc.toLowerCase();
      if (lower.includes("form 138")) return "Form138";
      if (lower.includes("good moral")) return "GoodMoralCharacter";
      if (lower.includes("birth certificate")) return "BirthCertificate";
      if (lower.includes("belonging to graduating class")) return "CertificateOfGraduatingClass";
      if (lower.includes("vaccine card")) return "VaccineCard";
      return "Unknown";
    };

    const shortLabel = getShortLabel(description);
    const filename = `${applicant_number}_${shortLabel}_${year}${ext}`;
    const finalPath = path.join(__dirname, "uploads", filename);

    // ✅ Remove existing upload for the same person + requirement
    const [existingFiles] = await db.query(
      `SELECT upload_id, file_path FROM requirement_uploads 
       WHERE person_id = ? AND requirements_id = ? AND file_path LIKE ?`,
      [person_id, requirements_id, `%${shortLabel}_${year}%`]
    );

    for (const file of existingFiles) {
      const fullFilePath = path.join(__dirname, file.file_path);
      try {
        await fs.promises.unlink(fullFilePath);
      } catch (err) {
        console.warn("File delete warning:", err.message);
      }
      await db.query("DELETE FROM requirement_uploads WHERE upload_id = ?", [file.upload_id]);
    }

    // ✅ Save the file
    await fs.promises.writeFile(finalPath, req.file.buffer);

    const filePath = `${filename}`;
    const originalName = req.file.originalname;

    await db.query(
      `INSERT INTO requirement_uploads (requirements_id, person_id, file_path, original_name, status, remarks) 
       VALUES (?, ?, ?, ?, 0, ?)`,
      [requirements_id, person_id, filePath, originalName, remarks || null]
    );


    res.status(201).json({ message: "Upload successful", filePath });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to save upload", details: err.message });
  }
});



// ✅ FETCH FILES (for current user only)
app.get("/uploads", async (req, res) => {
  const person_id = req.headers["x-person-id"];

  if (!person_id) {
    return res.status(401).json({ message: "Unauthorized: Missing person ID" });
  }

  const query = `
    SELECT 
      ru.upload_id, 
      r.description, 
      ru.file_path, 
      ru.original_name,   
      ru.created_at,
      ru.status,          
      ru.remarks 
    FROM requirement_uploads ru
    JOIN requirements_table r ON ru.requirements_id = r.id
    WHERE ru.person_id = ?
  `;

  try {
    const [results] = await db.query(query, [person_id]);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
});


// ✅ DELETE (only own files)
app.delete("/uploads/:id", async (req, res) => {
  const person_id = req.headers["x-person-id"];
  const { id } = req.params;

  if (!person_id) {
    return res.status(401).json({ message: "Unauthorized: Missing person ID" });
  }

  try {
    const [results] = await db.query(
      "SELECT file_path FROM requirement_uploads WHERE upload_id = ? AND person_id = ?",
      [id, person_id]
    );

    if (!results.length) {
      return res.status(403).json({ error: "Unauthorized or file not found" });
    }

    const filePath = path.join(__dirname, results[0].file_path);

    fs.unlink(filePath, (err) => {
      if (err) console.error("File delete error:", err);
    });

    await db.query("DELETE FROM requirement_uploads WHERE upload_id = ?", [id]);

    res.json({ message: "Requirement deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete requirement" });
  }
});


// ✅ UPDATE Remarks (admin only)
app.put("/uploads/remarks/:upload_id", async (req, res) => {
  const { upload_id } = req.params;
  const { status, remarks, document_status } = req.body;

  // Validate status
  const validStatuses = ["0", "1", "2"];
  if (!validStatuses.includes(String(status))) {
    return res.status(400).json({ error: "Status must be '0', '1', or '2'" });
  }

  try {
    // Update upload with new status, remarks, and document status
    const [result] = await db.query(
      "UPDATE requirement_uploads SET status = ?, remarks = ?, document_status = ? WHERE upload_id = ?",
      [status, remarks || null, document_status || null, upload_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Upload not found" });
    }

    // Fetch person_id for notification
    const [uploadRows] = await db.query(
      "SELECT person_id FROM requirement_uploads WHERE upload_id = ?",
      [upload_id]
    );
    const personId = uploadRows[0]?.person_id;

    const [[appInfo]] = await db.query(`
      SELECT 
        ant.applicant_number,
        pt.last_name,
        pt.first_name,
        pt.middle_name
      FROM applicant_numbering_table ant
      JOIN person_table pt ON ant.person_id = pt.person_id
      WHERE ant.person_id = ?
    `, [personId]);

    const applicant_number = appInfo?.applicant_number || 'Unknown';
    const fullName = `${appInfo?.last_name || ''}, ${appInfo?.first_name || ''} ${appInfo?.middle_name?.charAt(0) || ''}.`;

    const message = `✏️ Updated document status (Applicant #${applicant_number} - ${fullName})`;

    // Save to notifications table
    await db.query(
      "INSERT INTO notifications (type, message, applicant_number) VALUES (?, ?, ?)",
      ['update', message, applicant_number]
    );

    // Emit to frontend
    io.emit("notification", {
      type: "update",
      message,
      applicant_number,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      message: "Status, remarks, and document status updated successfully"
    });

  } catch (err) {
    console.error("Error updating Status/Remarks/DocumentStatus:", err);
    res.status(500).json({ error: "Failed to update" });
  }
});

// ✅ Manual override registrar_status by person_id
app.put("/api/registrar-status/:person_id", async (req, res) => {
  const { person_id } = req.params;
  const { registrar_status } = req.body;

  try {
    const [result] = await db.query(
      "UPDATE admission.requirement_uploads SET registrar_status = ? WHERE person_id = ?",
      [registrar_status, person_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Applicant not found" });
    }

    res.json({ message: "✅ Registrar status manually updated", registrar_status });
  } catch (error) {
    console.error("❌ Error updating registrar_status:", error);
    res.status(500).json({ error: "Failed to update registrar_status" });
  }
});

// ✅ Update submitted_documents by upload_id
// ✅ Update submitted_documents + registrar_status by upload_id
app.put("/api/submitted-documents/:upload_id", async (req, res) => {
  const { upload_id } = req.params;
  const { submitted_documents, registrar_status } = req.body;

  try {
    const [result] = await db.query(
      "UPDATE requirement_uploads SET submitted_documents = ?, registrar_status = ? WHERE upload_id = ?",
      [submitted_documents, registrar_status, upload_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Upload not found" });
    }

    res.json({ message: "Submitted documents + registrar status updated successfully" });
  } catch (error) {
    console.error("Error updating submitted_documents:", error);
    res.status(500).json({ error: "Failed to update submitted_documents" });
  }
});

// Update requirements when submitted documents are checked
app.put("/api/update-requirements/:person_id", async (req, res) => {
  const { person_id } = req.params;
  const { requirements } = req.body;

  try {
    await db.query(
      "UPDATE admission.person_status_table SET requirements = ? WHERE person_id = ?",
      [requirements, person_id]
    );
    res.json({ success: true, message: "Requirements updated" });
  } catch (error) {
    console.error("❌ Error updating requirements:", error);
    res.status(500).json({ success: false, error: "Failed to update requirements" });
  }
});






app.put("/uploads/document-status/:upload_id", async (req, res) => {
  const { upload_id } = req.params;
  const { document_status } = req.body;

  if (!document_status) {
    return res.status(400).json({ error: "Missing document_status" });
  }

  try {
    const [result] = await db.query(
      "UPDATE requirement_uploads SET document_status = ? WHERE upload_id = ?",
      [document_status, upload_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Upload not found" });
    }

    res.status(200).json({ message: "Document status updated successfully" });
  } catch (err) {
    console.error("Failed to update document_status:", err);
    res.status(500).json({ error: "Failed to update document_status" });
  }
});



// ✅ Fetch all applicant uploads (admin use)
app.get('/uploads/all', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        ru.upload_id,
        ru.requirements_id,
        ru.person_id,
        ru.file_path,
        ru.original_name,
        ru.remarks,
        ru.status,    
        ru.document_status,
        ru.registrar_status,
        ru.created_at,
        rt.description,
        p.applicant_number,
        p.first_name,
        p.middle_name,
        p.last_name,
        p.emailAddress
      FROM requirement_uploads ru
      JOIN requirements_table rt ON ru.requirements_id = rt.id
      JOIN person_table p ON ru.person_id = p.person_id
    `);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching all uploads:', err);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});
// === Upload for Medical Clearance (Vaccination Card only) ===
app.post("/api/upload/vaccine", upload.single("file"), async (req, res) => {
  try {
    const { person_id, remarks } = req.body;

    if (!person_id) {
      return res.status(400).json({ message: "Missing person_id" });
    }

    // ✅ Find requirement ID for Vaccine Card dynamically
    const [rows] = await db.query(
      "SELECT id, description FROM requirements_table WHERE LOWER(description) LIKE '%vaccine%' LIMIT 1"
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Vaccination Card requirement not found" });
    }

    const vaccineRequirementId = rows[0].id;
    const description = rows[0].description;
    const year = new Date().getFullYear();
    const ext = path.extname(req.file.originalname).toLowerCase();

    // ✅ Fetch applicant_number for filename
    const [[applicant]] = await db.query(
      "SELECT applicant_number FROM applicant_numbering_table WHERE person_id = ?",
      [person_id]
    );

    if (!applicant) {
      return res.status(404).json({ message: "Applicant number not found" });
    }

    const applicant_number = applicant.applicant_number;

    // ✅ Standardized short label
    const filename = `${applicant_number}_VaccineCard_${year}${ext}`;
    const finalPath = path.join(__dirname, "uploads", filename);

    // ✅ Remove old vaccine uploads for this applicant
    const [existingFiles] = await db.query(
      "SELECT upload_id, file_path FROM requirement_uploads WHERE person_id = ? AND requirements_id = ?",
      [person_id, vaccineRequirementId]
    );

    for (const file of existingFiles) {
      try {
        await fs.promises.unlink(path.join(__dirname, "uploads", file.file_path));
      } catch (err) {
        console.warn("File delete warning:", err.message);
      }
      await db.query("DELETE FROM requirement_uploads WHERE upload_id = ?", [file.upload_id]);
    }

    // ✅ Save file physically
    await fs.promises.writeFile(finalPath, req.file.buffer);

    // ✅ Insert into DB with proper path
    await db.query(
      "INSERT INTO requirement_uploads (requirements_id, person_id, file_path, original_name, remarks, status) VALUES (?, ?, ?, ?, ?, ?)",
      [
        vaccineRequirementId,
        person_id,
        filename, // ✅ store just the filename (not null)
        req.file.originalname,
        remarks || "",
        "0"
      ]
    );

    res.status(200).json({ message: "✅ Vaccine Card uploaded successfully" });
  } catch (err) {
    console.error("❌ Vaccine upload failed:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// ✅ Get uploads by applicant_number (Admin use)
// ✅ FETCH FILES by applicant number — for registrar to view student uploads
app.get("/uploads/by-applicant/:applicant_number", async (req, res) => {
  const applicant_number = req.params.applicant_number;

  try {
    // Get person_id by applicant_number
    const [personResult] = await db.query(
      "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ?",
      [applicant_number]
    );

    if (personResult.length === 0) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    const person_id = personResult[0].person_id;

    // ✅ Get uploads with remarks included
    const [uploads] = await db.query(`
      SELECT 
        ru.upload_id,
        ru.requirements_id,
        ru.person_id,
        ru.file_path,
        ru.original_name,
        ru.remarks,         -- ✅ Include this line
        ru.status,
        ru.document_status,
        ru.registrar_status,
        ru.created_at,
        rt.description
      FROM requirement_uploads ru
      JOIN requirements_table rt ON ru.requirements_id = rt.id
      WHERE ru.person_id = ?
    `, [person_id]);

    res.status(200).json(uploads);
  } catch (err) {
    console.error("Error fetching uploads by applicant number:", err);
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
});


// Add to server.js
// 📌 GET persons and their applicant numbers for AdminRequirementsPanel.jsx
app.get("/api/upload_documents", async (req, res) => {
  try {
    const [persons] = await db.query(`
      SELECT 
        pt.person_id,
        pt.first_name,
        pt.middle_name,
        pt.last_name,
        pt.emailAddress,
        ant.applicant_number
      FROM person_table pt
      LEFT JOIN applicant_numbering_table ant ON pt.person_id = ant.person_id
    `);

    res.status(200).json(persons);
  } catch (error) {
    console.error("❌ Error fetching upload documents:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/admin/uploads/:uploadId", async (req, res) => {
  const { uploadId } = req.params;

  // After deleting file in DB (inside try block):
  const [uploadRows] = await db.query(
    "SELECT person_id FROM requirement_uploads WHERE upload_id = ?",
    [uploadId]
  );
  const personId = uploadRows[0]?.person_id;
  const [[appInfo]] = await db.query(`
  SELECT 
    ant.applicant_number,
    pt.last_name,
    pt.first_name,
    pt.middle_name
  FROM applicant_numbering_table ant
  JOIN person_table pt ON ant.person_id = pt.person_id
  WHERE ant.person_id = ?
`, [personId]);

  const applicant_number = appInfo?.applicant_number || 'Unknown';
  const fullName = `${appInfo?.last_name || ''}, ${appInfo?.first_name || ''} ${appInfo?.middle_name?.charAt(0) || ''}.`;

  const message = `🗑️ Deleted document (Applicant #${applicant_number} - ${fullName})`;

  // Save to DB
  await db.query(
    "INSERT INTO notifications (type, message, applicant_number) VALUES (?, ?, ?)",
    ['delete', message, applicant_number]
  );

  // Emit to frontend
  io.emit("notification", {
    type: "delete",
    message,
    applicant_number,
    timestamp: new Date().toISOString()
  });

  try {
    await db.query("DELETE FROM requirement_uploads WHERE upload_id = ?", [uploadId]);
    res.status(200).json({ message: "Upload deleted successfully." });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete the upload." });
  }
});

app.get("/api/notifications", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 50"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});




// -------------------------------------------- GET APPLICANT ADMISSION DATA ------------------------------------------------//
// ✅ GET ALL APPLICANTS (unique, latest requirement_uploads)
app.get("/api/all-applicants", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT DISTINCT
        p.person_id,
        p.last_name,
        p.first_name,
        p.middle_name,
        p.extension,
        p.program,
        p.emailAddress,
        p.generalAverage1,
        p.campus,        
        p.created_at,              
        a.applicant_number,
        ea.schedule_id,                 
        es.exam_date,
        yt.year_id AS school_year,
        yt.year_description,
        sy.semester_id, 
        sy.astatus,
        ru.upload_id,              
        ru.document_status,
        ru.submitted_documents,
        ru.registrar_status,
        ru.created_at AS last_updated,
        ps.exam_status
      FROM admission.person_table AS p
      LEFT JOIN admission.applicant_numbering_table AS a 
        ON p.person_id = a.person_id
      LEFT JOIN admission.exam_applicants AS ea
        ON a.applicant_number = ea.applicant_id
      LEFT JOIN admission.exam_schedule AS es
        ON ea.schedule_id = es.exam_id
      LEFT JOIN enrollment.year_table AS yt
        ON YEAR(es.exam_date) = yt.year_description
      LEFT JOIN enrollment.active_school_year_table AS sy
        ON yt.year_id = sy.year_id
      LEFT JOIN admission.requirement_uploads AS ru
        ON ru.upload_id = (
          SELECT MAX(r2.upload_id) 
          FROM admission.requirement_uploads r2
          WHERE r2.person_id = p.person_id
        )
      LEFT JOIN admission.person_status_table AS ps
        ON p.person_id = ps.person_id
      WHERE (sy.astatus = 1 OR sy.astatus IS NULL)
      ORDER BY p.last_name ASC, p.first_name ASC;
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching all applicants:", err);
    res.status(500).send("Server error");
  }
});


// ✅ GET ONLY NOT-EMAILED APPLICANTS (unique, latest requirement_uploads)
app.get("/api/not-emailed-applicants", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT DISTINCT
        p.person_id,
        p.last_name,
        p.first_name,
        p.middle_name,
        p.extension,
        p.program,
        p.emailAddress,
        a.applicant_number,
        ea.schedule_id,
        ea.email_sent,
        es.exam_date,
        ru.upload_id,
        ru.document_status,
        ru.submitted_documents,
        ps.exam_status
      FROM admission.person_table AS p
      LEFT JOIN admission.applicant_numbering_table AS a 
        ON p.person_id = a.person_id
      LEFT JOIN admission.exam_applicants AS ea 
        ON a.applicant_number = ea.applicant_id
      LEFT JOIN admission.exam_schedule AS es 
        ON ea.schedule_id = es.exam_id
      LEFT JOIN admission.requirement_uploads AS ru 
        ON ru.upload_id = (
          SELECT MAX(r2.upload_id) 
          FROM admission.requirement_uploads r2
          WHERE r2.person_id = p.person_id
        )
      LEFT JOIN admission.person_status_table AS ps 
        ON p.person_id = ps.person_id
      WHERE (ea.email_sent = 0 OR ea.email_sent IS NULL)   -- not emailed
      ORDER BY p.last_name ASC, p.first_name ASC;
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching not-emailed applicants:", err);
    res.status(500).send("Server error");
  }
});


app.get("/api/applicants-with-number", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        p.person_id,
        p.campus,
        p.first_name,
        p.middle_name,
        p.last_name,
        p.extension,
        a.applicant_number,
        p.program,
        e.English AS english,
        e.Science AS science,
        e.Filipino AS filipino,
        e.Math AS math,
        e.Abstract AS abstract,
        COALESCE(
          e.final_rating,
          (COALESCE(e.English,0) + COALESCE(e.Science,0) + COALESCE(e.Filipino,0) + COALESCE(e.Math,0) + COALESCE(e.Abstract,0))
        ) AS final_rating,
        e.user AS user_id,
        u.email AS user_email   -- ✅ no extra comma
      FROM admission.person_table p
      INNER JOIN admission.applicant_numbering_table a 
        ON p.person_id = a.person_id
      LEFT JOIN admission.admission_exam e
        ON p.person_id = e.person_id
      LEFT JOIN enrollment.user_accounts u
        ON e.user = u.id   -- ✅ link by user_accounts.id
      ORDER BY p.person_id ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching applicants with number:", err);
    res.status(500).send("Server error");
  }
});




// Get full person info + applicant_number
// Get full person info + applicant_number + latest document_status
app.get("/api/person_with_applicant/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Get person + applicant number
    const [rows] = await db.query(`
      SELECT 
        p.*,
        a.applicant_number
      FROM person_table p
      LEFT JOIN applicant_numbering_table a 
        ON p.person_id = a.person_id
      WHERE p.person_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Person not found" });
    }

    const person = rows[0];

    // 🔎 Get latest document_status from requirement_uploads
    const [uploads] = await db.query(
      `SELECT document_status 
       FROM requirement_uploads 
       WHERE person_id = ? 
         AND document_status IS NOT NULL 
       ORDER BY upload_id DESC 
       LIMIT 1`,
      [id]
    );

    // ✅ If found, override person.document_status
    if (uploads.length > 0) {
      person.document_status = uploads[0].document_status;
    } else {
      person.document_status = "On process"; // fallback
    }

    res.json(person);
  } catch (err) {
    console.error("Error fetching person_with_applicant:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// ✅ College Approval GET + POST inside server.js
app.get("/college_approval/:person_id", (req, res) => {
  const { person_id } = req.params;

  db.query(
    "SELECT * FROM college_approval WHERE person_id = ?",
    [person_id],
    (err, results) => {
      if (err) {
        console.error("Error fetching college approval:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(results.length > 0 ? results[0] : null);
    }
  );
});

app.post("/college_approval", (req, res) => {
  const { person_id, percentage_score, total, status, custom_status } = req.body;

  if (!person_id) {
    return res.status(400).json({ error: "person_id is required" });
  }

  db.query(
    `INSERT INTO college_approval (person_id, percentage_score, total, status, custom_status) 
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
        percentage_score = VALUES(percentage_score),
        total = VALUES(total),
        status = VALUES(status),
        custom_status = VALUES(custom_status)`,
    [person_id, percentage_score, total, status, custom_status],
    (err, result) => {
      if (err) {
        console.error("Error saving college approval:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ success: true, message: "College approval saved successfully" });
    }
  );
});

// ✅ Get Qualifying Exam by person_id
app.get("/qualifying_exam/:person_id", (req, res) => {
  const { person_id } = req.params;

  db.query(
    "SELECT * FROM qualifying_exam WHERE person_id = ?",
    [person_id],
    (err, results) => {
      if (err) {
        console.error("Error fetching qualifying exam:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(results.length > 0 ? results[0] : null);
    }
  );
});

// ✅ Insert/Update Qualifying Exam
app.post("/qualifying_exam", (req, res) => {
  const { person_id, score, remarks, user, status, custom_status } = req.body;

  if (!person_id) {
    return res.status(400).json({ error: "person_id is required" });
  }

  db.query(
    `INSERT INTO qualifying_exam (person_id, score, remarks, user, status, custom_status) 
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
        score = VALUES(score),
        remarks = VALUES(remarks),
        user = VALUES(user),
        status = VALUES(status),
        custom_status = VALUES(custom_status)`,
    [person_id, score, remarks, user, status, custom_status],
    (err, result) => {
      if (err) {
        console.error("Error saving qualifying exam:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ success: true, message: "Qualifying exam saved successfully" });
    }
  );
});


// Count how many applicants are enrolled
app.get("/api/enrolled-count", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM person_table WHERE classifiedAs = 'Freshman (First Year)' OR classifiedAs = 'Transferee' OR classifiedAs = 'Returnee'"
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error fetching enrolled count:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/notify-submission", async (req, res) => {
  const { person_id } = req.body;

  if (!person_id) {
    return res.status(400).json({ message: "Missing person_id" });
  }

  try {
    const [[appInfo]] = await db.query(`
      SELECT 
        ant.applicant_number,
        pt.last_name,
        pt.first_name,
        pt.middle_name
      FROM applicant_numbering_table ant
      JOIN person_table pt ON ant.person_id = pt.person_id
      WHERE ant.person_id = ?
    `, [person_id]);

    const applicant_number = appInfo?.applicant_number || 'Unknown';
    const fullName = `${appInfo?.last_name || ''}, ${appInfo?.first_name || ''} ${appInfo?.middle_name?.charAt(0) || ''}.`;

    const message = `✅ Applicant #${applicant_number} - ${fullName} submitted their form.`;

    // Save to notifications table
    await db.query(
      "INSERT INTO notifications (type, message, applicant_number) VALUES (?, ?, ?)",
      ['submit', message, applicant_number]
    );

    // Emit notification
    io.emit("notification", {
      type: "submit",
      message,
      applicant_number,
      timestamp: new Date().toISOString()
    });

    res.json({ message: "Submission notification sent." });
  } catch (err) {
    console.error("Notification error:", err);
    res.status(500).json({ message: "Failed to notify", error: err.message });
  }
});




// GET person details by person_id
app.get("/api/person/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute("SELECT * FROM person_table WHERE person_id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Person not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching person:", error);
    res.status(500).json({ error: "Database error" });
  }
});


// PUT update person details by person_id
app.put("/api/person/:id", async (req, res) => {
  const { id } = req.params;
  const {
    profile_img, campus, academicProgram, classifiedAs, applyingAs, program, program2, program3, yearLevel,
    last_name, first_name, middle_name, extension, nickname, height, weight, lrnNumber, nolrnNumber, gender, pwdMember, pwdType, pwdId,
    birthOfDate, age, birthPlace, languageDialectSpoken, citizenship, religion, civilStatus, tribeEthnicGroup,
    cellphoneNumber, emailAddress,
    presentStreet, presentBarangay, presentZipCode, presentRegion, presentProvince, presentMunicipality, presentDswdHouseholdNumber, sameAsPresentAddress,
    permanentStreet, permanentBarangay, permanentZipCode, permanentRegion, permanentProvince, permanentMunicipality, permanentDswdHouseholdNumber,
    solo_parent, father_deceased, father_family_name, father_given_name, father_middle_name, father_ext, father_nickname, father_education, father_education_level,
    father_last_school, father_course, father_year_graduated, father_school_address, father_contact, father_occupation, father_employer,
    father_income, father_email, mother_deceased, mother_family_name, mother_given_name, mother_middle_name, mother_ext, mother_nickname,
    mother_education, mother_education_level, mother_last_school, mother_course, mother_year_graduated, mother_school_address, mother_contact,
    mother_occupation, mother_employer, mother_income, mother_email, guardian, guardian_family_name, guardian_given_name,
    guardian_middle_name, guardian_ext, guardian_nickname, guardian_address, guardian_contact, guardian_email, annual_income,
    schoolLevel, schoolLastAttended, schoolAddress, courseProgram, honor, generalAverage, yearGraduated,
    schoolLevel1, schoolLastAttended1, schoolAddress1, courseProgram1, honor1, generalAverage1, yearGraduated1, strand,
    cough, colds, fever, asthma, faintingSpells, heartDisease, tuberculosis, frequentHeadaches, hernia, chronicCough,
    headNeckInjury, hiv, highBloodPressure, diabetesMellitus, allergies, cancer, smokingCigarette, alcoholDrinking,
    hospitalized, hospitalizationDetails, medications, hadCovid, covidDate, vaccine1Brand, vaccine1Date,
    vaccine2Brand, vaccine2Date, booster1Brand, booster1Date, booster2Brand, booster2Date,
    chestXray, cbc, urinalysis, otherworkups, symptomsToday, remarks, termsOfAgreement, created_at
  } = req.body;



  try {
    const [result] = await db.execute(`UPDATE person_table SET
      profile_img=?, campus=?, academicProgram=?, classifiedAs=?, applyingAs=?, program=?, program2=?, program3=?, yearLevel=?,
      last_name=?, first_name=?, middle_name=?, extension=?, nickname=?, height=?, weight=?, lrnNumber=?, nolrnNumber=?, gender=?, pwdMember=?, pwdType=?, pwdId=?,
      birthOfDate=?, age=?, birthPlace=?, languageDialectSpoken=?, citizenship=?, religion=?, civilStatus=?, tribeEthnicGroup=?, 
      cellphoneNumber=?, emailAddress=?,
      presentStreet=?, presentBarangay=?, presentZipCode=?, presentRegion=?, presentProvince=?, presentMunicipality=?, presentDswdHouseholdNumber=?, 	sameAsPresentAddress=?,
      permanentStreet=?, permanentBarangay=?, permanentZipCode=?, permanentRegion=?, permanentProvince=?, permanentMunicipality=?, permanentDswdHouseholdNumber=?,
      solo_parent=?, father_deceased=?, father_family_name=?, father_given_name=?, father_middle_name=?, father_ext=?, father_nickname=?, father_education=?, father_education_level=?,
      father_last_school=?, father_course=?, father_year_graduated=?, father_school_address=?, father_contact=?, father_occupation=?, father_employer=?,
      father_income=?, father_email=?, mother_deceased=?, mother_family_name=?, mother_given_name=?, mother_middle_name=?,mother_ext=?, mother_nickname=?,
      mother_education=?, mother_education_level=?, mother_last_school=?, mother_course=?, mother_year_graduated=?, mother_school_address=?, mother_contact=?,
      mother_occupation=?, mother_employer=?, mother_income=?, mother_email=?, guardian=?, guardian_family_name=?, guardian_given_name=?,
      guardian_middle_name=?, guardian_ext=?, guardian_nickname=?, guardian_address=?, guardian_contact=?, guardian_email=?, annual_income=?,
      schoolLevel=?, schoolLastAttended=?, schoolAddress=?, courseProgram=?, honor=?, generalAverage=?, yearGraduated=?,
      schoolLevel1=?, schoolLastAttended1=?, schoolAddress1=?, courseProgram1=?, honor1=?, generalAverage1=?, yearGraduated1=?, strand=?,
      cough=?, colds=?, fever=?, asthma=?, faintingSpells=?, heartDisease=?, tuberculosis=?, frequentHeadaches=?, hernia=?, chronicCough=?,
      headNeckInjury=?, hiv=?, highBloodPressure=?, diabetesMellitus=?, allergies=?, cancer=?, smokingCigarette=?, alcoholDrinking=?,
      hospitalized=?, hospitalizationDetails=?, medications=?, hadCovid=?, covidDate=?, vaccine1Brand=?, vaccine1Date=?,
      vaccine2Brand=?, vaccine2Date=?, booster1Brand=?, booster1Date=?, booster2Brand=?, booster2Date=?,
      chestXray=?, cbc=?, urinalysis=?, otherworkups=?, symptomsToday=?, remarks=?, termsOfAgreement=?, created_at=?
      WHERE person_id=?`, [
      profile_img, campus, academicProgram, classifiedAs, applyingAs, program, program2, program3, yearLevel,
      last_name, first_name, middle_name, extension, nickname, height, weight, lrnNumber, nolrnNumber, gender, pwdMember, pwdType, pwdId,
      birthOfDate, age, birthPlace, languageDialectSpoken, citizenship, religion, civilStatus, tribeEthnicGroup,
      cellphoneNumber, emailAddress,
      presentStreet, presentBarangay, presentZipCode, presentRegion, presentProvince, presentMunicipality, presentDswdHouseholdNumber, sameAsPresentAddress,
      permanentStreet, permanentBarangay, permanentZipCode, permanentRegion, permanentProvince, permanentMunicipality, permanentDswdHouseholdNumber,
      solo_parent, father_deceased, father_family_name, father_given_name, father_middle_name, father_ext, father_nickname, father_education, father_education_level,
      father_last_school, father_course, father_year_graduated, father_school_address, father_contact, father_occupation, father_employer,
      father_income, father_email, mother_deceased, mother_family_name, mother_given_name, mother_middle_name, mother_ext, mother_nickname,
      mother_education, mother_education_level, mother_last_school, mother_course, mother_year_graduated, mother_school_address, mother_contact,
      mother_occupation, mother_employer, mother_income, mother_email, guardian, guardian_family_name, guardian_given_name,
      guardian_middle_name, guardian_ext, guardian_nickname, guardian_address, guardian_contact, guardian_email, annual_income,
      schoolLevel, schoolLastAttended, schoolAddress, courseProgram, honor, generalAverage, yearGraduated,
      schoolLevel1, schoolLastAttended1, schoolAddress1, courseProgram1, honor1, generalAverage1, yearGraduated1, strand,
      cough, colds, fever, asthma, faintingSpells, heartDisease, tuberculosis, frequentHeadaches, hernia, chronicCough,
      headNeckInjury, hiv, highBloodPressure, diabetesMellitus, allergies, cancer, smokingCigarette, alcoholDrinking,
      hospitalized, hospitalizationDetails, medications, hadCovid, covidDate, vaccine1Brand, vaccine1Date,
      vaccine2Brand, vaccine2Date, booster1Brand, booster1Date, booster2Brand, booster2Date,
      chestXray, cbc, urinalysis, otherworkups, symptomsToday, remarks, termsOfAgreement, created_at, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No record updated" });
    }
    res.json({ message: "Person updated successfully" });
  } catch (error) {
    console.error("Error updating person:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// For Major 
app.get("/api/programs", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM program_table");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching programs:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.post("/api/upload-profile-picture", upload.single("profile_picture"), async (req, res) => {
  const { person_id } = req.body;
  if (!person_id || !req.file) {
    return res.status(400).send("Missing person_id or file.");
  }

  try {
    // ✅ Get applicant_number from person_id
    const [rows] = await db.query("SELECT applicant_number FROM applicant_numbering_table WHERE person_id = ?", [person_id]);
    if (!rows.length) {
      return res.status(404).json({ message: "Applicant number not found for person_id " + person_id });
    }

    const applicant_number = rows[0].applicant_number;

    const ext = path.extname(req.file.originalname).toLowerCase();
    const year = new Date().getFullYear();
    const filename = `${applicant_number}_1by1_${year}${ext}`; // ✅ Use applicant number here
    const finalPath = path.join(__dirname, "uploads", filename);

    // ✅ Save file
    await fs.promises.writeFile(finalPath, req.file.buffer);

    // ✅ Save to DB (still use person_id here)
    await db3.query("UPDATE person_table SET profile_img = ? WHERE person_id = ?", [filename, person_id]);

    res.status(200).json({ message: "Uploaded successfully", filename });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("Failed to upload image.");
  }
});


// ✅ 2. Get person details by person_id
app.get("/api/person/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute("SELECT * FROM person_table WHERE person_id=?", [id]);

    if (!rows.length) return res.status(404).json({ error: "Person not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching person:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ 3. Flexible update person by person_id
app.put("/api/person/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body; // object { field: value }

    if (!Object.keys(fields).length)
      return res.status(400).json({ error: "No fields to update" });

    const sql = `
      UPDATE person_table
      SET ${Object.keys(fields).map((key) => `${key}=?`).join(", ")}
      WHERE person_id=?
    `;
    await db.execute(sql, [...Object.values(fields), id]);

    res.json({ message: "Person updated successfully" });
  } catch (error) {
    console.error("Error updating person:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});

// ✅ 4. Upload & update profile_img
app.post("/api/person/:id/upload-profile", upload.single("profile_img"), async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = req.file?.filename;

    if (!filePath) return res.status(400).json({ error: "No file uploaded" });

    // Remove old image if exists
    const [rows] = await db.execute("SELECT profile_img FROM person_table WHERE person_id=?", [id]);
    const oldImg = rows[0]?.profile_img;

    if (oldImg) {
      const oldPath = path.join(__dirname, "uploads", oldImg);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await db.execute("UPDATE person_table SET profile_img=? WHERE person_id=?", [filePath, id]);
    res.json({ message: "Profile image updated", profile_img: filePath });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ 5. Get applied programs list (sample, adjust db name/table)
// server.js
app.get("/api/applied_program", async (req, res) => {
  try {
    const [rows] = await db3.execute(`
      SELECT 
        ct.curriculum_id,
        pt.program_id,
        pt.program_code,
        pt.program_description,
        pt.major,
        d.dprtmnt_id,
        d.dprtmnt_name
      FROM curriculum_table AS ct
      INNER JOIN program_table AS pt ON pt.program_id = ct.program_id
      INNER JOIN dprtmnt_curriculum_table AS dc ON ct.curriculum_id = dc.curriculum_id
      INNER JOIN dprtmnt_table AS d ON dc.dprtmnt_id = d.dprtmnt_id
    `);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No curriculum data found" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error fetching curriculum data:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Get all saved school years with semester info
app.get("/api/school_years", async (req, res) => {
  try {
    const [rows] = await db3.query(`
      SELECT 
        yt.year_description,
        st.semester_description,
        sy.astatus
      FROM school_year_table sy
      JOIN year_table yt ON sy.year_id = yt.year_id
      JOIN semester_table st ON sy.semester_id = st.semester_id
      ORDER BY yt.year_description DESC, st.semester_id ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching school years:", error);
    res.status(500).json({ message: "Database error" });
  }
});

// ✅ Get year list only
app.get("/api/year_table", async (req, res) => {
  try {
    const [rows] = await db3.query(`SELECT * FROM year_table ORDER BY year_description DESC`);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching year_table:", error);
    res.status(500).json({ message: "Database error" });
  }
});

// ✅ Get semester list only
app.get("/api/semester_table", async (req, res) => {
  try {
    const [rows] = await db3.query(`SELECT * FROM semester_table`);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching semester_table:", error);
    res.status(500).json({ message: "Database error" });
  }
});


app.get("/api/search-person", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        a.applicant_number
      FROM person_table p
      LEFT JOIN applicant_numbering_table a ON p.person_id = a.person_id
      WHERE a.applicant_number LIKE ? 
         OR p.first_name LIKE ?
         OR p.last_name LIKE ?
         OR p.emailAddress LIKE ?
      LIMIT 1
    `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No matching applicant found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error searching person:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 Update document_status for a person
app.put("/api/person/:id/document-status", async (req, res) => {
  const { id } = req.params;
  const { document_status } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE person_table SET document_status = ? WHERE person_id = ?",
      [document_status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Person not found" });
    }

    res.json({ success: true, document_status });
  } catch (err) {
    console.error("Error updating document_status:", err);
    res.status(500).json({ error: "Failed to update document_status" });
  }
});


/*---------------------------  ENROLLMENT -----------------------*/

// LOGIN PANEL (UPDATED!)
// app.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ message: "Email and password are required" });
//   }

//   try {
//     let user, token, mappings = [];

//     let [rows] = await db3.query(
//       "SELECT * FROM user_accounts WHERE email = ? AND role = 'superadmin'",
//       [email]
//     );
//     if (rows.length > 0) {
//       user = rows[0];
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (isMatch) {
//         token = webtoken.sign(
//           {
//             id: user.id,
//             person_id: user.person_id,
//             email: user.email,
//             role: user.role
//           },
//           process.env.JWT_SECRET,
//           { expiresIn: "1h" }
//         );
//         return res.status(200).json({
//           message: "Superadmin login successful",
//           token,
//           user: {
//             person_id: user.person_id,
//             email: user.email,
//             role: user.role
//           }
//         });
//       }
//     }

//     const facultySQL = `
//       SELECT prof_table.*, time_table.*
//       FROM prof_table
//       LEFT JOIN time_table ON prof_table.prof_id = time_table.professor_id
//       WHERE prof_table.email = ? AND prof_table.role = 'faculty'
//     `;
//     const [facultyRows] = await db3.query(facultySQL, [email]);

//     if (facultyRows.length > 0) {
//       user = facultyRows[0];
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (isMatch) {
//         token = webtoken.sign(
//           {
//             prof_id: user.prof_id,
//             fname: user.fname,
//             mname: user.mname,
//             lname: user.lname,
//             email: user.email,
//             role: user.role,
//             profile_img: user.profile_image,
//             school_year_id: user.school_year_id
//           },
//           process.env.JWT_SECRET,
//           { expiresIn: "1h" }
//         );

//         mappings = facultyRows.map(row => ({
//           department_section_id: row.department_section_id,
//           subject_id: row.course_id
//         }));

//         return res.status(200).json({
//           message: "Faculty login successful",
//           token,
//           prof_id: user.prof_id,
//           fname: user.fname,
//           mname: user.mname,
//           lname: user.lname,
//           email: user.email,
//           role: user.role,
//           profile_img: user.profile_image,
//           subject_section_mappings: mappings,
//           school_year_id: user.school_year_id
//         });
//       }
//     }

//     [rows] = await db.query(
//       "SELECT * FROM user_accounts WHERE email = ? AND role = 'applicant'",
//       [email]
//     );
//     if (rows.length > 0) {
//       user = rows[0];
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (isMatch) {
//         token = webtoken.sign(
//           {
//             id: user.id,
//             person_id: user.person_id,
//             email: user.email,
//             role: user.role
//           },
//           process.env.JWT_SECRET,
//           { expiresIn: "1h" }
//         );

//         return res.status(200).json({
//           message: "Applicant login successful",
//           token,
//           user: {
//             person_id: user.person_id,
//             email: user.email,
//             role: user.role
//           }
//         });
//       }
//     }

//     // If none matched or password was incorrect
//     return res.status(400).json({ message: "Invalid email or password" });

//   } catch (err) {
//     console.error("Login error:", err);
//     return res.status(500).json({ message: "Server error", error: err.message });
//   }
// });
// OTP storage: otp, expiry, and cooldown
// ----------------- GLOBAL STORES -----------------
let otpStore = {}; 
// Structure: { email: { otp, expiresAt, cooldownUntil } }

let loginAttempts = {}; 
// Structure: { emailOrStudentNumber: { count, lockUntil } }

// ----------------- OTP GENERATOR -----------------
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ----------------- REQUEST OTP -----------------
app.post("/request-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const now = Date.now();
  const existing = otpStore[email];

  // prevent spamming OTP
  if (existing && existing.cooldownUntil > now) {
    const secondsLeft = Math.ceil((existing.cooldownUntil - now) / 1000);
    return res.status(429).json({ message: `OTP already sent. Please wait ${secondsLeft}s.` });
  }

  const otp = generateOTP();

  otpStore[email] = {
    otp,
    expiresAt: now + 60 * 1000, // valid 1 min
    cooldownUntil: now + 60 * 1000, // resend cooldown
  };

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"EARIST OTP Verification" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your EARIST OTP Code",
      text: `Your OTP is: ${otp} (Valid for 1 minute)`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("OTP email error:", err);
    delete otpStore[email];
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// ----------------- VERIFY OTP -----------------
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const now = Date.now();

  let record = loginAttempts[email] || { count: 0, lockUntil: null };

  // if locked
  if (record.lockUntil && record.lockUntil > now) {
    const secondsLeft = Math.ceil((record.lockUntil - now) / 1000);
    return res.status(429).json({ message: `Too many failed attempts. Try again in ${secondsLeft}s.` });
  }

  const stored = otpStore[email];
  if (!stored || stored.otp !== otp || stored.expiresAt < now) {
    // failed OTP attempt
    record.count++;
    if (record.count >= 3) {
      record.lockUntil = now + 3 * 60 * 1000; // lock 3 min
      loginAttempts[email] = record;
      return res.status(429).json({ message: "Too many failed OTP attempts. Locked for 3 minutes." });
    }
    loginAttempts[email] = record;
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  // ✅ OTP correct → reset everything
  delete loginAttempts[email];
  delete otpStore[email];

  res.json({ message: "OTP verified successfully" });
});

// ----------------- LOGIN -----------------
app.post("/login", async (req, res) => {
  const { email: loginCredentials, password } = req.body;
  if (!loginCredentials || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const now = Date.now();
  const record = loginAttempts[loginCredentials] || { count: 0, lockUntil: null };

  // check lockout
  if (record.lockUntil && record.lockUntil > now) {
    const secondsLeft = Math.ceil((record.lockUntil - now) / 1000);
    return res.status(429).json({ message: `Too many failed attempts. Try again in ${secondsLeft}s.` });
  }

  try {
    const query = `(
      SELECT 
        ua.id AS account_id,
        ua.person_id,
        ua.email,
        ua.password,
        ua.role,
        NULL AS profile_image,
        NULL AS fname,
        NULL AS mname,
        NULL AS lname,
        ua.status AS status,
        'user' AS source
      FROM user_accounts AS ua
      LEFT JOIN student_numbering_table AS snt ON snt.person_id = ua.person_id
      WHERE (ua.email = ? OR snt.student_number = ?)
    )
    UNION ALL
    (
      SELECT 
        ua.prof_id AS account_id,
        ua.person_id,
        ua.email,
        ua.password,
        ua.role,
        ua.profile_image,
        ua.fname,
        ua.mname,
        ua.lname,
        ua.status,
        'prof' AS source
      FROM prof_table AS ua
      LEFT JOIN person_prof_table AS pt ON pt.person_id = ua.person_id
      WHERE ua.email = ?
    );`;

    const [results] = await db3.query(query, [loginCredentials, loginCredentials, loginCredentials]);

    if (results.length === 0) {
      record.count++;
      if (record.count >= 3) {
        record.lockUntil = now + 3 * 60 * 1000;
        loginAttempts[loginCredentials] = record;
        return res.status(429).json({ message: "Too many failed attempts. Locked for 3 minutes." });
      }
      loginAttempts[loginCredentials] = record;
      return res.status(400).json({ message: "Invalid email or student number" });
    }

    const user = results[0];

    // password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      record.count++;
      let remaining = 3 - record.count;

      if (record.count >= 3) {
        record.lockUntil = now + 3 * 60 * 1000;
        loginAttempts[loginCredentials] = record;
        return res.status(429).json({ message: "Too many failed attempts. Locked for 3 minutes." });
      }

      loginAttempts[loginCredentials] = record;
      return res.status(400).json({
        message: `Invalid password. You have ${remaining} attempt(s) remaining.`,
        remaining,
      });
    }

    // ✅ NOTE: don’t clear loginAttempts yet → clear only after OTP verification

    // block inactive accounts
    if ((user.source === "prof" || user.source === "user") && user.status === 0) {
      return res.status(400).json({ message: "The Account is Inactive" });
    }

    // generate OTP
    const otp = generateOTP();
    otpStore[user.email] = {
      otp,
      expiresAt: now + 60 * 1000,
      cooldownUntil: now + 60 * 1000,
    };

    // send OTP
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    try {
      await transporter.sendMail({
        from: `"EARIST OTP Verification" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Your EARIST OTP Code",
        text: `Your OTP is: ${otp} (Valid for 1 minute)`,
      });
    } catch (err) {
      console.error("⚠️ Failed to send OTP email:", err.message);
    }

    // generate JWT
    const token = webtoken.sign(
      { person_id: user.person_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "OTP sent to registered email",
      token,
      email: user.email,
      role: user.role,
      person_id: user.person_id,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});


// Login for Applicants
app.post("/login_applicant", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const query = `
      SELECT * FROM user_accounts AS ua
      LEFT JOIN person_table AS pt ON pt.person_id = ua.person_id
      WHERE email = ?
    `;
    const [results] = await db.query(query, [email]);

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.status === 0) {
      return res.status(400).json({ message: "The Account is Inactive" });
    }

    const person_id = user.person_id;

    // ✅ Check if applicant_number already exists
    const [existing] = await db.query(
      "SELECT applicant_number FROM applicant_numbering_table WHERE person_id = ?",
      [person_id]
    );

    if (existing.length === 0) {
      // ✅ Get active school year & semester
      const [activeYear] = await db3.query(`
        SELECT yt.year_description, st.semester_description, st.semester_code
        FROM active_school_year_table AS sy
        JOIN year_table AS yt ON yt.year_id = sy.year_id
        JOIN semester_table AS st ON st.semester_id = sy.semester_id
        WHERE sy.astatus = 1
        LIMIT 1
      `);

      if (activeYear.length === 0) {
        return res.status(500).json({ message: "No active school year found" });
      }

      const year = activeYear[0].year_description.split("-")[0]; // Get starting year (e.g., 2025)
      const semCode = activeYear[0].semester_code; // Assumes values like 1, 2, 3

      // ✅ Get next number (count + 1, padded to 5 digits)
      const [countRes] = await db.query("SELECT COUNT(*) AS count FROM applicant_numbering_table");
      const next = countRes[0].count + 1;
      const padded = String(next).padStart(5, "0");

      const applicantNumber = `${year}${semCode}${padded}`;

      // ✅ Insert into table
      await db.query(
        "INSERT INTO applicant_numbering_table (applicant_number, person_id) VALUES (?, ?)",
        [applicantNumber, person_id]
      );
    }

    // ✅ Generate JWT token
    const token = webtoken.sign(
      { person_id: user.person_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      email: user.email,
      role: user.role,
      person_id: user.person_id,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});


// Login for Proffesor
app.post("/login_prof", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const query = `SELECT * FROM prof_table as ua
      LEFT JOIN person_prof_table as pt
      ON pt.person_id = ua.person_id
    WHERE email = ?`;

    const [results] = await db3.query(query, [email]);

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = webtoken.sign({ person_id: user.person_id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log("Login response:", { token, person_id: user.person_id, email: user.email, role: user.role });

    res.json({
      message: "Login successful",
      token,
      email: user.email,
      role: user.role,
      person_id: user.person_id,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});


// ---------------- Applicant: Get Info ----------------
app.post("/superadmin-get-applicant", async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.query(
      `SELECT ua.user_id, ua.email, ua.status, 
              pt.first_name, pt.middle_name, pt.last_name, pt.birthOfDate
       FROM user_accounts ua
       JOIN person_table pt ON ua.person_id = pt.person_id
       WHERE ua.email = ? AND ua.role = 'applicant'`,
      [email]
    );
    if (!rows.length) return res.status(404).json({ message: "Applicant not found" });

    const user = rows[0];
    res.json({
      user_id: user.user_id,
      email: user.email,
      fullName: `${user.first_name} ${user.middle_name || ""} ${user.last_name}`,
      birthdate: user.birthOfDate,
      status: user.status   // ✅ now returns 0 or 1 directly
    });
  } catch (err) {
    console.error("Get applicant error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------- Applicant: Update Status ---------------- //
app.post("/superadmin-update-status-applicant", async (req, res) => {
  const { email, status } = req.body;
  try {
    await db.query(
      `UPDATE user_accounts SET status = ? WHERE email = ? AND role = 'applicant'`,
      [status, email]
    );
    res.json({ message: "Applicant status updated successfully" });
  } catch (err) {
    console.error("Update applicant status error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



// ---------------- Student: Get Info ----------------
app.post("/superadmin-get-student", async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db3.query(
      `SELECT ua.id, ua.email, ua.status,
              pt.first_name, pt.middle_name, pt.last_name, pt.birthOfDate
       FROM user_accounts ua
       JOIN person_table pt ON ua.person_id = pt.person_id
       WHERE ua.email = ? AND ua.role = 'student'`,
      [email]
    );

    if (!rows.length) return res.status(404).json({ message: "Student not found" });

    const user = rows[0];
    res.json({
      user_id: user.id, // ✅ enrollment DB uses "id"
      email: user.email,
      fullName: `${user.first_name} ${user.middle_name || ""} ${user.last_name}`,
      birthdate: user.birthOfDate,
      status: user.status ?? 0
    });
  } catch (err) {
    console.error("Get student error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------- Student: Update Status ----------------
app.post("/superadmin-update-status-student", async (req, res) => {
  const { email, status } = req.body;
  try {
    const [result] = await db3.query(
      `UPDATE user_accounts SET status = ? WHERE email = ? AND role = 'student'`,
      [status, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student status updated successfully", status });
  } catch (err) {
    console.error("Update student status error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------- Faculty: Get Info ----------------
app.post("/superadmin-get-faculty", async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db3.query(
      `SELECT ua.id, ua.email, ua.status,
              pt.first_name, pt.middle_name, pt.last_name, pt.birthOfDate
       FROM user_accounts ua
       JOIN person_table pt ON ua.person_id = pt.person_id
       WHERE ua.email = ? AND ua.role = 'faculty'`,
      [email]
    );

    if (!rows.length) return res.status(404).json({ message: "Faculty not found" });

    const user = rows[0];
    res.json({
      user_id: user.id, // ✅ enrollment DB uses "id"
      email: user.email,
      fullName: `${user.first_name} ${user.middle_name || ""} ${user.last_name}`,
      birthdate: user.birthOfDate,
      status: user.status ?? 0
    });
  } catch (err) {
    console.error("Get faculty error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------- Faculty: Update Status ----------------
app.post("/superadmin-update-status-faculty", async (req, res) => {
  const { email, status } = req.body;
  try {
    const [result] = await db3.query(
      `UPDATE user_accounts SET status = ? WHERE email = ? AND role = 'faculty'`,
      [status, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json({ message: "Faculty status updated successfully", status });
  } catch (err) {
    console.error("Update faculty status error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Applicant Change Password 
app.post("/applicant-change-password", async (req, res) => {
  const { person_id, currentPassword, newPassword } = req.body;

  if (!person_id || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Get user by person_id
    const [rows] = await db.query("SELECT * FROM user_accounts WHERE person_id = ?", [person_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Password strength validation
    const strong =
      newPassword.length >= 8 &&
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[!#$^*@]/.test(newPassword);

    if (!strong) {
      return res.status(400).json({ message: "New password does not meet complexity requirements" });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Debug log (optional)
    console.log("Updating password for person_id:", person_id);
    console.log("New password hash:", hashed);

    // Update password in DB
    await db.query("UPDATE user_accounts SET password = ? WHERE person_id = ?", [hashed, person_id]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Registrar Change Password 
app.post("/registrar-change-password", async (req, res) => {
  const { person_id, currentPassword, newPassword } = req.body;

  if (!person_id || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Get user by person_id
    const [rows] = await db3.query("SELECT * FROM user_accounts WHERE person_id = ?", [person_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Password strength validation
    const strong =
      newPassword.length >= 8 &&
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[!#$^*@]/.test(newPassword);

    if (!strong) {
      return res.status(400).json({ message: "New password does not meet complexity requirements" });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Debug log (optional)
    console.log("Updating password for person_id:", person_id);
    console.log("New password hash:", hashed);

    // Update password in DB
    await db3.query("UPDATE user_accounts SET password = ? WHERE person_id = ?", [hashed, person_id]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Student Change Password 
app.post("/student-change-password", async (req, res) => {
  const { person_id, currentPassword, newPassword } = req.body;

  if (!person_id || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Get user by person_id
    const [rows] = await db3.query("SELECT * FROM user_accounts WHERE person_id = ?", [person_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Password strength validation
    const strong =
      newPassword.length >= 8 &&
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[!#$^*@]/.test(newPassword);

    if (!strong) {
      return res.status(400).json({ message: "New password does not meet complexity requirements" });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Debug log (optional)
    console.log("Updating password for person_id:", person_id);
    console.log("New password hash:", hashed);

    // Update password in DB
    await db3.query("UPDATE user_accounts SET password = ? WHERE person_id = ?", [hashed, person_id]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Faculty Change Password 
app.post("/faculty-change-password", async (req, res) => {
  const { person_id, currentPassword, newPassword } = req.body;

  if (!person_id || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Get user by person_id
    const [rows] = await db3.query("SELECT * FROM user_accounts WHERE person_id = ?", [person_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Password strength validation
    const strong =
      newPassword.length >= 8 &&
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[!#$^*@]/.test(newPassword);

    if (!strong) {
      return res.status(400).json({ message: "New password does not meet complexity requirements" });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Debug log (optional)
    console.log("Updating password for person_id:", person_id);
    console.log("New password hash:", hashed);

    // Update password in DB
    await db3.query("UPDATE user_accounts SET password = ? WHERE person_id = ?", [hashed, person_id]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

io.on("connection", (socket) => {
  console.log("✅ Socket.IO client connected");

  // ---------------------- Forgot Password: Applicant ----------------------
  socket.on("forgot-password-applicant", async (email) => {
    try {
      const [rows] = await db.query("SELECT * FROM user_accounts WHERE email = ?", [email]);
      if (rows.length === 0) {
        return socket.emit("password-reset-result-applicant", { success: false, message: "Email not found." });
      }

      const newPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const hashed = await bcrypt.hash(newPassword, 10);
      await db.query("UPDATE user_accounts SET password = ? WHERE email = ?", [hashed, email]);

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"EARIST Enrollment Notice" <noreply-earistmis@gmail.com>`,
        to: email,
        subject: "Your Password has been Reset!",
        text: `Hi,\n\nPlease login with your new password: ${newPassword}\n\nYours Truly,\nEARIST MANILA`,
      };

      await transporter.sendMail(mailOptions);

      socket.emit("password-reset-result-applicant", {
        success: true,
        message: "New password sent to your email.",
      });
    } catch (error) {
      console.error("Reset error (applicant):", error);
      socket.emit("password-reset-result-applicant", {
        success: false,
        message: "Internal server error.",
      });
    }
  });

  // ---------------------- Forgot Password: Registrar ----------------------
  socket.on("forgot-password-registrar", async (email) => {
    try {
      const [rows] = await db3.query("SELECT * FROM user_accounts WHERE email = ?", [email]);
      if (rows.length === 0) {
        return socket.emit("password-reset-result-registrar", { success: false, message: "Email not found." });
      }

      const newPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const hashed = await bcrypt.hash(newPassword, 10);
      await db3.query("UPDATE user_accounts SET password = ? WHERE email = ?", [hashed, email]);

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"EARIST Enrollment Notice" <noreply-earistmis@gmail.com>`,
        to: email,
        subject: "Your Password has been Reset!",
        text: `Hi,\n\nPlease login with your new password: ${newPassword}\n\nYours Truly,\nEARIST MANILA`,
      };

      await transporter.sendMail(mailOptions);

      socket.emit("password-reset-result-registrar", {
        success: true,
        message: "New password sent to your email.",
      });
    } catch (error) {
      console.error("Reset error (registrar):", error);
      socket.emit("password-reset-result-registrar", {
        success: false,
        message: "Internal server error.",
      });
    }
  });

  // 🔹 Get exam scores for a person
app.get("/api/exam/:personId", async (req, res) => {
  try {
    const { personId } = req.params;

    const [rows] = await db.query(
      `SELECT 
         id,
         person_id,
         English,
         Science,
         Filipino,
         Math,
         Abstract,
         final_rating,
         user,
         DATE_FORMAT(date_created, '%Y-%m-%d') AS date_created
       FROM admission_exam 
       WHERE person_id = ?`,
      [personId]
    );

    res.json(rows); 
  } catch (err) {
    console.error("❌ GET exam error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get applicant exam schedule
app.get("/api/exam-schedule/:applicant_number", async (req, res) => {
  const { applicant_number } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        s.day_description AS date_of_exam,
        s.start_time,
        s.end_time,
        s.room_description,
        s.room_no,
        s.proctor,
        s.created_at AS schedule_created_at
      FROM exam_applicants ea
      JOIN entrance_exam_schedule s 
        ON ea.schedule_id = s.schedule_id
      WHERE ea.applicant_id = ?
      LIMIT 1
    `, [applicant_number]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No exam schedule found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching exam schedule:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// Get person by applicant_number
app.get("/api/person-by-applicant/:applicant_number", async (req, res) => {
  const { applicant_number } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT p.*, a.applicant_number 
       FROM person_table p
       JOIN applicant_numbering_table a 
         ON p.person_id = a.person_id
       WHERE a.applicant_number = ?`,
      [applicant_number]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Applicant not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching person by applicant_number:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/applicant-schedule/:applicant_number", async (req, res) => {
  try {
    const { applicant_number } = req.params;

    const [rows] = await db.query(
      `SELECT 
          s.schedule_id,
          s.day_description,
          s.room_description,
          s.room_no,
          s.start_time,
          s.end_time,
          s.proctor,
          s.room_quota,
          s.created_at,
          ea.email_sent   -- ✅ include email_sent
       FROM entrance_exam_schedule s
       INNER JOIN exam_applicants ea
         ON ea.schedule_id = s.schedule_id
       WHERE ea.applicant_id = ?`,
      [applicant_number]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No schedule found for this applicant." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching applicant schedule:", err.message);
    res.status(500).json({ error: "Failed to fetch applicant schedule" });
  }
});


// Get applicants assigned to a proctor
app.get("/api/proctor-applicants/:proctor_id", async (req, res) => {
  const { proctor_id } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        ea.applicant_id,
        an.applicant_number,
        pt.first_name,
        pt.middle_name,
        pt.last_name,
        pt.program,
        es.exam_date,
        es.room_name,
        u.email AS proctor_email
      FROM exam_applicants ea
      JOIN applicant_numbering_table an ON ea.applicant_id = an.applicant_number
      JOIN person_table pt ON an.person_id = pt.person_id
      JOIN exam_schedule es ON ea.schedule_id = es.exam_id
      JOIN user_accounts u ON es.proctor_id = u.id
      WHERE es.proctor_id = ?
    `, [proctor_id]);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching proctor applicants:", err);
    res.status(500).json({ error: "Failed to fetch applicants for proctor" });
  }
});

// Search proctor by name and return their assigned applicants
app.get("/api/proctor-applicants", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }

  try {
    // Find schedules where this proctor is assigned
    const [schedules] = await db.query(
      `SELECT schedule_id, day_description, room_description, start_time, end_time, proctor
       FROM entrance_exam_schedule
       WHERE proctor LIKE ?`,
      [`%${query}%`]
    );

    if (schedules.length === 0) {
      return res.status(404).json({ message: "Proctor not found in schedules" });
    }

    // For each schedule, get assigned applicants with email_sent
    const results = [];
    for (const sched of schedules) {
      const [applicants] = await db.query(
        `SELECT ea.applicant_id, ea.email_sent,
                an.applicant_number,
                p.last_name, p.first_name, p.middle_name, p.program
         FROM exam_applicants ea
         JOIN applicant_numbering_table an ON ea.applicant_id = an.applicant_number
         JOIN person_table p ON an.person_id = p.person_id
         WHERE ea.schedule_id = ?`,
        [sched.schedule_id]
      );

      results.push({
        schedule: sched,
        applicants
      });
    }

    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching proctor applicants:", err);
    res.status(500).json({ error: "Failed to fetch applicants for proctor" });
  }
});


// Search proctor by name or email
app.get("/api/search-proctor", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }

  try {
    const [rows] = await db.query(`
      SELECT id, person_id, email, first_name, middle_name, last_name, role
      FROM user_accounts
      WHERE role = 'proctor'
        AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)
      LIMIT 1
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Proctor not found" });
    }

    res.json({
      id: rows[0].id,
      email: rows[0].email,
      name: `${rows[0].last_name}, ${rows[0].first_name} ${rows[0].middle_name || ""}`
    });
  } catch (err) {
    console.error("❌ Error searching proctor:", err);
    res.status(500).json({ error: "Failed to search proctor" });
  }
});


// 🔹 Save exam scores for a single applicant
app.post("/exam/save", async (req, res) => {
  try {
    const { applicant_number, english, science, filipino, math, abstract, final_rating, user } = req.body;

    // 1️⃣ Find person_id from applicant_number
    const [rows] = await db.query(
      "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ?",
      [applicant_number]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Applicant number not found" });
    }

    const personId = rows[0].person_id;

    // 2️⃣ Insert or update the admission_exam row
    await db.query(
      `INSERT INTO admission_exam 
        (person_id, English, Science, Filipino, Math, Abstract, final_rating, user, date_created)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         English = VALUES(English),
         Science = VALUES(Science),
         Filipino = VALUES(Filipino),
         Math = VALUES(Math),
         Abstract = VALUES(Abstract),
         final_rating = VALUES(final_rating),
         user = VALUES(user),
         date_created = VALUES(date_created)`,
      [personId, english, science, filipino, math, abstract, final_rating, user]
    );

    res.json({ success: true, message: "Exam data saved!" });
  } catch (err) {
    console.error("❌ Save error:", err);
    res.status(500).json({ error: "Failed to save exam data" });
  }
});

// 🔹 Import exam scores from Excel (using Applicant ID)
// ✅ Assuming you have req.user from login/session
app.post("/api/exam/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let insertedCount = 0;
    let skippedCount = 0;

    // 🔑 Hardcode for now, later get from req.user
    const loggedInUserId = 1;  

    for (const row of rows) {
      const applicantNumber = row["Applicant ID"] || row["applicant_number"];
      if (!applicantNumber) {
        skippedCount++;
        continue;
      }

      const [match] = await db.query(
        "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ?",
        [applicantNumber]
      );

      if (match.length === 0) {
        skippedCount++;
        continue;
      }

      const personId = match[0].person_id;

      await db.query(
        `INSERT INTO admission_exam 
           (person_id, English, Science, Filipino, Math, Abstract, final_rating, user, date_created)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           English = VALUES(English),
           Science = VALUES(Science),
           Filipino = VALUES(Filipino),
           Math = VALUES(Math),
           Abstract = VALUES(Abstract),
           final_rating = VALUES(final_rating),
           user = VALUES(user),
           date_created = VALUES(date_created)`,
        [
          personId,
          row["English"] || 0,
          row["Science"] || 0,
          row["Filipino"] || 0,
          row["Math"] || 0,
          row["Abstract"] || 0,
          row["Final Rating"] || 0,
          loggedInUserId, // ✅ now stores user_accounts.id, not text
        ]
      );

      insertedCount++;
    }

    res.json({
      success: true,
      message: `✅ Import done. Inserted/updated: ${insertedCount}, Skipped: ${skippedCount}`,
    });
  } catch (err) {
    console.error("❌ Excel import error:", err);
    res.status(500).json({ error: "Failed to import Excel" });
  }
});



  // ==================== INTERVIEW ROUTES ====================
  // 1. Get interview by applicant_number (JOIN applicant_numbering_table)
  app.get("/api/interview/:applicant_number", async (req, res) => {
    const { applicant_number } = req.params;
    try {
      const sql = `
      SELECT i.*, a.applicant_number
      FROM interview_table i
      JOIN applicant_numbering_table a ON i.person_id = a.person_id
      WHERE a.applicant_number = ?
    `;
      const [rows] = await db.query(sql, [applicant_number]);
      res.json(rows[0] || null);
    } catch (err) {
      console.error("❌ Error fetching interview:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/interview/:applicant_number", async (req, res) => {
    const { applicant_number } = req.params;
    try {
      const [rows] = await db.query(
        `SELECT 
         a.applicant_number,
         a.person_id,
         i.interview_id,
         i.entrance_exam_interviewer,
         i.college_interviewer,
         i.entrance_exam_score,
         i.college_exam_score,
         i.total_score,
         i.interview_date,
         i.status,
         i.custom_status,
         i.remarks
       FROM applicant_numbering_table a
       LEFT JOIN interview_table i ON i.person_id = a.person_id
       WHERE a.applicant_number = ?`,
        [applicant_number]
      );
      res.json(rows[0] || null);
    } catch (err) {
      console.error("❌ Error fetching interview:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // SAVE or UPDATE INTERVIEW (Save & Edit in 1 button)
  app.post("/api/interview", async (req, res) => {
    try {
      const {
        applicant_number,
        entrance_exam_interviewer,
        college_interviewer,
        entrance_exam_score,
        college_exam_score,
        total_score,
        status,
        custom_status,
        remarks,
      } = req.body;

      // Find person_id from applicant_number
      const [applicantRow] = await db.query(
        "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ?",
        [applicant_number]
      );

      if (applicantRow.length === 0) {
        return res.status(404).json({ message: "Applicant not found" });
      }

      const { person_id } = applicantRow[0];

      // Check if already has an interview
      const [existing] = await db.query(
        "SELECT interview_id FROM interview_table WHERE person_id = ?",
        [person_id]
      );

      if (existing.length > 0) {
        // UPDATE
        await db.query(
          `UPDATE interview_table 
         SET entrance_exam_interviewer = ?, 
             college_interviewer = ?, 
             entrance_exam_score = ?, 
             college_exam_score = ?, 
             total_score = ?, 
             interview_date = NOW(),
             status = ?, 
             custom_status = ?, 
             remarks = ?
         WHERE person_id = ?`,
          [
            entrance_exam_interviewer,
            college_interviewer,
            entrance_exam_score,
            college_exam_score,
            total_score,
            status,
            custom_status,
            remarks,
            person_id,
          ]
        );
        return res.json({ message: "✅ Interview updated successfully" });
      } else {
        // INSERT
        await db.query(
          `INSERT INTO interview_table 
         (person_id, entrance_exam_interviewer, college_interviewer, entrance_exam_score, 
          college_exam_score, total_score, interview_date, status, custom_status, remarks)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
          [
            person_id,
            entrance_exam_interviewer,
            college_interviewer,
            entrance_exam_score,
            college_exam_score,
            total_score,
            status,
            custom_status,
            remarks,
          ]
        );
        return res.json({ message: "✅ Interview saved successfully" });
      }
    } catch (error) {
      console.error("❌ Error saving interview:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });


  app.put("/api/interview/:applicant_number", upload.none(), async (req, res) => {
    const { applicant_number } = req.params;
    const {
      entrance_exam_interviewer,
      college_interviewer,
      entrance_exam_score,
      college_exam_score,
      status,
      custom_status,
      remarks
    } = req.body;

    try {
      const [a] = await db.query(
        "SELECT person_id FROM applicant_numbering_table WHERE applicant_number = ?",
        [applicant_number]
      );
      if (!a.length) return res.status(404).json({ success: false, message: "Applicant number not found" });

      const person_id = a[0].person_id;
      const total_score = Number(entrance_exam_score || 0) + Number(college_exam_score || 0);

      const [result] = await db.query(
        `UPDATE interview_table
       SET entrance_exam_interviewer=?, college_interviewer=?,
           entrance_exam_score=?, college_exam_score=?, total_score=?,
           status=?, custom_status=?, remarks=?, interview_date=NOW()
       WHERE person_id=?`,
        [
          entrance_exam_interviewer,
          college_interviewer,
          entrance_exam_score,
          college_exam_score,
          total_score,
          status,
          custom_status,
          remarks,
          person_id
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Interview not found" });
      }

      res.json({ success: true, message: "Interview updated" });
    } catch (err) {
      console.error("❌ Error updating interview:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });


  // ---------------------- Assign Student Number ----------------------
  socket.on("assign-student-number", async (person_id) => {
    try {
      const [rows] = await db.query(
        `SELECT * FROM person_table AS pt WHERE person_id = ?`,
        [person_id]
      );

      if (rows.length === 0) {
        return socket.emit("assign-student-number-result", {
          success: false,
          message: "Person not found.",
        });
      }

      const { first_name, middle_name, last_name, emailAddress } = rows[0];
      const student_number = `${new Date().getFullYear()}${String(person_id).padStart(5, "0")}`;
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // ✅ Save to student_numbering_table
      await db3.query(
        `INSERT INTO student_numbering_table (student_number, person_id) VALUES (?, ?)`,
        [student_number, person_id]
      );

      await db3.query(
        `INSERT INTO person_status_table (person_id, exam_status, requirements, residency, student_registration_status, exam_result, hs_ave) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [person_id, 0, 0, 0, 0, 0, 0]
      );

      await db3.query(
        `INSERT INTO student_status_table (student_number, active_curriculum, enrolled_status, year_level_id, active_school_year_id, control_status) VALUES (?, ?, ?, ?, ?, ?)`,
        [student_number, 0, 1, 0, 0, 0]
      );

      // ✅ Also update student_registration_status = 1
      await db3.query(
        `UPDATE person_status_table SET student_registration_status = 1 WHERE person_id = ?`,
        [person_id]
      );

      await db3.query(
        `INSERT INTO person_table (last_name, first_name, middle_name, emailAddress) VALUES (?,?,?,?)`, [last_name, first_name, middle_name, emailAddress]
      )
      // ✅ Insert or update login credentials
      const [existingUser] = await db3.query(`SELECT * FROM user_accounts WHERE person_id = ?`, [person_id]);

      if (existingUser.length === 0) {
        await db3.query(
          `INSERT INTO user_accounts (person_id, email, password, role) VALUES (?, ?, ?, 'student')`,
          [person_id, emailAddress, hashedPassword]
        );
      } else {
        await db3.query(
          `UPDATE user_accounts SET email = ?, password = ?, role = 'student' WHERE person_id = ?`,
          [emailAddress, hashedPassword, person_id]
        );
      }

      // ✅ Emit success
      socket.emit("assign-student-number-result", {
        success: true,
        student_number,
        message: "Student number assigned successfully.",
      });

      // 📧 Send Email (optional but useful)
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"EARIST Enrollment Office" <noreply-earistmis@gmail.com>`,
        to: emailAddress,
        subject: "🎓 Welcome to EARIST - Your Student Login Info",
        text: `
Hi, ${first_name} ${middle_name} ${last_name},

🎉 Congratulations! You are now officially enrolled and Part of Eulogio 'Amang'
Rodriguez Institute of Science and Technology of EARIST Community.

Your Student Number is: ${student_number} 

Your Email Address is: ${emailAddress} 
Your temporary password is: ${tempPassword}
You may change your password and keep it secured.

👉 Click the link below to log in to EARIST:

http://localhost:5173/login


      `.trim(),
      };

      // Send email in background
      transporter.sendMail(mailOptions).catch(console.error);
    } catch (error) {
      console.error("Error in assign-student-number:", error);
      socket.emit("assign-student-number-result", {
        success: false,
        message: "Internal server error.",
      });
    }
  });
});


// ============================
// GET - Day List (from schedule table)
// ============================
app.get("/day_list", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT DISTINCT day_description FROM entrance_exam_schedule ORDER BY FIELD(day_description, 'Monday','Tuesday','Wednesday','Thursday','Friday')"
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching days:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ============================
// GET - Room List (from enrollment.room_table)
// ============================
app.get("/room_list", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT room_id, room_description FROM enrollment.room_table ORDER BY room_description ASC"
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// ============================
// POST - Insert Entrance Exam Schedule
// ============================
app.post("/insert_exam_schedule", async (req, res) => {
  const { day_description, room_description, room_no, start_time, end_time, proctor, room_quota } = req.body;

  if (!day_description || !room_description || !room_no || !start_time || !end_time || !room_quota) {
    return res.status(400).json({ error: "All fields are required, including room number and room quota." });
  }

  try {
    // 🔎 Check for conflicts in the same day + room + room_no
    const [conflict] = await db.query(
      `SELECT * 
       FROM entrance_exam_schedule
       WHERE day_description = ?
         AND room_description = ?
         AND room_no = ?
         AND NOT (end_time <= ? OR start_time >= ?)`,
      [day_description.trim(), room_description.trim(), room_no.trim(), start_time, end_time]
    );

    if (conflict.length > 0) {
      return res.status(400).json({
        error: "Conflict: Another schedule already exists in this room/room_no with overlapping time.",
      });
    }

    // ✅ If no conflict, insert the schedule
    await db.query(
      `INSERT INTO entrance_exam_schedule 
         (day_description, room_description, room_no, start_time, end_time, proctor, room_quota)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [day_description.trim(), room_description.trim(), room_no.trim(), start_time, end_time, proctor, room_quota]
    );

    res.status(200).json({ message: "Schedule saved successfully" });
  } catch (err) {
    console.error("Error saving schedule:", err);
    res.status(500).json({ error: "Database error" });
  }
});


app.get("/exam_schedules", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.schedule_id,
        s.day_description,
        s.room_description,
        s.room_no,
        s.start_time,
        s.end_time,
        s.proctor,
        s.room_quota,
        COUNT(ea.applicant_id) AS assigned_count
      FROM entrance_exam_schedule s
      LEFT JOIN exam_applicants ea ON s.schedule_id = ea.schedule_id
      GROUP BY s.schedule_id
      ORDER BY s.schedule_id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching schedules:", err);
    res.status(500).json({ error: "Database error" });
  }
});

io.on("connection", (socket) => {
  console.log("✅ Socket.IO client connected");

  socket.on("update_schedule", async ({ schedule_id, applicant_numbers }) => {
    try {
      if (!schedule_id || !applicant_numbers || applicant_numbers.length === 0) {
        return socket.emit("update_schedule_result", {
          success: false,
          error: "Schedule ID and applicants required.",
        });
      }

      // 🔎 Get room quota
      const [[scheduleInfo]] = await db.query(
        `SELECT room_quota FROM entrance_exam_schedule WHERE schedule_id = ?`,
        [schedule_id]
      );
      if (!scheduleInfo) {
        return socket.emit("update_schedule_result", {
          success: false,
          error: "Schedule not found.",
        });
      }
      const roomQuota = scheduleInfo.room_quota;

      // 🔎 Count how many are already assigned
      const [[{ currentCount }]] = await db.query(
        `SELECT COUNT(*) AS currentCount FROM exam_applicants WHERE schedule_id = ?`,
        [schedule_id]
      );

      // If total would exceed quota, reject
      if (currentCount + applicant_numbers.length > roomQuota) {
        return socket.emit("update_schedule_result", {
          success: false,
          error: `Room quota exceeded! Capacity: ${roomQuota}, Currently Assigned: ${currentCount}, Trying to add: ${applicant_numbers.length}.`,
        });
      }

      const assigned = [];
      const updated = [];
      const skipped = [];

      for (const applicant_number of applicant_numbers) {
        const [check] = await db.query(
          `SELECT * FROM exam_applicants WHERE applicant_id = ?`,
          [applicant_number]
        );

        if (check.length > 0) {
          if (check[0].schedule_id === schedule_id) {
            skipped.push(applicant_number); // already in this schedule
          } else {
            await db.query(
              `UPDATE exam_applicants SET schedule_id = ? WHERE applicant_id = ?`,
              [schedule_id, applicant_number]
            );
            updated.push(applicant_number);
          }
        } else {
          await db.query(
            `INSERT INTO exam_applicants (applicant_id, schedule_id) VALUES (?, ?)`,
            [applicant_number, schedule_id]
          );
          assigned.push(applicant_number);
        }
      }

      console.log("✅ Assigned:", assigned);
      console.log("✏️ Updated:", updated);
      console.log("⚠️ Skipped:", skipped);

      socket.emit("update_schedule_result", {
        success: true,
        assigned,
        updated,
        skipped,
      });
    } catch (error) {
      console.error("❌ Error assigning schedule:", error);
      socket.emit("update_schedule_result", {
        success: false,
        error: "Failed to assign schedule.",
      });
    }
  });

  // === SEND SCHEDULE EMAILS ===
  // === SEND SCHEDULE EMAILS (batch-safe version) ===
  // === SEND SCHEDULE EMAILS (batch-safe + DB sync) ===
  socket.on("send_schedule_emails", async ({ schedule_id }) => {
    try {
      const [rows] = await db.query(
        `SELECT 
         ea.schedule_id,
         s.day_description,
         s.room_description,
         s.start_time,
         s.end_time,
         an.applicant_number,
         p.person_id,
         p.first_name,
         p.last_name,
         p.emailAddress
       FROM exam_applicants ea
       JOIN entrance_exam_schedule s 
         ON ea.schedule_id = s.schedule_id
       JOIN applicant_numbering_table an 
         ON ea.applicant_id = an.applicant_number
       JOIN person_table p 
         ON an.person_id = p.person_id
       WHERE ea.schedule_id = ?`,
        [schedule_id]
      );

      if (rows.length === 0) {
        return socket.emit("send_schedule_emails_result", {
          success: false,
          error: "No applicants found for this schedule.",
        });
      }

      const batchSize = 5;   // send 5 emails at a time
      const delayMs = 1000;  // 1 second between batches

      const sent = [];
      const failed = [];
      const skipped = [];

      // Function to send one email and update DB
      const sendEmail = async (row) => {
        if (!row.emailAddress) {
          skipped.push(row.applicant_number);
          console.warn(`⚠️ Applicant ${row.applicant_number} has no email`);
          return;
        }

        const mailOptions = {
          from: `"EARIST Manila" <${process.env.EMAIL_USER}>`,
          to: row.emailAddress,
          subject: "Your Entrance Exam Schedule",
          text: `Hello ${row.first_name} ${row.last_name},

You have been assigned to the following entrance exam schedule:

📅 Day: ${row.day_description}
🏫 Room: ${row.room_description}
🕒 Time: ${row.start_time} - ${row.end_time}
🆔 Applicant No: ${row.applicant_number}

Please arrive on time and bring your requirements.

- EARIST Manila`,
        };

        try {
          // 🔹 Send email
          await transporter.sendMail(mailOptions);

          // 🔹 Update applicant + status flags
          await db.query(
            `UPDATE exam_applicants 
           SET email_sent = 1 
           WHERE applicant_id = ? AND schedule_id = ?`,
            [row.applicant_number, row.schedule_id]
          );

          await db.query(
            `UPDATE person_status_table 
           SET exam_status = 1 
           WHERE person_id = ?`,
            [row.person_id]
          );

          console.log(`✅ Email sent + flags updated for ${row.emailAddress}`);
          sent.push(row.applicant_number);
        } catch (err) {
          console.error(`❌ Failed to send email to ${row.emailAddress}:`, err.message);
          failed.push(row.applicant_number);
        }
      };

      // 🔹 Process in batches
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        await Promise.all(batch.map(sendEmail));

        if (i + batchSize < rows.length) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      // 🔹 Notify sender
      socket.emit("send_schedule_emails_result", {
        success: true,
        sent,
        failed,
        skipped,
        message: `Emails processed: Sent=${sent.length}, Failed=${failed.length}, Skipped=${skipped.length}`,
      });

      // 🔹 Notify all clients so frontend refreshes instantly
      io.emit("schedule_updated", { schedule_id });

    } catch (err) {
      console.error("Error in send_schedule_emails:", err);
      socket.emit("send_schedule_emails_result", {
        success: false,
        error: "Server error sending emails.",
      });
    }
  });

});

// Unassign ALL applicants from a schedule
app.post("/unassign_all_from_schedule", async (req, res) => {
  const { schedule_id } = req.body;
  try {
    // ✅ Correct table: exam_applicants
    await db.execute("UPDATE exam_applicants SET schedule_id = NULL WHERE schedule_id = ?", [schedule_id]);
    res.json({ success: true, message: `All applicants unassigned from schedule ${schedule_id}` });
  } catch (err) {
    console.error("Error unassigning all applicants:", err);
    res.status(500).json({ error: "Failed to unassign all applicants" });
  }
});


// Unassign schedule from an applicant
app.post("/unassign_schedule", async (req, res) => {
  const { applicant_number } = req.body;

  if (!applicant_number) {
    return res.status(400).json({ error: "Applicant number is required." });
  }

  try {
    const [result] = await db.query(
      `DELETE FROM admission.exam_applicants WHERE applicant_id = ?`,
      [applicant_number]
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: `Applicant ${applicant_number} unassigned.` });
    } else {
      res.status(404).json({ error: "Applicant not found or not assigned." });
    }
  } catch (err) {
    console.error("Error unassigning schedule:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get current number of applicants assigned to a schedule
app.get("/api/exam-schedule-count/:schedule_id", async (req, res) => {
  const { schedule_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS count 
       FROM exam_applicants 
       WHERE schedule_id = ?`,
      [schedule_id]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    console.error("Error fetching schedule count:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET schedules with current occupancy
app.get("/exam_schedules_with_count", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.schedule_id,
        s.day_description,
        s.room_description,
        s.start_time,
        s.end_time,
        s.proctor,
        s.room_quota,
        COUNT(ea.applicant_id) AS current_occupancy
      FROM entrance_exam_schedule s
      LEFT JOIN exam_applicants ea
        ON s.schedule_id = ea.schedule_id
      GROUP BY s.schedule_id
      ORDER BY s.schedule_id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching schedules with count:", err);
    res.status(500).json({ error: "Database error" });
  }
});


//READ ENROLLED USERS (UPDATED!)
app.get("/enrolled_users", async (req, res) => {
  try {
    const query = "SELECT * FROM user_accounts";

    const [result] = await db3.query(query);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: "Error Fetching data from the server" });
  }
});

// DEPARTMENT CREATION (UPDATED!)
app.post("/department", async (req, res) => {
  const { dep_name, dep_code } = req.body;
  const query = "INSERT INTO dprtmnt_table (dprtmnt_name, dprtmnt_code) VALUES (?, ?)";

  try {
    const [result] = await db3.query(query, [dep_name, dep_code]);
    res.status(200).send({ insertId: result.insertId });
  } catch (err) {
    console.error("Error creating department:", err);
    res.status(500).send({ error: "Failed to create department" });
  }
});

// DEPARTMENT LIST (UPDATED!)
app.get("/get_department", async (req, res) => {
  const getQuery = "SELECT * FROM dprtmnt_table";

  try {
    const [result] = await db3.query(getQuery);
    res.status(200).send(result);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// UPDATE DEPARTMENT INFORMATION (SUPERADMIN) (UPDATED!)
app.put("/update_department/:id", async (req, res) => {
  const { id } = req.params; // Extract the department ID from the URL parameter
  const { dep_name, dep_code } = req.body; // Get the department name and code from the request body

  const updateQuery = `
      UPDATE dprtmnt_table 
      SET dprtmnt_name = ?, dprtmnt_code = ? 
      WHERE id = ?`;

  try {
    const [result] = await db3.query(updateQuery, [dep_name, dep_code, id]);

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Department not found" });
    }

    res.status(200).send({ message: "Department updated successfully" });
  } catch (err) {
    console.error("Error updating department:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// DELETE DEPARTMENT (SUPERADMIN) (UPDATED!)
app.delete("/delete_department/:id", async (req, res) => {
  const { id } = req.params;

  const deleteQuery = "DELETE FROM dprtmnt_table WHERE id = ?";

  try {
    const [result] = await db3.query(deleteQuery, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Department not found" });
    }

    res.status(200).send({ message: "Department deleted successfully" });
  } catch (err) {
    console.error("Error deleting department:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// PROGRAM CREATION (UPDATED!)
app.post("/program", async (req, res) => {
  const { name, code } = req.body;

  const insertProgramQuery = "INSERT INTO program_table (program_description, program_code) VALUES (?, ?)";

  try {
    const [result] = await db3.query(insertProgramQuery, [name, code]);
    res.status(200).send({ message: "Program created successfully", result });
  } catch (err) {
    console.error("Error creating program:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// PROGRAM TABLE (UPDATED!)
app.get("/get_program", async (req, res) => {
  const programQuery = "SELECT * FROM program_table";

  try {
    const [result] = await db3.query(programQuery);
    res.status(200).send(result);
  } catch (err) {
    console.error("Error fetching programs:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// UPDATE PROGRAM INFORMATION (SUPERADMIN)(UPDATED!)
app.put("/update_program/:id", async (req, res) => {
  const { id } = req.params;
  const { name, code } = req.body;

  const updateQuery = "UPDATE program_table SET program_description = ?, program_code = ? WHERE id = ?";

  try {
    const [result] = await db3.query(updateQuery, [name, code, id]);

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Program not found" });
    }

    res.status(200).send({ message: "Program updated successfully" });
  } catch (err) {
    console.error("Error updating program:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// DELETE PROGRAM (SUPERADMIN) (UPDATED!)
app.delete("/delete_program/:id", async (req, res) => {
  const { id } = req.params;

  const deleteQuery = "DELETE FROM program_table WHERE id = ?";

  try {
    const [result] = await db3.query(deleteQuery, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Program not found" });
    }

    res.status(200).send({ message: "Program deleted successfully" });
  } catch (err) {
    console.error("Error deleting program:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// CURRICULUM CREATION (UPDATED!)
app.post("/curriculum", async (req, res) => {
  const { year_id, program_id } = req.body;

  if (!year_id || !program_id) {
    return res.status(400).json({ error: "Year ID and Program ID are required" });
  }

  try {
    const sql = "INSERT INTO curriculum_table (year_id, program_id) VALUES (?, ?)";
    const [result] = await db3.query(sql, [year_id, program_id]);

    res.status(201).json({
      message: "Curriculum created successfully",
      curriculum_id: result.insertId,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });
  }
});

// CURRICULUM LIST (UPDATED!)
app.get("/get_curriculum", async (req, res) => {
  const readQuery = `
    SELECT ct.*, p.*, y.* 
    FROM curriculum_table ct 
    INNER JOIN program_table p ON ct.program_id = p.program_id
    INNER JOIN year_table y ON ct.year_id = y.year_id
  `;

  try {
    const [result] = await db3.query(readQuery);
    res.status(200).json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });
  }
});

/// COURSE TABLE - ADDING COURSE (UPDATED!)
app.post("/adding_course", async (req, res) => {
  const { course_code, course_description, course_unit, lab_unit } = req.body;

  // Basic validation
  if (!course_code || !course_description || !course_unit || !lab_unit) {
    return res.status(400).json({ error: "All course fields are required" });
  }

  const courseQuery = `
    INSERT INTO course_table (course_code, course_description, course_unit, lab_unit)
    VALUES (?, ?, ?, ?)
  `;

  try {
    const [result] = await db3.query(courseQuery, [course_code, course_description, course_unit, lab_unit]);

    res.status(201).json({
      message: "Course added successfully",
      course_id: result.insertId,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });
  }
});

// READ COURSE LIST (UPDATED!)
app.get("/prgram_tagging_list", async (req, res) => {
  const readQuery = `
     SELECT 
      pt.program_tagging_id,
      c.year_id AS curriculum_description,
      co.course_code,
      co.course_description,
      yl.year_level_description,
      s.semester_description
    FROM 
      program_tagging_table pt
    JOIN curriculum_table c ON pt.curriculum_id = c.curriculum_id
    JOIN course_table co ON pt.course_id = co.course_id
    JOIN year_level_table yl ON pt.year_level_id = yl.year_level_id
    JOIN semester_table s ON pt.semester_id = s.semester_id
  `;

  try {
    const [result] = await db3.query(readQuery);
    res.status(200).json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });
  }
});

// GET COURSES BY CURRICULUM ID (UPDATED!)
app.get("/get_courses_by_curriculum/:curriculum_id", async (req, res) => {
  const { curriculum_id } = req.params;

  const query = `
    SELECT c.* 
    FROM program_tagging_table pt
    INNER JOIN course_table c ON pt.course_id = c.course_id
    WHERE pt.curriculum_id = ?
  `;

  try {
    const [result] = await db3.query(query, [curriculum_id]);
    res.status(200).json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Failed to retrieve courses",
      details: err.message,
    });
  }
});

// COURSE TAGGING LIST (UPDATED!)
app.get("/get_course", async (req, res) => {
  const getCourseQuery = `
    SELECT 
      yl.*, st.*, c.*
    FROM program_tagging_table pt
    INNER JOIN year_level_table yl ON pt.year_level_id = yl.year_level_id
    INNER JOIN semester_table st ON pt.semester_id = st.semester_id
    INNER JOIN course_table c ON pt.course_id = c.course_id
  `;

  try {
    const [results] = await db3.query(getCourseQuery);
    res.status(200).json(results);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Failed to retrieve course tagging list",
      details: err.message,
    });
  }
});

// COURSE LIST (UPDATED!)
app.get("/course_list", async (req, res) => {
  const query = "SELECT * FROM course_table";

  try {
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({
      error: "Query failed",
      details: err.message,
    });
  }
});

// PROGRAM TAGGING TABLE (UPDATED!)
app.post("/program_tagging", async (req, res) => {
  const { curriculum_id, year_level_id, semester_id, course_id } = req.body;

  if (!curriculum_id || !year_level_id || !semester_id || !course_id) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const progTagQuery = `
    INSERT INTO program_tagging_table 
    (curriculum_id, year_level_id, semester_id, course_id) 
    VALUES (?, ?, ?, ?)
  `;

  try {
    const [result] = await db3.query(progTagQuery, [curriculum_id, year_level_id, semester_id, course_id]);
    res.status(200).json({ message: "Program tagged successfully", insertId: result.insertId });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Failed to tag program",
      details: err.message,
    });
  }
});

// YEAR TABLE (UPDATED!)
app.post("/years", async (req, res) => {
  const { year_description } = req.body;

  if (!year_description) {
    return res.status(400).json({ error: "year_description is required" });
  }

  const query = "INSERT INTO year_table (year_description, status) VALUES (?, 0)";

  try {
    const [result] = await db3.query(query, [year_description]);
    res.status(201).json({
      year_id: result.insertId,
      year_description,
      status: 0,
    });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({
      error: "Insert failed",
      details: err.message,
    });
  }
});

// YEAR LIST (UPDATED!)
app.get("/year_table", async (req, res) => {
  const query = "SELECT * FROM year_table";

  try {
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({
      error: "Query failed",
      details: err.message,
    });
  }
});

// UPDATE YEAR PANEL INFORMATION (UPDATED!)
app.put("/year_table/:id", async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    if (status === 1) {
      // Deactivate all other years first
      const deactivateQuery = "UPDATE year_table SET status = 0";
      await db3.query(deactivateQuery);

      // Activate the selected year
      const activateQuery = "UPDATE year_table SET status = 1 WHERE year_id = ?";
      await db3.query(activateQuery, [id]);

      res.status(200).json({ message: "Year status updated successfully" });
    } else {
      // Deactivate the selected year
      const updateQuery = "UPDATE year_table SET status = 0 WHERE year_id = ?";
      await db3.query(updateQuery, [id]);

      res.status(200).json({ message: "Year deactivated successfully" });
    }
  } catch (err) {
    console.error("Error updating year status:", err);
    res.status(500).json({
      error: "Failed to update year status",
      details: err.message,
    });
  }
});

// YEAR LEVEL PANEL (UPDATED!)
app.post("/years_level", async (req, res) => {
  const { year_level_description } = req.body;

  if (!year_level_description) {
    return res.status(400).json({ error: "year_level_description is required" });
  }

  const query = "INSERT INTO year_level_table (year_level_description) VALUES (?)";

  try {
    const [result] = await db3.query(query, [year_level_description]);
    res.status(201).json({
      year_level_id: result.insertId,
      year_level_description,
    });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Insert failed", details: err.message });
  }
});

// YEAR LEVEL TABLE (UPDATED!)
app.get("/get_year_level", async (req, res) => {
  const query = "SELECT * FROM year_level_table";

  try {
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: "Failed to retrieve year level data", details: err.message });
  }
});

// SEMESTER PANEL (UPDATED!)
app.post("/semesters", async (req, res) => {
  const { semester_description } = req.body;

  if (!semester_description) {
    return res.status(400).json({ error: "semester_description is required" });
  }

  const query = "INSERT INTO semester_table (semester_description) VALUES (?)";

  try {
    const [result] = await db3.query(query, [semester_description]);
    res.status(201).json({
      semester_id: result.insertId,
      semester_description,
    });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Insert failed", details: err.message });
  }
});

// SEMESTER TABLE (UPDATED!)
app.get("/get_semester", async (req, res) => {
  const query = "SELECT * FROM semester_table";

  try {
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: "Query failed", details: err.message });
  }
});

// GET SCHOOL YEAR (UPDATED!)
app.get("/school_years", async (req, res) => {
  const query = `
    SELECT sy.*, yt.year_description, s.semester_description 
    FROM active_school_year_table sy
    JOIN year_table yt ON sy.year_id = yt.year_id
    JOIN semester_table s ON sy.semester_id = s.semester_id

  `;

  try {
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch school years", details: err.message });
  }
});

// SCHOOL YEAR PANEL (UPDATED!)
app.post("/school_years", async (req, res) => {
  const { year_id, semester_id, activator } = req.body;

  if (!year_id || !semester_id) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    // If activating a school year, deactivate all others first
    if (activator === 1) {
      const deactivateQuery = `UPDATE active_school_year_table SET astatus = 0`;
      await db3.query(deactivateQuery);
    }

    // Insert new school year record
    const insertQuery = `
      INSERT INTO active_school_year_table (year_id, semester_id, astatus, active)
      VALUES (?, ?, ?, 0)
    `;
    const [result] = await db3.query(insertQuery, [year_id, semester_id, activator]);

    res.status(201).json({ school_year_id: result.insertId });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to process the school year", details: err.message });
  }
});

// UPDATE SCHOOL YEAR INFORMATION (UPDATED!)
app.put("/school_years/:id", async (req, res) => {
  const { id } = req.params;
  const { activator } = req.body;

  try {
    if (parseInt(activator) === 1) {
      // First deactivate all, then activate the selected one
      const deactivateAllQuery = "UPDATE active_school_year_table SET astatus = 0";
      await db3.query(deactivateAllQuery);

      const activateQuery = "UPDATE active_school_year_table SET astatus = 1 WHERE id = ?";
      await db3.query(activateQuery, [id]);

      return res.status(200).json({ message: "School year activated and others deactivated" });
    } else {
      // Just deactivate the selected one
      const query = "UPDATE active_school_year_table SET astatus = 0 WHERE id = ?";
      await db3.query(query, [id]);

      return res.status(200).json({ message: "School year deactivated" });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to update school year", details: err.message });
  }
});

// ROOM CREATION (UPDATED!)
app.post("/room", async (req, res) => {
  const { room_name } = req.body;

  try {
    const insertQuery = "INSERT INTO room_table (room_description) VALUES (?)";
    const [result] = await db3.query(insertQuery, [room_name]);
    res.status(200).send({ message: "Room Successfully Created", result });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/room_list", async (req, res) => {
  try {
    const getQuery = "SELECT * FROM room_table";
    const [result] = await db3.query(getQuery);
    res.status(200).send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// ROOM LIST (UPDATED!)
app.get("/get_room", async (req, res) => {
  const { department_id } = req.query;

  if (!department_id) {
    return res.status(400).json({ error: "Department ID is required" });
  }

  const getRoomQuery = `
      SELECT r.room_id, r.room_description, d.dprtmnt_name
      FROM room_table r
      INNER JOIN dprtmnt_room_table drt ON r.room_id = drt.room_id
      INNER JOIN dprtmnt_table d ON drt.dprtmnt_id = d.dprtmnt_id
      WHERE drt.dprtmnt_id = ?
  `;

  try {
    const [result] = await db3.query(getRoomQuery, [department_id]);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: "Failed to fetch rooms", details: err.message });
  }
});

// DEPARTMENT ROOM PANEL (UPDATED!)
app.get("/api/assignments", async (req, res) => {
  const query = `
    SELECT 
      drt.dprtmnt_room_id, 
      drt.room_id,  
      dt.dprtmnt_id, 
      dt.dprtmnt_name, 
      dt.dprtmnt_code, 
      rt.room_description
    FROM dprtmnt_room_table drt
    INNER JOIN dprtmnt_table dt ON drt.dprtmnt_id = dt.dprtmnt_id
    INNER JOIN room_table rt ON drt.room_id = rt.room_id
  `;

  try {
    const [results] = await db3.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching assignments:", err);
    res.status(500).json({ error: "Failed to fetch assignments", details: err.message });
  }
});

// POST ROOM DEPARTMENT (UPDATED!)
app.post("/api/assign", async (req, res) => {
  const { dprtmnt_id, room_id } = req.body;

  if (!dprtmnt_id || !room_id) {
    return res.status(400).json({ message: "Department and Room ID are required" });
  }

  try {
    // Check if the room is already assigned to the department
    const checkQuery = `
      SELECT * FROM dprtmnt_room_table 
      WHERE dprtmnt_id = ? AND room_id = ?
    `;
    const [checkResults] = await db3.query(checkQuery, [dprtmnt_id, room_id]);

    if (checkResults.length > 0) {
      return res.status(400).json({ message: "Room already assigned to this department" });
    }

    // Assign the room to the department
    const insertQuery = `
      INSERT INTO dprtmnt_room_table (dprtmnt_id, room_id)
      VALUES (?, ?)
    `;
    const [insertResult] = await db3.query(insertQuery, [dprtmnt_id, room_id]);

    return res.json({ message: "Room successfully assigned to department", insertId: insertResult.insertId });
  } catch (err) {
    console.error("Error assigning room:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

app.delete("/api/unassign/:dprtmnt_room_id", async (req, res) => {
  const { dprtmnt_room_id } = req.params;

  if (!dprtmnt_room_id) {
    return res.status(400).json({ message: "Assignment ID is required" });
  }

  try {
    const deleteQuery = `
      DELETE FROM dprtmnt_room_table WHERE dprtmnt_room_id = ?
    `;
    const [result] = await db3.query(deleteQuery, [dprtmnt_room_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Room assignment not found" });
    }

    return res.json({ message: "Room successfully unassigned" });
  } catch (err) {
    console.error("Error unassigning room:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// SECTIONS (UPDATED!)
app.post("/section_table", async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: "Description is required" });
  }

  try {
    const query = "INSERT INTO section_table (description) VALUES (?)";
    const [result] = await db3.query(query, [description]);
    res.status(201).json({ message: "Section created successfully", sectionId: result.insertId });
  } catch (err) {
    console.error("Error inserting section:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// SECTIONS LIST (UPDATED!)
app.get("/section_table", async (req, res) => {
  try {
    const query = "SELECT * FROM section_table";
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching sections:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// UPDATE SECTIONS (SUPERADMIN)

// DELETE SECTIONS (SUPERADMIN)

// DEPARTMENT SECTIONS (UPDATED!)
app.post("/department_section", async (req, res) => {
  const { curriculum_id, section_id } = req.body;

  if (!curriculum_id || !section_id) {
    return res.status(400).json({ error: "Curriculum ID and Section ID are required" });
  }

  try {
    const query = "INSERT INTO dprtmnt_section_table (curriculum_id, section_id, dsstat) VALUES (?, ?, 0)";
    const [result] = await db3.query(query, [curriculum_id, section_id]);

    res.status(201).json({ message: "Department section created successfully", sectionId: result.insertId });
  } catch (err) {
    console.error("Error inserting department section:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/department_section", async (req, res) => {
  try {
    const query = `
      SELECT 
        pt.program_code,  
        yt.year_description,
        st.description AS section_description
      FROM dprtmnt_section_table dst
      INNER JOIN curriculum_table ct ON dst.curriculum_id = ct.curriculum_id
      INNER JOIN program_table pt ON ct.program_id = pt.program_id
      INNER JOIN year_table yt ON ct.year_id = yt.year_id
      INNER JOIN section_table st ON dst.section_id = st.id
    `;

    const [rows] = await db3.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Fetch all professors
app.get("/api/professors", async (req, res) => {
  try {
    const [rows] = await db3.query(`
      SELECT 
        pft.prof_id,
        pft.person_id,
        pft.fname,
        pft.mname,
        pft.lname,
        pft.email,
        pft.role,
        pft.status, 
        pft.profile_image,
        MIN(dpt.dprtmnt_name) AS dprtmnt_name,
        MIN(dpt.dprtmnt_code) AS dprtmnt_code 
      FROM dprtmnt_profs_table AS dpft 
      INNER JOIN prof_table AS pft ON dpft.prof_id = pft.prof_id
      INNER JOIN dprtmnt_table AS dpt ON dpft.dprtmnt_id = dpt.dprtmnt_id
      GROUP BY pft.prof_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve professors", details: err.message });
  }
});



// ADD PROFESSOR ROUTE (Consistent with /api)
app.post("/api/register_prof", upload.single("profileImage"), async (req, res) => {
  try {
    const { person_id, fname, mname, lname, email, password, dprtmnt_id, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    let profileImage = null;
    if (req.file) {
      const year = new Date().getFullYear();
      const ext = path.extname(req.file.originalname).toLowerCase();
      const filename = `${person_id}_ProfessorProfile_${year}${ext}`;
      const filePath = path.join(__dirname, "uploads", filename);
      await fs.promises.writeFile(filePath, req.file.buffer);
      profileImage = filename;
    }

    const sql = `INSERT INTO prof_table (person_id, fname, mname, lname, email, password, role, profile_image)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [person_id, fname, mname, lname, email, hashedPassword, role, profileImage];

    const [result] = await db3.query(sql, values);
    const prof_id = result.insertId;

    const sql2 = `INSERT INTO dprtmnt_profs_table (dprtmnt_id, prof_id) VALUES (?, ?)`;
    await db3.query(sql2, [dprtmnt_id, prof_id]);

    res.status(201).json({ message: "Professor added successfully" });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Failed to add professor" });
  }
});


// Update professor info
app.put("/api/update_prof/:id", upload.single("profileImage"), async (req, res) => {
  const id = req.params.id;
  const { person_id, fname, mname, lname, email, password, dprtmnt_id, role } = req.body;

  try {
    const checkSQL = `SELECT * FROM prof_table WHERE email = ? AND prof_id != ?`;
    const [existingRows] = await db3.query(checkSQL, [email, id]);

    if (existingRows.length > 0) {
      return res.status(400).json({ error: "Email already exists for another professor." });
    }

    let profileImage = req.file ? req.file.filename : null;
    let updateSQL;
    let values;

    if (password && profileImage) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateSQL = `
        UPDATE prof_table 
        SET person_id = ?, fname = ?, mname = ?, lname = ?, email = ?, password = ?, role = ?, profile_image = ?
        WHERE prof_id = ?
      `;
      values = [person_id, fname, mname, lname, email, hashedPassword, role, profileImage, id];
    } else if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateSQL = `
        UPDATE prof_table 
        SET person_id = ?, fname = ?, mname = ?, lname = ?, email = ?, password = ?, role = ?
        WHERE prof_id = ?
      `;
      values = [person_id, fname, mname, lname, email, hashedPassword, role, id];
    } else if (profileImage) {
      updateSQL = `
        UPDATE prof_table 
        SET person_id = ?, fname = ?, mname = ?, lname = ?, email = ?, role = ?, profile_image = ?
        WHERE prof_id = ?
      `;
      values = [person_id, fname, mname, lname, email, role, profileImage, id];
    } else {
      updateSQL = `
        UPDATE prof_table 
        SET person_id = ?, fname = ?, mname = ?, lname = ?, email = ?, role = ?
        WHERE prof_id = ?
      `;
      values = [person_id, fname, mname, lname, email, role, id];
    }

    await db3.query(updateSQL, values);

    if (dprtmnt_id) {
      const [existing] = await db3.query(
        `SELECT * FROM dprtmnt_profs_table WHERE prof_id = ?`,
        [id]
      );

      if (existing.length > 0) {
        await db3.query(
          `UPDATE dprtmnt_profs_table SET dprtmnt_id = ? WHERE prof_id = ?`,
          [dprtmnt_id, id]
        );
      } else {
        await db3.query(
          `INSERT INTO dprtmnt_profs_table (dprtmnt_id, prof_id) VALUES (?, ?)`,
          [dprtmnt_id, id]
        );
      }
    }

    res.json({ success: true, message: "Professor updated successfully." });
  } catch (err) {
    console.error("Error updating professor:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});


// Toggle professor status (Active/Inactive)
app.put("/api/update_prof_status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const [result] = await db3.query(
      "UPDATE prof_table SET status = ? WHERE prof_id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Professor not found" });
    }

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ error: "Failed to update status", details: err.message });
  }
});


// GET ENROLLED STUDENTS (UPDATED!)
app.get("/get_enrolled_students/:subject_id/:department_section_id/:active_school_year_id", async (req, res) => {
  const { subject_id, department_section_id, active_school_year_id } = req.params;

  // Validate the inputs
  if (!subject_id || !department_section_id || !active_school_year_id) {
    return res.status(400).json({ message: "Subject ID, Department Section ID, and Active School Year ID are required." });
  }

  const filterStudents = `
  SELECT 
    person_table.*, 
    enrolled_subject.*, 
    time_table.*, 
    section_table.description AS section_description,
    program_table.program_description,
    program_table.program_code,
    year_level_table.year_level_description,
    semester_table.semester_description,
    course_table.course_code,
    course_table.course_description,
    room_day_table.description AS day_description,
    room_table.room_description
  FROM time_table
  INNER JOIN enrolled_subject
    ON time_table.course_id = enrolled_subject.course_id
    AND time_table.department_section_id = enrolled_subject.department_section_id
    AND time_table.school_year_id = enrolled_subject.active_school_year_id
  INNER JOIN student_numbering_table
    ON enrolled_subject.student_number = student_numbering_table.student_number
  INNER JOIN person_table
    ON student_numbering_table.person_id = person_table.person_id
  INNER JOIN dprtmnt_section_table
    ON time_table.department_section_id = dprtmnt_section_table.id
  INNER JOIN section_table
    ON dprtmnt_section_table.section_id = section_table.id
  INNER JOIN curriculum_table
    ON dprtmnt_section_table.curriculum_id = curriculum_table.curriculum_id
  INNER JOIN program_table
    ON curriculum_table.program_id = program_table.program_id
  INNER JOIN program_tagging_table
    ON program_tagging_table.course_id = time_table.course_id
    AND program_tagging_table.curriculum_id = dprtmnt_section_table.curriculum_id
  INNER JOIN year_level_table
    ON program_tagging_table.year_level_id = year_level_table.year_level_id
  INNER JOIN semester_table
    ON program_tagging_table.semester_id = semester_table.semester_id
  INNER JOIN course_table
    ON program_tagging_table.course_id = course_table.course_id
  INNER JOIN active_school_year_table
    ON time_table.school_year_id = active_school_year_table.id
  INNER JOIN room_day_table
    ON time_table.room_day = room_day_table.id
  INNER JOIN dprtmnt_room_table
    ON time_table.department_room_id = dprtmnt_room_table.dprtmnt_room_id
  INNER JOIN room_table
    ON dprtmnt_room_table.room_id = room_table.room_id
  WHERE time_table.course_id = ? 
    AND time_table.department_section_id = ? 
    AND time_table.school_year_id = ?
    AND active_school_year_table.astatus = 1;
    
`;

  try {
    // Execute the query using promise-based `execute` method
    const [result] = await db3.execute(filterStudents, [subject_id, department_section_id, active_school_year_id]);

    // Check if no students were found
    if (result.length === 0) {
      return res.status(404).json({ message: "No students found for this subject-section combination." });
    }

    // Send the response with the result
    res.json({
      totalStudents: result.length,
      students: result,
    });
  } catch (err) {
    console.error("Query failed:", err);
    return res.status(500).json({ message: "Server error while fetching students." });
  }
});

app.get("/get_subject_info/:subject_id/:department_section_id/:active_school_year_id", async (req, res) => {
  const { subject_id, department_section_id, active_school_year_id } = req.params;

  if (!subject_id || !department_section_id || !active_school_year_id) {
    return res.status(400).json({ message: "Subject ID, Department Section ID, and School Year ID are required." });
  }

  const sectionInfoQuery = `
  SELECT 
    section_table.description AS section_description,
    course_table.course_code,
    course_table.course_description,
    year_level_table.year_level_description AS year_level_description,
    year_level_table.year_level_id,
    semester_table.semester_description,
    room_table.room_description,
    time_table.school_time_start,
    time_table.school_time_end,
    program_table.program_code,
    program_table.program_description,
    room_day_table.description AS day_description
  FROM time_table
  INNER JOIN dprtmnt_section_table
    ON time_table.department_section_id = dprtmnt_section_table.id
  INNER JOIN section_table
    ON dprtmnt_section_table.section_id = section_table.id
  LEFT JOIN curriculum_table
    ON dprtmnt_section_table.curriculum_id = curriculum_table.curriculum_id
  LEFT JOIN program_table
    ON curriculum_table.program_id = program_table.program_id
  INNER JOIN course_table
    ON time_table.course_id = course_table.course_id
  LEFT JOIN program_tagging_table
    ON program_tagging_table.course_id = time_table.course_id
  LEFT JOIN year_level_table
    ON program_tagging_table.year_level_id = year_level_table.year_level_id
  LEFT JOIN semester_table
    ON program_tagging_table.semester_id = semester_table.semester_id
  LEFT JOIN room_day_table
    ON time_table.room_day = room_day_table.id
  LEFT JOIN dprtmnt_room_table
    ON time_table.department_room_id = dprtmnt_room_table.dprtmnt_room_id
  LEFT JOIN room_table
    ON dprtmnt_room_table.room_id = room_table.room_id
  WHERE time_table.course_id = ?
    AND time_table.department_section_id = ?
    AND time_table.school_year_id = ?
  LIMIT 1;
`;

  try {
    const [result] = await db3.execute(sectionInfoQuery, [subject_id, department_section_id, active_school_year_id]);

    if (result.length === 0) {
      return res.status(404).json({ message: "No section information found for this mapping." });
    }

    res.json({ sectionInfo: result[0] });
  } catch (err) {
    console.error("Section info query error:", err);
    res.status(500).json({ message: "Server error while fetching section info." });
  }
});

// UPDATE ENROLLED STUDENT'S GRADES (UPDATED!)
app.put("/add_grades", async (req, res) => {
  const { midterm, finals, final_grade, en_remarks, student_number, subject_id } = req.body;
  console.log("Received data:", { midterm, finals, final_grade, en_remarks, student_number, subject_id });

  // SQL query to update grades
  const sql = `
    UPDATE enrolled_subject 
    SET midterm = ?, finals = ?, final_grade = ?, en_remarks = ?
    WHERE student_number = ? AND course_id = ?
  `;

  try {
    // Execute the query with await to handle the promise
    const [result] = await db3.execute(sql, [midterm, finals, final_grade, en_remarks, student_number, subject_id]);

    // Check if any rows were affected (i.e., if the update was successful)
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Grades updated successfully!" });
    } else {
      res.status(404).json({ message: "No matching record found to update." });
    }
  } catch (err) {
    console.error("Failed to update grades:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/get_class_details/:selectedActiveSchoolYear/:profID', async (req, res) => {
  const { selectedActiveSchoolYear, profID } = req.params;
  try {
    const query = `
    SELECT 
        cst.course_id, 
        cst.course_description, 
        cst.course_code, 
        pt.program_code, 
        st.description AS section_description,
        rt.room_description,
        tt.school_time_start,
        tt.school_time_end,
        rdt.description AS day,
        tt.department_section_id,
        tt.school_year_id,
        COUNT(DISTINCT es.student_number) AS enrolled_students
      FROM time_table AS tt
        INNER JOIN course_table AS cst ON tt.course_id = cst.course_id
        INNER JOIN dprtmnt_section_table AS dst ON tt.department_section_id = dst.id
        INNER JOIN curriculum_table AS ct ON dst.curriculum_id = ct.curriculum_id
        INNER JOIN section_table AS st ON dst.section_id = st.id
        INNER JOIN program_table AS pt ON ct.program_id = pt.program_id
        INNER JOIN dprtmnt_room_table AS drt ON drt.dprtmnt_room_id = tt.department_room_id
        INNER JOIN room_table AS rt ON drt.room_id = rt.room_id
        INNER JOIN room_day_table AS rdt ON tt.room_day = rdt.id
        LEFT JOIN enrolled_subject AS es ON es.course_id = tt.course_id
          AND es.active_school_year_id = tt.school_year_id
          AND es.department_section_id = tt.department_section_id
        WHERE tt.school_year_id = ? AND tt.professor_id = ?
      GROUP BY cst.course_id, cst.course_description, cst.course_code, pt.program_code, st.description;
    `;
    const [result] = await db3.query(query, [selectedActiveSchoolYear, profID]);
    console.log(result);
    res.json(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});

app.get('/get_student_list/:course_id/:department_section_id/:school_year_id', async (req, res) => {
  const { course_id, department_section_id, school_year_id } = req.params;
  try {
    const query = `
    SELECT es.id as enrolled_id,snt.student_number,pst.first_name, pst.middle_name, pst.last_name, pt.program_code, st.description AS section_description, ct.course_description, ct.course_code FROM enrolled_subject AS es
      INNER JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
      INNER JOIN person_table AS pst ON snt.person_id = pst.person_id
      INNER JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN curriculum_table AS cct ON dst.curriculum_id = cct.curriculum_id
      INNER JOIN program_table AS pt ON cct.program_id = pt.program_id
      INNER JOIN course_table AS ct ON es.course_id = ct.course_id
      INNER JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
    WHERE es.course_id = ? AND es.department_section_id = ? AND es.active_school_year_id = ?
    `;
    const [result] = await db3.query(query, [course_id, department_section_id, school_year_id]);
    console.log(result);
    res.json(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});

// PROFESSOR LIST (UPDATED!)
app.get("/get_prof", async (req, res) => {
  const { department_id } = req.query;

  // Validate the input
  if (!department_id) {
    return res.status(400).json({ message: "Department ID is required." });
  }

  const getProfQuery = `
  SELECT p.*, d.dprtmnt_name
  FROM prof_table p
  INNER JOIN dprtmnt_profs_table dpt ON p.prof_id = dpt.prof_id
  INNER JOIN dprtmnt_table d ON dpt.dprtmnt_id = d.dprtmnt_id
  WHERE dpt.dprtmnt_id = ?
  `;

  try {
    // Execute the query using promise-based `execute` method
    const [result] = await db3.execute(getProfQuery, [department_id]);

    // Send the response with the result
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching professors:", err);
    return res.status(500).json({ message: "Server error while fetching professors." });
  }
});

// prof filter
app.get("/prof_list/:dprtmnt_id", async (req, res) => {
  const { dprtmnt_id } = req.params;

  try {
    const query = `SELECT pt.* FROM dprtmnt_profs_table as dpt
                  INNER JOIN prof_table as pt 
                  ON dpt.prof_id = pt.prof_id
                  INNER JOIN dprtmnt_table as dt
                  ON dt.dprtmnt_id = dpt.dprtmnt_id
                  WHERE dpt.dprtmnt_id = ? `;
    const [results] = await db3.query(query, [dprtmnt_id]);
    res.status(200).send(results);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/room_list/:dprtmnt_id", async (req, res) => {
  const { dprtmnt_id } = req.params;

  try {
    const query = `SELECT rt.* FROM dprtmnt_room_table as drt
                  INNER JOIN room_table as rt 
                  ON drt.room_id = rt.room_id
                  INNER JOIN dprtmnt_table as dt
                  ON dt.dprtmnt_id = drt.dprtmnt_id
                  WHERE drt.dprtmnt_id = ? `;
    const [results] = await db3.query(query, [dprtmnt_id]);
    res.status(200).send(results);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/section_table/:dprtmnt_id", async (req, res) => {
  const { dprtmnt_id } = req.params;

  try {
    const query = `
      SELECT st.*, pt.*
      FROM dprtmnt_curriculum_table AS dct
      INNER JOIN dprtmnt_section_table AS dst ON dct.curriculum_id = dst.curriculum_id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN curriculum_table AS ct ON dct.curriculum_id = ct.curriculum_id
      INNER JOIN program_table AS pt ON ct.program_id = pt.program_id
      WHERE dct.dprtmnt_id = ?;
    `;

    const [results] = await db3.query(query, [dprtmnt_id]);
    res.status(200).send(results);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/day_list", async (req, res) => {
  try {
    const query = "SELECT * FROM room_day_table";
    const [result] = await db3.query(query);
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

//SCHEDULE CHECKER
app.post("/api/check-subject", async (req, res) => {
  const { section_id, school_year_id, prof_id, subject_id } = req.body;

  if (!section_id || !school_year_id || !subject_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const query = `
    SELECT * FROM time_table 
    WHERE department_section_id = ? AND school_year_id = ? AND course_id = ?
  `;

  try {
    const [result] = await db3.query(query, [section_id, school_year_id, subject_id]);

    if (result.length > 0) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//CHECK CONFLICT
app.post("/api/check-conflict", async (req, res) => {
  const { day, start_time, end_time, section_id, school_year_id, prof_id, room_id, subject_id } = req.body;

  try {
    // Step 1: Check if the section + subject + school year is already assigned to another professor
    const checkSubjectQuery = `
      SELECT * FROM time_table
      WHERE department_section_id = ? AND course_id = ? AND school_year_id = ? AND professor_id != ? 
    `;
    const [subjectResult] = await db3.query(checkSubjectQuery, [section_id, subject_id, school_year_id, prof_id]);

    if (subjectResult.length > 0) {
      return res.status(409).json({ conflict: true, message: "This subject is already assigned to another professor in this section and school year." });
    }

    // Step 2: Check for overlapping time conflicts
    const checkTimeQuery = `
      SELECT * FROM time_table
      WHERE room_day = ? 
      AND school_year_id = ?
      AND (professor_id = ? OR department_section_id = ? OR department_room_id = ?) 
      AND (
        (? >= school_time_start AND ? < school_time_end) OR  
        (? > school_time_start AND ? <= school_time_end) OR  
        (school_time_start >= ? AND school_time_start < ?) OR  
        (school_time_end > ? AND school_time_end <= ?)  
      )
    `;

    const [timeResult] = await db3.query(checkTimeQuery, [day, school_year_id, prof_id, section_id, room_id, start_time, start_time, end_time, end_time, start_time, end_time, start_time, end_time]);

    if (timeResult.length > 0) {
      return res.status(409).json({ conflict: true, message: "Schedule conflict detected! Please choose a different time." });
    }

    return res.status(200).json({ conflict: false, message: "Schedule is available." });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// INSERT SCHEDULE
app.post("/api/insert-schedule", async (req, res) => {
  const { day, start_time, end_time, section_id, subject_id, prof_id, room_id, school_year_id } = req.body;

  if (!day || !start_time || !end_time || !section_id || !school_year_id || !prof_id || !room_id || !subject_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const query = `
    INSERT INTO time_table (room_day, school_time_start, school_time_end, department_section_id, course_id, professor_id, department_room_id, school_year_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    await db3.query(query, [day, start_time, end_time, section_id, subject_id, prof_id, room_id, school_year_id]);
    res.status(200).json({ message: "Schedule inserted successfully" });
  } catch (error) {
    console.error("Error inserting schedule:", error);
    res.status(500).json({ error: "Failed to insert schedule" });
  }
});

// GET STUDENTS THAT HAVE NO STUDENT NUMBER (UPDATED!)
app.get("/api/persons", async (req, res) => {
  try {
    // STEP 1: Get all eligible persons (from ENROLLMENT DB)
    const [persons] = await db.execute(`
      SELECT p.* 
      FROM admission.person_table p
      JOIN admission.person_status_table ps ON p.person_id = ps.person_id
      WHERE ps.student_registration_status = 0
      AND p.person_id NOT IN (SELECT person_id FROM enrollment.student_numbering_table)
    `);

    if (persons.length === 0) return res.json([]);

    const personIds = persons.map(p => p.person_id);

    // STEP 2: Get all applicant numbers for those person_ids (from ADMISSION DB)
    const [applicantNumbers] = await db.query(`
      SELECT applicant_number, person_id 
      FROM applicant_numbering_table 
      WHERE person_id IN (?)
    `, [personIds]);

    // Create a quick lookup map
    const applicantMap = {};
    for (let row of applicantNumbers) {
      applicantMap[row.person_id] = row.applicant_number;
    }

    // STEP 3: Merge applicant_number into each person object
    const merged = persons.map(person => ({
      ...person,
      applicant_number: applicantMap[person.person_id] || null
    }));

    res.json(merged);

  } catch (err) {
    console.error("❌ Error merging person + applicant ID:", err);
    res.status(500).send("Server error");
  }
});




// GET total number of accepted students
app.get("/api/accepted-students-count", async (req, res) => {
  try {
    const [rows] = await db3.execute(`
      SELECT COUNT(*) AS total
      FROM person_table p
      JOIN person_status_table ps ON p.person_id = ps.person_id
      WHERE ps.student_registration_status = 1
    `);

    res.json(rows[0]); // { total: 25 }
  } catch (err) {
    console.error("Error fetching accepted students count:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// ASSIGN A STUDENT NUMBER TO THAT STUDENT (UPDATED!)
app.post("/api/assign-student-number", async (req, res) => {
  const connection = await db3.getConnection();

  try {
    const { person_id } = req.body;

    if (!person_id) {
      return res.status(400).send("person_id is required");
    }

    await connection.beginTransaction();

    // Get active year
    const [yearRows] = await connection.query("SELECT * FROM year_table WHERE status = 1 LIMIT 1");
    if (yearRows.length === 0) {
      await connection.rollback();
      return res.status(400).send("No active year found");
    }
    const year = yearRows[0];

    // Get counter
    const [counterRows] = await connection.query("SELECT * FROM student_counter WHERE id = 1");
    if (counterRows.length === 0) {
      await connection.rollback();
      return res.status(400).send("No counter found");
    }
    let que_number = counterRows[0].que_number;

    // Fix: if que_number is 0, still generate '00001'
    que_number = que_number + 1;

    let numberStr = que_number.toString();
    while (numberStr.length < 5) {
      numberStr = "0" + numberStr;
    }
    const student_number = `${year.year_description}${numberStr}`;

    // Check if already assigned
    const [existingRows] = await connection.query("SELECT * FROM student_numbering_table WHERE person_id = ?", [person_id]);
    if (existingRows.length > 0) {
      await connection.rollback();
      return res.status(400).send("Student number already assigned.");
    }

    // Insert into student_numbering
    await connection.query("INSERT INTO student_numbering_table (student_number, person_id) VALUES (?, ?)", [student_number, person_id]);

    // Update counter
    await connection.query("UPDATE student_counter SET que_number = ?", [que_number]);

    // Update person_status_table
    await connection.query("UPDATE person_status_table SET student_registration_status = 1 WHERE person_id = ?", [person_id]);

    const [activeSchoolYearRows] = await connection.query("SELECT * FROM active_school_year_table WHERE astatus = 1");
    if (activeSchoolYearRows.length === 0) {
      await connection.rollback();
      return res.status(400).send("No active school year found");
    }

    const activeSchoolYear = activeSchoolYearRows[0];

    await connection.query("INSERT INTO student_status_table (student_number, active_curriculum, enrolled_status, year_level_id, active_school_year_id, control_status) VALUES (?, ?, ?, ?, ?, ?)", [student_number, 0, 0, 0, activeSchoolYear.id, 0]);
    await connection.commit();
    res.json({ student_number });
  } catch (err) {
    await connection.rollback();
    console.error("Server error:", err);
    res.status(500).send("Server error");
  } finally {
    connection.release(); // Release the connection back to the pool
  }
});


// Corrected route with parameter (UPDATED!)
app.get("/courses/:currId", async (req, res) => {
  const { currId } = req.params;

  const sql = `
    SELECT 
      ctt.program_tagging_id,
      ctt.curriculum_id,
      ctt.course_id,
      ctt.year_level_id,
      ctt.semester_id,
      s.course_code,
      s.course_description
    FROM program_tagging_table AS ctt
    INNER JOIN course_table AS s ON s.course_id = ctt.course_id

    WHERE ctt.curriculum_id = ?
    ORDER BY s.course_id ASC
  `;

  try {
    const [result] = await db3.query(sql, [currId]);
    res.json(result);
  } catch (err) {
    console.error("Error in /courses:", err);
    console.log(currId, "hello world");
    return res.status(500).json({ error: err.message });
  }
});

//(UPDATED!)

app.get("/enrolled_courses/:userId/:currId", async (req, res) => {
  const { userId, currId } = req.params;

  try {
    // Step 1: Get the active_school_year_id
    const activeYearSql = `SELECT id FROM active_school_year_table WHERE astatus = 1 LIMIT 1`;
    const [yearResult] = await db3.query(activeYearSql);

    if (yearResult.length === 0) {
      return res.status(404).json({ error: "No active school year found" });
    }

    const activeSchoolYearId = yearResult[0].id;

    const sql = `
    SELECT 
      es.id,
      es.course_id,
      c.course_code,
      c.course_description,
      st.description,
      c.course_unit,
      c.lab_unit,
      ds.id AS department_section_id,
      IFNULL(pt.program_code, 'NOT') AS program_code,
      IFNULL(pt.program_description, 'CURRENTLY') AS program_description,
      IFNULL(st.description, 'ENROLLED') AS section,
      IFNULL(rd.description, 'TBA') AS day_description,
      IFNULL(tt.school_time_start, 'TBA') AS school_time_start,
      IFNULL(tt.school_time_end, 'TBA') AS school_time_end,
      IFNULL(rtbl.room_description, 'TBA') AS room_description,
      IFNULL(prof_table.lname, 'TBA') AS lname,

      (
        SELECT COUNT(*) 
        FROM enrolled_subject es2 
        WHERE es2.active_school_year_id = es.active_school_year_id 
          AND es2.department_section_id = es.department_section_id
          AND es2.course_id = es.course_id
      ) AS number_of_enrolled

    FROM enrolled_subject AS es
    INNER JOIN course_table AS c
      ON c.course_id = es.course_id
    INNER JOIN dprtmnt_section_table AS ds
      ON ds.id = es.department_section_id
    INNER JOIN section_table AS st
      ON st.id = ds.section_id
    INNER JOIN curriculum_table AS cr
      ON cr.curriculum_id = ds.curriculum_id
    INNER JOIN program_table AS pt
      ON pt.program_id = cr.program_id
    LEFT JOIN time_table AS tt
      ON tt.school_year_id = es.active_school_year_id 
      AND tt.department_section_id = es.department_section_id 
      AND tt.course_id = es.course_id 
    LEFT JOIN room_day_table AS rd
      ON rd.id = tt.room_day
    LEFT JOIN dprtmnt_room_table as dr
      ON dr.dprtmnt_room_id = tt.department_room_id
    LEFT JOIN room_table as rtbl
      ON rtbl.room_id = dr.room_id
    LEFT JOIN prof_table 
      ON prof_table.prof_id = tt.professor_id
    WHERE es.student_number = ? 
      AND es.active_school_year_id = ?
      AND es.curriculum_id = ?
    ORDER BY c.course_id ASC;
    `;

    const [result] = await db3.query(sql, [userId, activeSchoolYearId, currId]);
    res.json(result);
  } catch (err) {
    console.error("Error in /enrolled_courses:", err);
    return res.status(500).json({ error: err.message });
  }
});


//(UPDATED!)

app.post("/add-all-to-enrolled-courses", async (req, res) => {
  const { subject_id, user_id, curriculumID, departmentSectionID } = req.body;
  console.log("Received request:", { subject_id, user_id, curriculumID, departmentSectionID });

  try {
    const activeYearSql = `SELECT id, semester_id FROM active_school_year_table WHERE astatus = 1 LIMIT 1`;
    const [yearResult] = await db3.query(activeYearSql);

    if (yearResult.length === 0) {
      return res.status(404).json({ error: "No active school year found" });
    }

    const activeSchoolYearId = yearResult[0].id;
    const activeSemesterId = yearResult[0].semester_id;
    console.log("Active semester ID:", activeSemesterId);

    const checkSql = `
      SELECT year_level_id, semester_id, curriculum_id 
      FROM program_tagging_table 
      WHERE course_id = ? AND curriculum_id = ? 
      LIMIT 1
    `;

    const [checkResult] = await db3.query(checkSql, [subject_id, curriculumID]);

    if (!checkResult.length) {
      console.warn(`Subject ${subject_id} not found in tagging table`);
      return res.status(404).json({ message: "Subject not found" });
    }

    const { year_level_id, semester_id, curriculum_id } = checkResult[0];
    console.log("Year level found:", year_level_id);
    console.log("Subject semester:", semester_id);
    console.log("Active semester:", activeSemesterId);
    console.log("Curriculum found:", curriculum_id);

    if (year_level_id !== 1 || semester_id !== activeSemesterId || curriculum_id !== curriculumID) {
      console.log(`Skipping subject ${subject_id} (not Year 1, not active semester ${activeSemesterId}, or wrong curriculum)`);
      return res.status(200).json({ message: "Skipped - Not Year 1 / Not Active Semester / Wrong Curriculum" });
    }

    const checkDuplicateSql = `
      SELECT * FROM enrolled_subject 
      WHERE course_id = ? AND student_number = ? AND active_school_year_id = ?
    `;

    const [dupResult] = await db3.query(checkDuplicateSql, [subject_id, user_id, activeSchoolYearId]);

    if (dupResult.length > 0) {
      console.log(`Skipping subject ${subject_id}, already enrolled for student ${user_id}`);
      return res.status(200).json({ message: "Skipped - Already Enrolled" });
    }

    const insertSql = `
      INSERT INTO enrolled_subject (course_id, student_number, active_school_year_id, curriculum_id, department_section_id, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db3.query(insertSql, [subject_id, user_id, activeSchoolYearId, curriculumID, departmentSectionID, 1]);
    console.log(`Student ${user_id} successfully enrolled in subject ${subject_id}`);

    const updateStatusSql = `
      UPDATE student_status_table 
      SET enrolled_status = 1, active_curriculum = ?, year_level_id = ?
      WHERE student_number = ?
    `;

    await db3.query(updateStatusSql, [curriculumID, year_level_id, user_id]);

    res.status(200).json({ message: "Course enrolled successfully" });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: err.message });
  }
});


//(UPDATED!)
app.post("/add-to-enrolled-courses/:userId/:currId/", async (req, res) => {
  const { subject_id, department_section_id } = req.body;
  const { userId, currId } = req.params;

  try {
    const activeYearSql = `SELECT id FROM active_school_year_table WHERE astatus = 1 LIMIT 1`;
    const [yearResult] = await db3.query(activeYearSql);

    if (yearResult.length === 0) {
      return res.status(404).json({ error: "No active school year found" });
    }

    const activeSchoolYearId = yearResult[0].id;

    const sql = "INSERT INTO enrolled_subject (course_id, student_number, active_school_year_id, curriculum_id, department_section_id) VALUES (?, ?, ?, ?, ?)";
    await db3.query(sql, [subject_id, userId, activeSchoolYearId, currId, department_section_id]);
    res.json({ message: "Course enrolled successfully" });
  } catch (err) {
    return res.status(500).json(err);
  }
});

// Delete course by subject_id (UPDATED!)
app.delete("/courses/delete/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const sql = "DELETE FROM enrolled_subject WHERE id = ?";
    await db3.query(sql, [id]);
    res.json({ message: "Course unenrolled successfully" });
  } catch (err) {
    return res.status(500).json(err);
  }
});

// Delete all courses for user (UPDATED!)
app.delete("/courses/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const activeYearSql = `SELECT id FROM active_school_year_table WHERE astatus = 1 LIMIT 1`;
    const [yearResult] = await db3.query(activeYearSql);

    if (yearResult.length === 0) {
      return res.status(404).json({ error: "No active school year found" });
    }

    const activeSchoolYearId = yearResult[0].id;

    const sql = "DELETE FROM enrolled_subject WHERE student_number = ? AND active_school_year_id = ?";
    await db3.query(sql, [userId, activeSchoolYearId]);
    res.json({ message: "All courses unenrolled successfully" });
  } catch (err) {
    return res.status(500).json(err);
  }
});

// Login User (UPDATED!)

app.post("/student-tagging", async (req, res) => {
  const { studentNumber } = req.body;

  if (!studentNumber) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const sql = `
    SELECT 
        ss.id AS student_status_id, 
        ptbl.person_id,
        ss.student_number,
        st.description AS section_description,
        ss.active_curriculum,
        pt.program_id,
        pt.major,
        pt.program_description,
        pt.program_code,
        ylt.year_level_id,
        ylt.year_level_description,
        yt.year_description,
        ptbl.first_name,
        ptbl.middle_name,
        ptbl.last_name,
        ptbl.age,
        ptbl.gender,
        ptbl.emailAddress,
        ptbl.program,
        ptbl.profile_img,
        ptbl.extension,
        es.status AS enrolled_status
    FROM student_status_table AS ss 
    LEFT JOIN curriculum_table AS c ON c.curriculum_id = ss.active_curriculum 
    LEFT JOIN program_table AS pt ON c.program_id = pt.program_id 
    LEFT JOIN year_table AS yt ON c.year_id = yt.year_id 
    INNER JOIN student_numbering_table AS sn ON sn.student_number = ss.student_number 
    INNER JOIN person_table AS ptbl ON ptbl.person_id = sn.person_id 
    LEFT JOIN year_level_table AS ylt ON ss.year_level_id = ylt.year_level_id 
    LEFT JOIN enrolled_subject AS es ON ss.student_number = es.student_number 
    LEFT JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
    LEFT JOIN section_table AS st ON dst.section_id = st.id 
    WHERE ss.student_number = ?;
    `;

    const [results] = await db3.query(sql, [studentNumber]);

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid Student Number" });
    }

    const student = results[0];

    console.log(student)
    const isEnrolled = student.enrolled_status === 1;

    const token = webtoken.sign(
      {
        id: student.student_status_id,
        person_id: student.person_id,
        studentNumber: student.student_number,
        section: student.section_description,
        activeCurriculum: student.active_curriculum,
        major: student.major,
        yearLevel: student.year_level_id,
        yearLevelDescription: student.year_level_description,
        courseCode: isEnrolled ? student.program_code : "Not",
        courseDescription: isEnrolled ? student.program_description : "Enrolled",
        department: student.dprtmnt_name,
        yearDesc: student.year_description,
        firstName: student.first_name,
        middleName: student.middle_name,
        lastName: student.last_name,
        age: student.age,
        gender: student.gender,
        email: student.emailAddress,
        program: student.program,
        profile_img: student.profile_img,
        extension: student.extension,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log("Search response:", {
      token,
      studentNumber: student.student_number,
      person_id: student.person_id,
      activeCurriculum: student.active_curriculum,
      section: student.section_description,
      major: student.major,
      yearLevel: student.year_level_id,
      yearLevelDescription: student.year_level_description,
      courseCode: student.program_code,
      courseDescription: student.program_description,
      department: student.dprtmnt_name,
      yearDesc: student.year_description,
      firstName: student.first_name,
      middleName: student.middle_name,
      lastName: student.last_name,
      age: student.age,
      gender: student.gender,
      email: student.emailAddress,
      program: student.program,
      profile_img: student.profile_img,
      extension: student.extension,
    });

    res.json({
      message: "Search successful",
      token,
      studentNumber: student.student_number,
      person_id: student.person_id,
      section: student.section_description,
      activeCurriculum: student.active_curriculum,
      major: student.major,
      yearLevel: student.year_level_id,
      yearLevelDescription: student.year_level_description,
      courseCode: isEnrolled ? student.program_code : "Not",
      courseDescription: isEnrolled ? student.program_description : "Enrolled",
      department: student.dprtmnt_name,
      yearDesc: student.year_description,
      firstName: student.first_name,
      middleName: student.middle_name,
      lastName: student.last_name,
      age: student.age,
      gender: student.gender,
      email: student.emailAddress,
      program: student.program,
      profile_img: student.profile_img,
      extension: student.extension,
    });
  } catch (err) {
    console.error("SQL error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

let lastSeenId = 0;

// ✅ Updates year_level_id for a student
app.put("/api/update-student-year", async (req, res) => {
  const { student_number, year_level_id } = req.body;

  if (!student_number || !year_level_id) {
    return res.status(400).json({ error: "Missing student_number or year_level_id" });
  }

  try {
    const sql = `UPDATE student_status_table SET year_level_id = ? WHERE student_number = ?`;
    const [result] = await db3.query(sql, [year_level_id, student_number]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Year level updated successfully" });
  } catch (err) {
    console.error("Error updating year level:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// (UPDATED!)
app.get("/check-new", async (req, res) => {
  try {
    const [results] = await db3.query("SELECT * FROM enrolled_subject ORDER BY id DESC LIMIT 1");

    if (results.length > 0) {
      const latest = results[0];
      const isNew = latest.id > lastSeenId;
      if (isNew) {
        lastSeenId = latest.id;
      }
      res.json({ newData: isNew, data: latest });
    } else {
      res.json({ newData: false });
    }
  } catch (err) {
    return res.status(500).json({ error: err });
  }
});

// (UPDATED!)
app.get("/api/department-sections", async (req, res) => {
  const { departmentId } = req.query;

  const query = `
    SELECT 
      dt.dprtmnt_id, 
      dt.dprtmnt_name, 
      dt.dprtmnt_code, 
      c.year_id, 
      c.program_id, 
      c.curriculum_id, 
      ds.id as department_and_program_section_id, 
      ds.section_id, 
      pt.program_description, 
      pt.program_code, 
      pt.major, 
      st.description, 
      st.id as section_id
      FROM dprtmnt_table as dt
        INNER JOIN dprtmnt_curriculum_table as dc ON dc.dprtmnt_id  = dt.dprtmnt_id
        INNER JOIN curriculum_table as c ON c.curriculum_id = dc.curriculum_id
        INNER JOIN dprtmnt_section_table as ds ON ds.curriculum_id = c.curriculum_id
        INNER JOIN program_table as pt ON c.program_id = pt.program_id
        INNER JOIN section_table as st ON st.id = ds.section_id
      WHERE dt.dprtmnt_id = ?
    ORDER BY ds.id
  `;

  try {
    const [results] = await db3.query(query, [departmentId]);
    res.status(200).json(results);
    console.log(results);
  } catch (err) {
    console.error("Error fetching department sections:", err);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

app.put("/api/update-active-curriculum", async (req, res) => {
  const { studentId, departmentSectionId } = req.body;

  if (!studentId || !departmentSectionId) {
    return res.status(400).json({ error: "studentId and departmentSectionId are required" });
  }

  const fetchCurriculumQuery = `
    SELECT curriculum_id
    FROM dprtmnt_section_table
    WHERE id = ?
  `;

  try {
    const [curriculumResult] = await db3.query(fetchCurriculumQuery, [departmentSectionId]);

    if (curriculumResult.length === 0) {
      return res.status(404).json({ error: "Section not found" });
    }

    const curriculumId = curriculumResult[0].curriculum_id;

    const updateQuery = `
      UPDATE student_status_table 
      SET active_curriculum = ? 
      WHERE student_number = ?
    `;
    const result = await db3.query(updateQuery, [curriculumId, studentId]);
    const data = result[0];
    console.log(data)
    res.status(200).json({
      message: "Active curriculum updated successfully",
    });

  } catch (err) {
    console.error("Error updating active curriculum:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

app.get('/api/search-student/:sectionId', async (req, res) => {
  const { sectionId } = req.params
  try {
    const getProgramQuery = `
      SELECT dst.curriculum_id, pt.program_description, pt.program_code 
      FROM dprtmnt_section_table AS dst
        INNER JOIN curriculum_table AS ct ON dst.curriculum_id = ct.curriculum_id
        INNER JOIN program_table AS pt ON ct.program_id = pt.program_id
      WHERE dst.id = ?
    `;
    const [programResult] = await db3.query(getProgramQuery, [sectionId]);
    res.status(200).json(programResult);
  } catch (err) {
    console.error("Error updating active curriculum:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});




// Express route (UPDATED!)
app.get("/departments", async (req, res) => {
  const sql = "SELECT dprtmnt_id, dprtmnt_code FROM dprtmnt_table";

  try {
    const [result] = await db3.query(sql);
    res.json(result);
  } catch (err) {
    console.error("Error fetching departments:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Count how many students enrolled per subject for a selected section (UPDATED!)
app.get("/subject-enrollment-count", async (req, res) => {
  const { sectionId } = req.query; // department_section_id

  try {
    const activeYearSql = `SELECT id FROM active_school_year_table WHERE astatus = 1 LIMIT 1`;
    const [yearResult] = await db3.query(activeYearSql);

    if (yearResult.length === 0) {
      return res.status(404).json({ error: "No active school year found" });
    }

    const activeSchoolYearId = yearResult[0].id;

    const sql = `
      SELECT 
        es.course_id,
        COUNT(*) AS enrolled_count
      FROM enrolled_subject AS es
      WHERE es.active_school_year_id = ?
        AND es.department_section_id = ?
      GROUP BY es.course_id
    `;

    const [result] = await db3.query(sql, [activeSchoolYearId, sectionId]);
    res.json(result); // [{ course_id: 1, enrolled_count: 25 }, { course_id: 2, enrolled_count: 30 }]
  } catch (err) {
    console.error("Error fetching enrolled counts:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Get user by person_id (UPDATED!)
app.get("/api/user/:person_id", async (req, res) => {
  const { person_id } = req.params;

  try {
    const sql = "SELECT profile_img FROM person_table WHERE person_id = ?";
    const [results] = await db3.query(sql, [person_id]);

    if (results.length === 0) {
      return res.status(404).send("User not found");
    }

    res.json(results[0]);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).send("Database error");
  }
});

// GET GRADING PERIOD (UPDATED!)
app.get("/get-grading-period", async (req, res) => {
  try {
    const sql = "SELECT * FROM period_status";
    const [result] = await db3.query(sql);

    res.json(result);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).send("Error fetching data");
  }
});

// ACTIVATOR API OF GRADING PERIOD (UPDATED!)
app.post("/grade_period_activate/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const sql1 = "UPDATE period_status SET status = 0";
    await db3.query(sql1);

    const sql2 = "UPDATE period_status SET status = 1 WHERE id = ?";
    await db3.query(sql2, [id]);

    res.status(200).json({ message: "Grading period activated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to activate grading period" });
  }
});

// API TO GET PROFESSOR PERSONAL DATA
app.get("/get_prof_data/:id", async (req, res) => {
  const id = req.params.id;

  const query = `
    SELECT pt.prof_id, pt.profile_image, pt.email, pt.fname, pt.mname, pt.lname FROM prof_table AS pt
    WHERE pt.person_id = ?
  `;

  try {
    const [rows] = await db3.query(query, [id]);
    console.log(rows);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/course_assigned_to/:userID', async (req, res) => {
  const { userID } = req.params;

  try {
    const sql = `
    SELECT DISTINCT tt.course_id, ct.course_description, ct.course_code FROM time_table AS tt
      INNER JOIN course_table AS ct ON tt.course_id = ct.course_id
      INNER JOIN prof_table AS pt ON tt.professor_id = pt.prof_id
      INNER JOIN active_school_year_table AS sy ON tt.school_year_id = sy.id
    WHERE pt.person_id = 78 AND sy.astatus = 1
    `
    const [result] = await db3.query(sql, [userID]);
    res.json(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});

app.get('/handle_section_of/:userID/:selectedCourse/:selectedActiveSchoolYear', async (req, res) => {
  const { userID, selectedCourse, selectedActiveSchoolYear } = req.params;


  try {
    const sql = `
    SELECT tt.department_section_id, ptbl.program_code, st.description AS section_description FROM time_table AS tt
      INNER JOIN prof_table AS pt ON tt.professor_id = pt.prof_id
      INNER JOIN dprtmnt_section_table AS dst ON tt.department_section_id = dst.id
      INNER JOIN curriculum_table AS ct ON dst.curriculum_id = ct.curriculum_id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN program_table AS ptbl ON ct.program_id = ptbl.program_id
      INNER JOIN active_school_year_table AS sy ON tt.school_year_id = sy.id
      INNER JOIN year_table AS yt ON sy.year_id = yt.year_id
    WHERE pt.person_id = ? AND tt.course_id = ? AND sy.id = ? ORDER BY section_description
    `
    const [result] = await db3.query(sql, [userID, selectedCourse, selectedActiveSchoolYear]);
    res.json(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});

app.get('/get_school_year', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT 
        year_id, 
        year_description AS current_year, 
        year_description + 1 AS next_year 
      FROM year_table ORDER BY current_year;
    `;
    const [result] = await db3.query(query);
    console.log(result);
    res.json(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});

app.get('/get_school_semester', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT 
        semester_id,semester_description, semester_code
      FROM semester_table ORDER BY semester_code;
    `;
    const [result] = await db3.query(query);
    console.log(result);
    res.json(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});

app.get('/active_school_year', async (req, res) => {
  try {
    const query = `
    SELECT
    asyt.id AS school_year_id,
    yt.year_id, 
    st.semester_id,
    yt.year_description AS current_year, 
    yt.year_description + 1 AS next_year,
    st.semester_description
  FROM active_school_year_table AS asyt 
    INNER JOIN year_table AS yt ON asyt.year_id = yt.year_id
    INNER JOIN semester_table AS st ON asyt.semester_id = st.semester_id
  WHERE asyt.astatus = 1
    `;
    const [result] = await db3.query(query);
    console.log(result);
    res.json(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});

app.get('/get_selecterd_year/:selectedSchoolYear/:selectedSchoolSemester', async (req, res) => {
  const { selectedSchoolYear, selectedSchoolSemester } = req.params;
  try {
    const query = `
    SELECT
    asyt.id AS school_year_id
  FROM active_school_year_table AS asyt 
    INNER JOIN year_table AS yt ON asyt.year_id = yt.year_id
    INNER JOIN semester_table AS st ON asyt.semester_id = st.semester_id
  WHERE yt.year_id = ? AND st.semester_id = ?
    `;
    const [result] = await db3.query(query, [selectedSchoolYear, selectedSchoolSemester]);
    console.log(result);
    res.json(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});


app.get('/enrolled_student_list/:userID/:selectedCourse/:department_section_id', async (req, res) => {
  const { userID, selectedCourse, department_section_id } = req.params;

  try {
    const sql = `
    SELECT DISTINCT
      es.student_number, 
      ptbl.last_name, 
      ptbl.first_name, 
      ptbl.middle_name, 
      es.midterm, 
      es.finals, 
      es.final_grade, 
      es.en_remarks,
      st.description AS section_description,
      pgt.program_code
    FROM enrolled_subject AS es
      INNER JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
      INNER JOIN person_table AS ptbl ON snt.person_id = ptbl.person_id
      INNER JOIN time_table AS tt ON es.department_section_id = tt.department_section_id
      INNER JOIN prof_table AS pt ON tt.professor_id = pt.prof_id
      INNER JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN curriculum_table AS ct ON es.curriculum_id = ct.curriculum_id
      INNER JOIN program_table AS pgt ON ct.program_id = pgt.program_id
    WHERE pt.person_id = ? AND es.course_id = ? AND es.department_section_id = ?
    `
    const [result] = await db3.query(sql, [userID, selectedCourse, department_section_id]);
    res.json(result);
  } catch (err) {
    console.error("Server Error: ", err);
    res.status(500).send({ message: "Internal Error", err });
  }
});



// API ROOM SCHEDULE
app.get("/get_room/:profID/:roomID", async (req, res) => {
  const { profID, roomID } = req.params;

  const query = `
    SELECT 
      t.room_day,
      d.description as day,
      t.school_time_start AS start_time,
      t.school_time_end AS end_time,
      rt.room_description
    FROM time_table t
    JOIN room_day_table d ON d.id = t.room_day
    INNER JOIN dprtmnt_room_table drt ON drt.dprtmnt_room_id = t.department_room_id
    INNER JOIN room_table rt ON rt.room_id = drt.room_id
    INNER JOIN active_school_year_table asy ON t.school_year_id = asy.id
    WHERE t.professor_id = ? AND t.department_room_id = ? AND asy.astatus = 1
  `;
  try {
    const [result] = await db3.query(query, [profID, roomID]);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "ERROR:", error });
  }
});

app.delete("/upload/:id", async (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM requirement_uploads WHERE upload_id = ?";

  try {
    const [result] = await db.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Requirement not found" });
    }

    res.status(200).json({ message: "Requirement deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete requirement" });
  }
});

app.get("/api/professor-schedule/:profId", async (req, res) => {
  const profId = req.params.profId;

  try {
    const [results] = await db3.execute(
      `
      SELECT 
        t.room_day,
        d.description as day,
        t.school_time_start AS start_time,
        t.school_time_end AS end_time
      FROM time_table t
      JOIN room_day_table d ON d.id = t.room_day
      INNER JOIN active_school_year_table asy ON t.school_year_id = asy.id
      WHERE t.professor_id = ? AND asy.astatus = 1
    `,
      [profId]
    );

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Error");
  }
});

app.get("/api/student-dashboard/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = `SELECT snt.student_number, pt.* FROM student_numbering_table as snt
      INNER JOIN person_table as pt ON snt.person_id = pt.person_id
      WHERE snt.person_id = ?
    `;
    const [result] = await db3.query(query, [id]);
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("DB ERROR");
  }
});

/* CODE NI MARK */
app.get("/student-data/:studentNumber", async (req, res) => {
  const studentNumber = req.params.studentNumber;

  const query = `
  SELECT   
      sn.student_number,
      p.person_id,
      p.profile_img,
      p.last_name,
      p.middle_name,
      p.first_name,
      p.extension,
      p.gender,
      p.age,
      p.emailAddress AS email,
      ss.active_curriculum AS curriculum,
      ss.year_level_id AS yearlevel,
      prog.program_description AS program,
      d.dprtmnt_name AS college
  FROM student_numbering_table sn
  INNER JOIN person_table p ON sn.person_id = p.person_id
  INNER JOIN student_status_table ss ON ss.student_number = sn.student_number
  INNER JOIN curriculum_table c ON ss.active_curriculum = c.curriculum_id
  INNER JOIN program_table prog ON c.program_id = prog.program_id
  INNER JOIN dprtmnt_curriculum_table dc ON c.curriculum_id = dc.curriculum_id
  INNER JOIN year_table yt ON c.year_id = yt.year_id
  INNER JOIN dprtmnt_table d ON dc.dprtmnt_id = d.dprtmnt_id
  WHERE sn.student_number = ?;
`;

  try {
    const [results] = await db3.query(query, [studentNumber]);
    res.json(results[0] || {});
  } catch (err) {
    console.error("Failed to fetch student data:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// EXAM API ENDPOINTS
app.get('/exam_slots', async (req, res) => {
  const sql = `
    SELECT 
      s.exam_id,
      s.exam_date,
      s.exam_start_time,
      s.exam_end_time,
      COUNT(ea.schedule_id) AS occupied
    FROM exam_schedule s
    LEFT JOIN exam_applicants ea ON s.exam_id = ea.schedule_id
    GROUP BY s.exam_id
  `;

  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Database error fetching slots:', err);
    res.status(500).json({ error: 'Database error fetching slots' });
  }
});

app.post('/add_exam_slot', async (req, res) => {
  const { exam_date, start_time, end_time } = req.body;

  if (!exam_date || !start_time || !end_time) {
    return res.status(400).json({ error: 'All fields are required (date, start time, end time).' });
  }

  const sql = `
    INSERT INTO exam_schedule (exam_date, exam_start_time, exam_end_time)
    VALUES (?, ?, ?)
  `;

  try {
    const [result] = await db.query(sql, [exam_date, start_time, end_time]);
    res.json({ message: 'Slot added successfully', insertId: result.insertId });
  } catch (err) {
    console.error('Error inserting new exam slot:', err);
    res.status(500).json({ error: 'Failed to add exam slot' });
  }
});

app.post('/applicant_schedule', async (req, res) => {
  const { applicant_id, exam_id } = req.body;

  if (!applicant_id || !exam_id) {
    return res.status(400).json({ error: 'Applicant ID and Exam ID are required.' });
  }

  const query = `INSERT INTO exam_applicants (applicant_id, schedule_id) VALUES (?, ?)`;

  try {
    const [result] = await db.query(query, [applicant_id, exam_id]);
    res.json({ message: 'Applicant scheduled successfully', insertId: result.insertId });
  } catch (err) {
    console.error('Database error adding applicant to schedule:', err);
    res.status(500).json({ error: 'Database error adding applicant to schedule' });
  }
});

app.get('/get_applicant_schedule', async (req, res) => {
  const query = `
    SELECT * 
    FROM person_status_table 
    WHERE exam_status = 0 
      AND applicant_id NOT IN (
        SELECT applicant_id 
        FROM exam_applicants
      )
  `;

  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Database error fetching unscheduled applicants:', err);
    res.status(500).json({ error: 'Database error fetching unscheduled applicants' });
  }
});

app.get('/get_exam_date', async (req, res) => {
  const query = `SELECT * FROM exam_schedule`;

  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Database error fetching exam dates:', err);
    res.status(500).json({ error: 'Database error fetching exam dates' });
  }
});

app.get('/slot_count/:exam_id', async (req, res) => {
  const exam_id = req.params.exam_id;
  const sql = `SELECT COUNT(*) AS count FROM exam_applicants WHERE schedule_id = ?`;

  try {
    const [results] = await db.query(sql, [exam_id]);
    res.json({ occupied: results[0].count });
  } catch (err) {
    console.error('Database error getting slot count:', err);
    res.status(500).json({ error: 'Database error getting slot count' });
  }
});

// GET person details by person_id including program and student_number
app.get("/api/person/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(`
      SELECT 
        p.*, 
        st.student_number,
        ct.curriculum_id,
        pt.program_description AS program
        pt.major AS major
      FROM person_table AS p
      LEFT JOIN student_numbering_table AS st ON st.person_id = p.person_id
      LEFT JOIN curriculum_table AS ct ON ct.curriculum_id = p.program
      LEFT JOIN program_table AS pt ON pt.program_id = ct.program_id
      WHERE p.person_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Person not found" });
    }

    res.json(rows[0]); // ✅ Send single merged result
  } catch (err) {
    console.error("Error fetching person details:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Program Display
app.get('/class_roster/ccs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        dct.dprtmnt_id, dt.dprtmnt_name, dt.dprtmnt_code, 
        pt.program_id, pt.program_description, pt.program_code, 
        ct.curriculum_id
      FROM dprtmnt_curriculum_table as dct 
      INNER JOIN dprtmnt_table as dt ON dct.dprtmnt_id = dt.dprtmnt_id
      INNER JOIN curriculum_table as ct ON dct.curriculum_id = ct.curriculum_id 
      INNER JOIN program_table as pt ON ct.program_id = pt.program_id 
      -- LEFT JOIN year_table as yt ON ct.year_id = yt.year_id -- optional
      WHERE dct.dprtmnt_id = ?;
    `;

    const [programRows] = await db3.execute(query, [id]);

    if (programRows.length === 0) {
      return res.json([]); // empty array instead of error
    }

    res.json(programRows);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Curriculum Section 
app.get('/class_roster/:cID', async (req, res) => {
  const { cID } = req.params;
  try {
    const query = `
      SELECT ct.curriculum_id, st.description, dst.id from dprtmnt_section_table AS dst 
        INNER JOIN curriculum_table AS ct ON dst.curriculum_id = ct.curriculum_id 
        INNER JOIN section_table AS st ON dst.section_id = st.id 
      WHERE ct.curriculum_id = ?;
    `

    const [sectionList] = await db3.execute(query, [cID]);

    res.json(sectionList);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// prof list base dun curriculum id tsaka sa section id
app.get('/class_roster/:cID/:dstID', async (req, res) => {
  const { cID, dstID } = req.params;
  try {
    const query = `
    SELECT DISTINCT cst.course_id, pft.prof_id, tt.department_section_id, pft.fname, pft.lname, pft.mname, cst.course_description, cst.course_code, st.description AS section_description, pgt.program_code FROM time_table AS tt
      INNER JOIN dprtmnt_section_table AS dst ON tt.department_section_id = dst.id
      INNER JOIN curriculum_table AS cmt ON dst.curriculum_id = cmt.curriculum_id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN course_table AS cst ON tt.course_id = cst.course_id
      INNER JOIN prof_table AS pft ON tt.professor_id = pft.prof_id
      INNER JOIN program_table AS pgt ON cmt.program_id = pgt.program_id
      INNER JOIN active_school_year_table AS asyt ON tt.school_year_id = asyt.id
    WHERE dst.curriculum_id = ? AND tt.department_section_id = ? AND asyt.astatus = 1
    `
    const [profList] = await db3.execute(query, [cID, dstID]);

    console.log(profList);
    res.json(profList);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
})

// Student Information
app.get('/class_roster/student_info/:cID/:dstID/:courseID/:professorID', async (req, res) => {
  const { cID, dstID, courseID, professorID } = req.params;
  try {
    const query = `
    SELECT DISTINCT
      es.student_number, 
      pst.first_name, pst.middle_name, pst.last_name, 
      pgt.program_description, pgt.program_code
    FROM enrolled_subject AS es
      INNER JOIN time_table AS tt ON es.department_section_id = tt.department_section_id
      INNER JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
      INNER JOIN active_school_year_table AS asyt ON es.active_school_year_id = asyt.id
      INNER JOIN student_status_table AS sst ON es.student_number = sst.student_number
      INNER JOIN student_numbering_table AS snt ON sst.student_number = snt.student_number
      INNER JOIN person_table AS pst ON snt.person_id = pst.person_id
      INNER JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
      INNER JOIN program_tagging_table AS ptt ON es.course_id = ptt.course_id
      INNER JOIN program_table AS pgt ON cct.program_id = pgt.program_id
    WHERE es.curriculum_id = ? AND es.department_section_id = ? AND asyt.astatus = 1 AND es.course_id = ? AND tt.professor_id = ? ORDER BY pst.last_name
    `

    const [studentList] = await db3.execute(query, [cID, dstID, courseID, professorID])
    console.log(studentList);
    res.json(studentList);

  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
})

// Class Information
app.get('/class_roster/classinfo/:cID/:dstID/:courseID/:professorID', async (req, res) => {
  const { cID, dstID, courseID, professorID } = req.params;
  try {
    const query = `
    SELECT DISTINCT
      st.description AS section_Description,
      pft.fname, pft.mname, pft.lname, pft.prof_id,
      smt.semester_description,
      ylt.year_level_description,
      ct.course_description, ct.course_code, ct.course_unit, ct.lab_unit, ct.course_id,
      yt.year_description,
      rdt.description as day,
      tt.school_time_start,
      tt.school_time_end
    FROM enrolled_subject AS es
      INNER JOIN time_table AS tt ON es.department_section_id = tt.department_section_id
      INNER JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
      INNER JOIN section_table AS st ON dst.section_id = st.id
      INNER JOIN active_school_year_table AS asyt ON es.active_school_year_id = asyt.id
      INNER JOIN prof_table AS pft ON tt.professor_id = pft.prof_id
      INNER JOIN course_table AS ct ON es.course_id = ct.course_id
      INNER JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
      INNER JOIN program_tagging_table AS ptt ON es.course_id = ptt.course_id
      INNER JOIN program_table AS pgt ON cct.program_id = pgt.program_id
      INNER JOIN year_table AS yt ON cct.year_id = yt.year_id
      INNER JOIN year_level_table AS ylt ON ptt.year_level_id = ylt.year_level_id
      INNER JOIN semester_table AS smt ON ptt.semester_id = smt.semester_id
      INNER JOIN room_day_table AS rdt ON tt.room_day = rdt.id
    WHERE es.curriculum_id = ? AND es.department_section_id = ? AND asyt.astatus = 1 AND es.course_id = ? AND tt.professor_id = ?
    `

    const [class_data] = await db3.execute(query, [cID, dstID, courseID, professorID])
    console.log(class_data);
    res.json(class_data);

  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
})

app.get('/statistics/student_count/department/:dprtmnt_id', async (req, res) => {
  const { dprtmnt_id } = req.params;

  try {
    const query = `
      SELECT COUNT(DISTINCT es.student_number) AS student_count
      FROM enrolled_subject AS es
      INNER JOIN curriculum_table AS ct ON es.curriculum_id = ct.curriculum_id
      INNER JOIN dprtmnt_curriculum_table AS dct ON ct.curriculum_id = dct.curriculum_id
      INNER JOIN dprtmnt_table AS dt ON dct.dprtmnt_id = dt.dprtmnt_id
      INNER JOIN active_school_year_table AS asyt ON es.active_school_year_id = asyt.id
      INNER JOIN student_status_table AS sst ON es.student_number = sst.student_number
      INNER JOIN student_numbering_table AS snt ON sst.student_number = snt.student_number
      INNER JOIN person_table AS pst ON snt.person_id = pst.person_id
      WHERE dt.dprtmnt_id = ?
        AND asyt.astatus = 1
        AND sst.enrolled_status = 1
    `;

    const [rows] = await db3.execute(query, [dprtmnt_id]);
    res.json({ count: rows[0]?.student_count || 0 });
  } catch (err) {
    console.error("Error fetching total student count by department:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




app.get('/api/departments', async (req, res) => {
  try {
    const [departments] = await db3.execute(`
      SELECT dprtmnt_id, dprtmnt_name FROM dprtmnt_table
    `);
    res.json(departments);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// NEW ENDPOINT: All Year Levels Count
app.get('/statistics/student_count/department/:dprtmnt_id/by_year_level', async (req, res) => {
  const { dprtmnt_id } = req.params;

  try {
    const query = `
      SELECT ylt.year_level_id, ylt.year_level_description, COUNT(DISTINCT es.student_number) AS student_count
      FROM enrolled_subject AS es
      INNER JOIN curriculum_table AS ct ON es.curriculum_id = ct.curriculum_id
      INNER JOIN dprtmnt_curriculum_table AS dct ON ct.curriculum_id = dct.curriculum_id
      INNER JOIN dprtmnt_table AS dt ON dct.dprtmnt_id = dt.dprtmnt_id
      INNER JOIN active_school_year_table AS asyt ON es.active_school_year_id = asyt.id
      INNER JOIN student_status_table AS sst ON es.student_number = sst.student_number
      INNER JOIN year_level_table AS ylt ON sst.year_level_id = ylt.year_level_id
      WHERE dt.dprtmnt_id = ?
        AND asyt.astatus = 1
        AND sst.enrolled_status = 1
      GROUP BY ylt.year_level_id
      ORDER BY ylt.year_level_id ASC;
    `;

    const [rows] = await db3.execute(query, [dprtmnt_id]);
    res.json(rows); // [{ year_level_id: 1, year_level_description: "1st Year", student_count: 123 }, ...]
  } catch (err) {
    console.error("Error fetching year-level counts:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/get_active_school_years", async (req, res) => {
  const query = `
    SELECT sy.*, yt.year_description, s.semester_description 
    FROM active_school_year_table sy
    JOIN year_table yt ON sy.year_id = yt.year_id
    JOIN semester_table s ON sy.semester_id = s.semester_id
    WHERE sy.astatus = 1
  `;

  try {
    const [result] = await db3.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch school years", details: err.message });
  }
});

http.listen(5000, () => {
  console.log("Server with Socket.IO running on port 5000");
});
