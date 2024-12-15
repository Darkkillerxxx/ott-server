// routes/shows.js
import express from 'express';
import { queryData } from '../dbconfig.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const JWT_SECRET = process.env.JWTSECRET;

router.post('/sendOtp', async (req, res) => {
    const { username, phone } = req.body;

    // Ensure at least one of the fields (username or phone) is provided
    if (!username && !phone) {
        return res.status(400).send({ code: 400, message: 'Either username or phone is required.' });
    }

    try {
        // Construct the query to search by username or phone
        let query = `SELECT * FROM Users WHERE `;
        if (username) query += `username = '${username}' `;
        if (username && phone) query += `OR `;
        if (phone) query += `phone = '${phone}'`;

        // Search for the user
        const users = await queryData(query);

        // If user is not found, return a 404 response
        if (users.length === 0) {
            return res.status(404).send({ code: 404, message: 'User not found.' });
        }

        // Update the OTP to 0000
        const updateQuery = `
            UPDATE Users 
            SET otp = '0000' 
            WHERE ${username ? `username = '${username}'` : ''} 
            ${username && phone ? 'OR' : ''} 
            ${phone ? `phone = '${phone}'` : ''}`;

        console.log(updateQuery);

        await queryData(updateQuery);

        res.status(200).send({ code: 200, message: 'OTP set to 0000 successfully.' });
    } catch (error) {
        console.error('Error updating OTP:', error);
        res.status(500).send({ code: 500, message: 'Failed to update OTP.' });
    }
});

router.post('/authenticateOtp', async (req, res) => {
    const { username, phone, otp } = req.body;

    // Ensure either username or phone is provided and OTP is provided
    if (!otp || (!username && !phone)) {
        return res.status(400).send({ code: 400, message: 'username/phone and otp are required.' });
    }

    try {
        // Construct the query to search by username or phone
        let query = `SELECT * FROM Users WHERE `;
        if (username) query += `username = '${username}' `;
        if (username && phone) query += `OR `;
        if (phone) query += `phone = '${phone}'`;

        // Search for the user
        const users = await queryData(query);

        // If no user is found, return an error
        if (users.length === 0) {
            return res.status(404).send({ code: 404, message: 'User not found.' });
        }

        const user = users[0];

        // Verify the OTP
        if (user.otp !== otp) {
            return res.status(401).send({ code: 401, message: 'Invalid OTP.' });
        }

        // If OTP is valid, generate JWT token
        const tokenPayload = {
            user_id: user.user_id,
            username: user.username,
            phone: user.phone,
            userType: user.userType
        };

        const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' }); // Set token expiration (e.g., 1 hour)

        // Return the access token
        res.status(200).send({
            code: 200,
            message: 'Authenticated successfully',
            accessToken: accessToken
        });
    } catch (error) {
        console.error('Error authenticating user:', error);
        res.status(500).send({ code: 500, message: 'Failed to authenticate user.' });
    }
});


export default router;
