// my-portfolio-backend/server.js

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file (for local development)

const app = express();
const PORT = process.env.PORT || 3000;

// --- IMPORTANT: CONFIGURE CORS ORIGIN WITH YOUR ACTUAL RENDER FRONTEND URL ---
app.use(cors({
    origin: 'https://tahlil29-portfolio-frontend-only.onrender.com'
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

// --- Main /send-message route (ONLY SENDS EMAIL) ---
app.post('/send-message', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields (name, email, message) are required.' });
    }

    try {
        // --- Send email notification using Nodemailer ---
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.RECEIVING_EMAIL,
            subject: `New Contact Form Message from ${name}`,
            html: `
                <h3>New Message from Portfolio Website</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong> ${message}</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!'); // Log success to Render logs

        res.status(200).json({ message: 'Message sent successfully!' }); // Success response to frontend

    } catch (error) {
        // Log the exact error to Render logs if email sending fails
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Server error: Failed to send email.' });
    }
});

// Basic route for testing if the backend is running
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Portfolio Backend API is running! Use /send-message for POST requests.' });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});