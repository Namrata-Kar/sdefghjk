const express = require("express");
const nodemailer = require("nodemailer");

const app = express();

app.use(express.json());

// Cloud hosting providers like Render dynamically assign a port using process.env.PORT
const PORT = process.env.PORT || 8080;

// Safe Ranges Definition
const TEMP_MIN = 25;
const TEMP_MAX = 32;
const PH_MIN = 6.5;
const PH_MAX = 9.0;
const TDS_MIN = 100;
const TDS_MAX = 500;

// Gmail configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "namratakar001@gmail.com",
        pass: "okte ylnc ohqg bvaq"
    }
});

// Email configuration
const SENDER_EMAIL = "namratakar001@gmail.com";
const RECEIVER_EMAIL = "namratakar001@gmail.com";

// Prevent repeated emails spamming
let alertSent = false;

// Global state to store the latest sensor readings for the mobile app GET request
let latestSensorData = {
    temperature: 0,
    pH: 0,
    tds: 0,
    alert: false
};

// Sensor Data API Endpoint (Receives data from ESP32)
app.post("/api/temperature", async (req, res) => {
    try {
        const { temperature, pH, tds } = req.body;

        // Validate that all incoming parameters are valid numbers
        if (
            typeof temperature !== "number" || !Number.isFinite(temperature) ||
            typeof pH !== "number" || !Number.isFinite(pH) ||
            typeof tds !== "number" || !Number.isFinite(tds)
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid temperature, pH, and TDS values are required"
            });
        }

        console.log(`Received -> Temp: ${temperature}°C | pH: ${pH} | TDS: ${tds} ppm`);

        // Check if any parameter is out of bounds
        const isTempOutOfRange = temperature < TEMP_MIN || temperature > TEMP_MAX;
        const isPhOutOfRange = pH < PH_MIN || pH > PH_MAX;
        const isTdsOutOfRange = tds < TDS_MIN || tds > TDS_MAX;

        const hasAnyAlert = isTempOutOfRange || isPhOutOfRange || isTdsOutOfRange;

        // Update global state so mobile app can fetch it instantly
        latestSensorData = {
            temperature: temperature,
            pH: pH,
            tds: tds,
            alert: hasAnyAlert
        };

        if (hasAnyAlert) {
            if (!alertSent) {
                const mailOptions = {
                    from: 'namratakar001@gmail.com',
                    to: 'namratakar001@gmail.com',
                    subject: "⚠️ WATER QUALITY WARNING: Parameter Out of Range!",
                    text: `
WARNING! One or more water parameters have exceeded acceptable limits.

Current Readings:
- Temperature: ${temperature}°C (Safe Range: ${TEMP_MIN}-${TEMP_MAX}°C) ${isTempOutOfRange ? '⚠️ OUT OF RANGE' : '✓ OK'}
- pH Level:    ${pH} (Safe Range: ${PH_MIN}-${PH_MAX}) ${isPhOutOfRange ? '⚠️ OUT OF RANGE' : '✓ OK'}
- TDS Value:   ${tds} ppm (Safe Range: ${TDS_MIN}-${TDS_MAX} ppm) ${isTdsOutOfRange ? '⚠️ OUT OF RANGE' : '✓ OK'}

Please inspect your water monitoring system immediately.
                    `
                };

                await transporter.sendMail(mailOptions);
                alertSent = true;
                console.log("Alert email sent successfully!");
            } else {
                console.log("Alert condition active, but email already sent. No duplicate email.");
            }
        } else {
            if (alertSent) {
                console.log("All water parameters recovered to normal ranges. Alert reset.");
            }
            alertSent = false;
        }

        return res.status(200).json({
            success: true,
            temperature: temperature,
            pH: pH,
            tds: tds,
            alert: hasAnyAlert
        });

    } catch (error) {
        console.error("Email/API Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process sensor data"
        });
    }
});

// GET Endpoint for Mobile App to fetch latest live data
app.get("/api/temperature", (req, res) => {
    return res.status(200).json(latestSensorData);
});

// Health check root
app.get("/", (req, res) => {
    res.send("Water Quality Monitoring Server is Running!");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

//.................................................

// const express = require("express");
// const nodemailer = require("nodemailer");

// const app = express();

// app.use(express.json());

// const PORT = 8080;
// const TEMP_THRESHOLD = 31;

// // Gmail configuration
// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: "namratakar001@gmail.com",
//         pass: "okte ylnc ohqg bvaq"
//     }
// });

// // Email configuration
// const SENDER_EMAIL = "namratakar001@gmail.com";
// const RECEIVER_EMAIL = "dattaaditya005@gmail.com";

// // Prevent repeated emails
// let alertSent = false;

// // Sensor Data API Endpoint
// app.post("/api/temperature", async (req, res) => {

//     try {
//         const { temperature, pH } = req.body;

//         // Validate that both temperature and pH are valid numbers
//         if (
//             typeof temperature !== "number" || !Number.isFinite(temperature) ||
//             typeof pH !== "number" || !Number.isFinite(pH)
//         ) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid temperature and pH values are required"
//             });
//         }

//         console.log(`Received Data -> Temperature: ${temperature}°C | pH: ${pH}`);

//         if (temperature > TEMP_THRESHOLD) {

//             if (!alertSent) {

//                 const mailOptions = {
//                     from: SENDER_EMAIL,
//                     to: RECEIVER_EMAIL,
//                     subject: "High Water Temperature Alert!",
//                     text: `
// WARNING!

// Water temperature has exceeded ${TEMP_THRESHOLD}°C.

// Current Temperature: ${temperature}°C
// Current pH Level: ${pH}

// Please check your water monitoring system.
//                     `
//                 };

//                 await transporter.sendMail(mailOptions);

//                 alertSent = true;

//                 console.log("Alert email sent successfully!");

//             } else {
//                 console.log("Alert already sent. No duplicate email.");
//             }

//         } else {

//             if (alertSent) {
//                 console.log("Temperature recovered. Alert reset.");
//             }

//             alertSent = false;
//         }

//         return res.status(200).json({
//             success: true,
//             temperature: temperature,
//             pH: pH,
//             threshold: TEMP_THRESHOLD,
//             alert: temperature > TEMP_THRESHOLD
//         });

//     } catch (error) {

//         console.error("Email/API Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to process sensor data"
//         });
//     }
// });

// // Health check
// app.get("/", (req, res) => {
//     res.send("Water Quality Monitoring Server is Running!");
// });

// app.listen(PORT, "0.0.0.0", () => {
//     console.log(`Server running on port ${PORT}`);
// });

//..........................................................

// const express = require("express");
// const nodemailer = require("nodemailer");

// const app = express();

// app.use(express.json());

// const PORT = 8080;
// const TEMP_THRESHOLD = 31;

// // Gmail configuration
// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: "namratakar001@gmail.com",
//         pass: "okte ylnc ohqg bvaq"
//     }
// });

// // Email configuration
// const SENDER_EMAIL = "namratakar001@gmail.com";
// // const RECEIVER_EMAIL = "gairiksharma202@gmail.com";
// const RECEIVER_EMAIL = "dattaaditya005@gmail.com";

// // Prevent repeated emails
// let alertSent = false;

// // Temperature API
// app.post("/api/temperature", async (req, res) => {

//     try {
//         const { temperature } = req.body;

//         if (
//             typeof temperature !== "number" ||
//             !Number.isFinite(temperature)
//         ) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid temperature value is required"
//             });
//         }

//         console.log("Received Temperature:", temperature, "°C");

//         if (temperature > TEMP_THRESHOLD) {

//             if (!alertSent) {

//                 const mailOptions = {
//                     from: SENDER_EMAIL,
//                     to: RECEIVER_EMAIL,
//                     subject: "High Water Temperature Alert!",
//                     text: `
// WARNING!

// Water temperature has exceeded ${TEMP_THRESHOLD}°C.

// Current Temperature: ${temperature}°C

// Please check your water monitoring system.
//                     `
//                 };

//                 await transporter.sendMail(mailOptions);

//                 alertSent = true;

//                 console.log("Alert email sent successfully!");

//             } else {
//                 console.log("Alert already sent. No duplicate email.");
//             }

//         } else {

//             if (alertSent) {
//                 console.log("Temperature recovered. Alert reset.");
//             }

//             alertSent = false;
//         }

//         return res.status(200).json({
//             success: true,
//             temperature: temperature,
//             threshold: TEMP_THRESHOLD,
//             alert: temperature > TEMP_THRESHOLD
//         });

//     } catch (error) {

//         console.error("Email/API Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to process temperature"
//         });
//     }
// });

// // Health check
// app.get("/", (req, res) => {
//     res.send("Temperature Monitoring Server is Running!");
// });

// app.listen(8080, "0.0.0.0", () => {
//     console.log(`Server running on port`);
// });