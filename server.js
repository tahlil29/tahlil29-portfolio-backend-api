// my-portfolio-backend/server.js

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const fetch = require('node-fetch'); // Make sure node-fetch is installed and in package.json

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000; // Render will set process.env.PORT to 10000

// --- IMPORTANT: CONFIGURE CORS ORIGIN WITH YOUR ACTUAL RENDER FRONTEND URL ---
// Example: If your frontend URL is https://my-portfolio-frontend-5678.onrender.com, it should be:
// origin: 'https://my-portfolio-frontend-5678.onrender.com'
app.use(cors({
    origin: 'https://tahlil29-portfolio-frontend-only.onrender.com' // <--- REPLACE THIS PLACEHOLDER!
}));
// ----------------------------------------------------------------------------

app.use(express.json()); // Middleware to parse JSON request bodies

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your SMTP host (e.g., 'smtp.mailtrap.io')
    auth: {
        user: process.env.EMAIL_USER, // Your sending email (e.g., Gmail)
        pass: process.env.EMAIL_PASS // Your Gmail App Password
    }
});

app.post('/send-message', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields (name, email, message) are required.' });
    }

    try {
        // Prepare data for Google Apps Script
        const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL; // Your deployed Apps Script URL
        if (!scriptUrl) {
            console.error('GOOGLE_APPS_SCRIPT_URL is not set in environment variables.');
            return res.status(500).json({ message: 'Server configuration error: Google Apps Script URL missing.' });
        }

        const scriptResponse = await fetch(scriptUrl, {
            method: 'POST', // Use POST for writing data
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded' // Apps Script often expects form data
            },
            body: new URLSearchParams({ // Correctly format for form-urlencoded
                name: name,
                email: email,
                message: message
            })
        });

        const scriptResult = await scriptResponse.json(); // Assuming Apps Script returns JSON
        console.log('Google Apps Script Response:', scriptResult);

        if (scriptResult.status !== 'success') {
            console.error('Error from Google Apps Script:', scriptResult.message);
            return res.status(500).json({ message: 'Failed to save message to Google Sheet: ' + scriptResult.message });
        }

        // Send email notification (optional, based on your previous discussion)
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.RECEIVING_EMAIL, // The email where you want to receive messages
            subject: `New Contact Form Message from ${name}`,
            html: `
                <h3>New Message from Portfolio Website</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong> ${message}</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');

        res.status(200).json({ message: 'Message sent and saved successfully!' });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error: Failed to send message.' });
    }
});

// Basic route for testing if the backend is running (optional, but useful)
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Portfolio Backend API is running! Use /send-message for POST requests.' });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});