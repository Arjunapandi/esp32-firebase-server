/*************************************************
 * ESP32 → Node.js (Render) → Firebase Storage
 *************************************************/

const express = require("express");
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

/* ---------- FIREBASE INITIALIZATION ---------- */
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_KEY)
  ),
  storageBucket: "civicissue-55603.firebasestorage.app"
});

const bucket = admin.storage().bucket();

/* ---------- EXPRESS SETUP ---------- */
const app = express();

/* Accept raw text (CSV) */
app.use(express.text({ limit: "5mb" }));

/* ---------- ROUTES ---------- */

/* Health check */
app.get("/", (req, res) => {
  res.send("ESP32 Firebase Upload Server is running ✅");
});

/* CSV Upload Endpoint */
app.post("/upload", async (req, res) => {
  try {
    const csvData = req.body;

    if (!csvData || csvData.length === 0) {
      return res.status(400).send("No CSV data received");
    }

    /* Create temp file */
    const fileName = `esp32_${Date.now()}.csv`;
    const tempPath = path.join(__dirname, fileName);

    fs.writeFileSync(tempPath, csvData);

    /* Upload to Firebase Storage */
    await bucket.upload(tempPath, {
      destination: `csv/${fileName}`,
      metadata: {
        contentType: "text/csv"
      }
    });

    /* Cleanup */
    fs.unlinkSync(tempPath);

    console.log("CSV uploaded:", fileName);
    res.status(200).send("Upload successful");

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).send("Upload failed");
  }
});

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
