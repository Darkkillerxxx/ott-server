// routes/seasons.js
import express from 'express';
import { queryData } from '../dbconfig.js';

const router = express.Router();

router.post('/createSeason', async (req, res) => {
    const { showId, seasonNumber, title, releaseDate } = req.body;
    const { user_id } = req.user; // Assumes middleware sets user_id in req.user

    // Validate input
    if (!showId || !seasonNumber || !user_id) {
        return res.status(400).send({
            code: 400,
            message: 'showId, seasonNumber, and ownerId are required.',
        });
    }

    try {
        // SQL query to insert a new season
        const query = `
            INSERT INTO Season (showId, seasonNumber, title, ownerId, releaseDate)
            VALUES (${showId}, ${seasonNumber}, '${title || ''}', ${user_id}, '${releaseDate || null}')
        `;
        const result = await queryData(query);

        res.status(200).send({
            code: 200,
            message: 'Season created successfully',
            seasonId: result.insertId,
        });
    } catch (error) {
        console.error('Error creating season:', error);
        res.status(500).send({
            code: 500,
            message: 'Failed to create season',
        });
    }
});

router.patch('/updateSeason/:id', async (req, res) => {
    const { id } = req.params; // Season ID
    const { user_id } = req.user; // Owner ID from the access token (middleware should populate this)
    const { showId, seasonNumber, title, releaseDate } = req.body;

    try {
        // Check if the user is the owner of the season
        const checkOwnerQuery = `SELECT ownerId FROM Season WHERE id = ${id}`;
        const [season] = await queryData(checkOwnerQuery);

        if (!season || season.ownerId !== user_id) {
            return res.status(403).send({
                code: 403,
                message: 'You are not authorized to update this season.',
            });
        }

        // Prepare the update query
        const updateFields = [];
        if (showId) updateFields.push(`showId = ${showId}`);
        if (seasonNumber) updateFields.push(`seasonNumber = ${seasonNumber}`);
        if (title) updateFields.push(`title = '${title}'`);
        if (releaseDate) updateFields.push(`releaseDate = '${releaseDate}'`);

        if (updateFields.length === 0) {
            return res.status(400).send({
                code: 400,
                message: 'No fields to update.',
            });
        }

        const updateQuery = `
            UPDATE Season
            SET ${updateFields.join(', ')}
            WHERE id = ${id}
        `;

        await queryData(updateQuery);

        res.status(200).send({
            code: 200,
            message: 'Season updated successfully.',
        });
    } catch (error) {
        console.error('Error updating season:', error);
        res.status(500).send({
            code: 500,
            message: 'Failed to update season.',
        });
    }
});

router.get('/fetchSeasons', async (req, res) => {
    const { user_id } = req.user; // Owner ID from the access token
    const { showId, seasonNumber, title, page = 1, limit = 10 } = req.query;

    try {
        // Base query
        let query = `SELECT * FROM Season WHERE ownerId = ${user_id}`;
        const conditions = [];

        // Add filters based on query parameters
        if (showId) conditions.push(`showId = ${showId}`);
        if (seasonNumber) conditions.push(`seasonNumber = ${seasonNumber}`);
        if (title) conditions.push(`title LIKE '%${title}%'`);

        // Append conditions to the base query
        if (conditions.length > 0) {
            query += ` AND ${conditions.join(' AND ')}`;
        }

        // Pagination
        const offset = (page - 1) * limit;
        query += ` LIMIT ${limit} OFFSET ${offset}`;

        // Execute the query
        const result = await queryData(query);

        res.status(200).send({
            code: 200,
            message: 'Seasons fetched successfully',
            data: result,
        });
    } catch (error) {
        console.error('Error fetching seasons:', error);
        res.status(500).send({
            code: 500,
            message: 'Failed to fetch seasons.',
        });
    }
});

export default router;
