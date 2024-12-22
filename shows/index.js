// routes/shows.js
import express from 'express';
import { queryData } from '../dbconfig.js';
import multer from 'multer';
import path from 'path';


const router = express.Router();

// Set up multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // You can specify the directory where the files will be stored
        cb(null, 'uploads/');  // Store files in 'uploads' folder
    },
    filename: (req, file, cb) => {
        // Ensure unique filenames by appending a timestamp to the file name
        cb(null, Date.now() + path.extname(file.originalname)); // Adding file extension
    },
});

// Initialize multer with storage configuration
const upload = multer({ storage: storage });

router.post('/uploadEpisode', 
    upload.fields([
        { name: 'stillImageFile', maxCount: 1 }, 
    ]), async (req, res) => {
    try {
        const { seriesId, seasonId, title, description, availabilityType, stillImageUrl} = req.body;
        console.log(req.body); // Contains form data like trailerType, videoType, etc.
        console.log(req.files); // Contains the uploaded files

        // Prepare video URLs for the uploaded files
        let episodeStillUrl = '';

        if (req.files.stillImageFile) {
            episodeStillUrl = `/uploads/${req.files.stillImageFile[0].filename}`;
        }
        else{
            episodeStillUrl = stillImageUrl;
        }
     
        // Insert the data into the database
      
        const query = `
            INSERT INTO episodes 
            (seriesId, seasonId, title, description, availabilityType, stillImageUrl)
            VALUES
            (${seriesId},'${seasonId}', '${title}', '${description}', '${availabilityType}', '${episodeStillUrl}');
        `;

        const result = await queryData(query);

        res.status(200).json({ message: 'Episodes Fetch Successfully!',episodesId:result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred during the file upload' });
    }
});

router.get('/getSeriesList',async(req,res)=>{
    try{
        const { user_id } = req.user;

        const query = `SELECT 
                        s.id AS ShowId,
                        s.contentTypeId,
                        s.ownerId,
                        s.showTypeId,
                        se.SeriesId,
                        se.SeriesName,
                        se.SeriesDescription,
                        se.Genre,
                        se.Language,
                        se.cast,
                        se.Producer,
                        se.Director,
                        se.PilotAirDate,
                        se.thumbnailUrl,
                        se.landscapeUrl,
                        se.ExternalId
                    FROM 
                        shows s
                    INNER JOIN 
                        series se ON s.id = se.ShowId
                    WHERE 
                        s.ownerId = ${user_id}`;
        
        const result = await queryData(query);

        res.status(200).json({ message: 'Episodes Fetch Successfully!',data:result});
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:'An error occured during fetching series'})
    }
})

router.get('/getEpisodeListForSeason/:seasonId',async(req,res)=>{
    try{        
        const { seasonId } = req.params;

        const query = `SELECT * FROM episodes WHERE seasonId = ${seasonId}`;

        const result = await queryData(query);
        res.status(200).json({ message: 'Files uploaded and data saved successfully!',data:result });
    }
    catch(error){
        res.status(500).json({message:'An Error occured while fetching episodes'});
    }
})

router.post('/uploadContent', 
    upload.fields([
        { name: 'trailerFile', maxCount: 1 }, 
        { name: 'movieImage', maxCount: 1 },
        { name: 'thumbnailImage', maxCount: 1 }, 
        { name: 'file720p', maxCount: 1 },
        { name: 'file480p', maxCount: 1 },
        { name: 'file360p', maxCount: 1 }
    ]), async (req, res) => {
    try {
        console.log(req.body); // Contains form data like trailerType, videoType, etc.
        console.log(req.files); // Contains the uploaded files

        // Prepare URLs for the uploaded files (you'll need to upload them to a cloud storage)
        let trailerUrl = '';
        let trailerFileUrl = '';
        let trailerYoutubeUrl = '';

        if (req.files.trailerFile) {
            trailerFileUrl = `/uploads/${req.files.trailerFile[0].filename}`; // Local path for now
        } else if (req.body.trailerExt) {
            trailerUrl = req.body.trailerExt;
        } else if (req.body.trailerYoutubeId) {
            trailerYoutubeUrl = `https://www.youtube.com/watch?v=${req.body.trailerYoutubeId}`;
        }

        // Prepare video URLs for the uploaded files
        let video360pUrl = '';
        let video480pUrl = '';
        let video720pUrl = '';

        if (req.files.file360p) {
            video360pUrl = `/uploads/${req.files.file360p[0].filename}`;
        }
        if (req.files.file480p) {
            video480pUrl = `/uploads/${req.files.file480p[0].filename}`;
        }
        if (req.files.file720p) {
            video720pUrl = `/uploads/${req.files.file720p[0].filename}`;
        }

        // Thumbnail and movie image URLs
        const thumbnailUrl = req.files.thumbnailImage ? `/uploads/${req.files.thumbnailImage[0].filename}` : '';
        const imageUrl = req.files.movieImage ? `/uploads/${req.files.movieImage[0].filename}` : '';

        // Insert the data into the database
        const showId = req.body.showId; // Get showId from the form data
        const episodeId = req.body.episodeId;

        const query = `
            INSERT INTO showContent 
            (showId, episodeId, trailerUrl, youtubeId360p, youtubeId480p, youtubeId720p, externalUrl, url360p, url480p, url720p, thumbnailUrl, imageUrl, trailerfileUrl, traileryoutubeUrl)
            VALUES
            (${showId ? showId : null},${episodeId ? episodeId : null},'${trailerUrl}', '${req.body.file360p ? req.body.file360p : '' }', '${req.body.file480p ? req.body.file480p : ''}', '${req.body.file720p ? req.body.file720p : ''}', '${req.body.fileExternalURL ? req.body.fileExternalURL : ''}', '${video360pUrl}', '${video480pUrl}', '${video720pUrl}', '${thumbnailUrl}', '${imageUrl}','${trailerFileUrl}','${trailerYoutubeUrl}')
        `;

        await queryData(query);

        res.status(200).json({ message: 'Files uploaded and data saved successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred during the file upload' });
    }
});

router.get('/fetchSeriesById/:showId', async (req, res) => {
    const { user_id } = req.user;
    const { showId } = req.params;

    try {
        const query = `SELECT 
                            s.id AS ShowId,
                            s.contentTypeId,
                            s.ownerId AS ShowOwnerId,
                            s.showTypeId,
                            sr.SeriesId,
                            sr.SeriesName,
                            sr.SeriesDescription,
                            sr.Genre,
                            sr.Language,
                            sr.Cast,
                            sr.Producer,
                            sr.Director,
                            sr.ExternalId,
                            sr.PilotAirDate,
                            sr.thumbnailUrl,
                            sr.landscapeUrl,
                            ss.id AS SeasonId,
                            ss.seasonNumber,
                            ss.description,
                            ss.imageUrl,
                            ss.title AS SeasonTitle,
                            ss.releaseDate AS SeasonReleaseDate,
                            ss.ownerId AS SeasonOwnerId
                        FROM 
                            Shows s
                        LEFT JOIN 
                            Series sr ON s.id = sr.ShowId
                        LEFT JOIN 
                            Season ss ON sr.SeriesId = ss.seriesId
                        WHERE 
                            s.id = ${showId} AND s.ownerId = ${user_id}`;

        const result = await queryData(query);

        // Process result to group seasons in an array
        const showData = {
            ShowId: result[0]?.ShowId,
            contentTypeId: result[0]?.contentTypeId,
            ShowOwnerId: result[0]?.ShowOwnerId,
            showTypeId: result[0]?.showTypeId,
            SeriesDetails: []
        };

        result.forEach(row => {
            const series = showData.SeriesDetails.find(series => series.SeriesId === row.SeriesId);
            if (!series) {
                showData.SeriesDetails.push({
                    SeriesId: row.SeriesId,
                    SeriesName: row.SeriesName,
                    SeriesDescription: row.SeriesDescription,
                    Genre: row.Genre,
                    Language: row.Language,
                    Cast: row.Cast,
                    Producer: row.Producer,
                    Director: row.Director,
                    PilotAirDate: row.PilotAirDate,
                    thumbnailUrl: row.thumbnailUrl,
                    landscapeUrl: row.landscapeUrl,
                    Seasons: []
                });
            }

            // Push the season details
            const seriesObj = showData.SeriesDetails.find(series => series.SeriesId === row.SeriesId);
            seriesObj.Seasons.push({
                SeasonId: row.SeasonId,
                SeriesExternalId:result[0].ExternalId,
                seasonNumber: row.seasonNumber,
                SeasonTitle: row.SeasonTitle,
                SeasonReleaseDate: row.SeasonReleaseDate,
                SeasonOwnerId: row.SeasonOwnerId,
                ImageUrl:row.imageUrl,
                Description:row.description
            });
        });

        // Send the final response
        res.status(200).send({
            code: 200,
            message: 'Series data fetched successfully.',
            data: showData
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            code: 500,
            message: 'An error occurred while fetching series details.',
            error: error.message
        });
    }
});



router.post('/createSeries',upload.fields([{ name: 'thumbnailFile', maxCount: 1 }, { name: 'landscapeFile', maxCount: 1 }]) ,async (req, res) => {    
    console.log(req.body);
    const { title, description ,genre, language, cast, producer, director, extId, pilotAirDate } = req.body;
    const { user_id } = req.user;

    try {
        let thumbnailUrl = '';
        let landscapeUrl = '';

        if (req.files.thumbnailFile) {
            thumbnailUrl = `/uploads/${req.files.thumbnailFile[0].filename}`; // Local path for now
        } else if (req.body.thumbnailUrl) {
            thumbnailUrl = req.body.thumbnailUrl;
        }

        if(req.files.landscapeUrl){
            landscapeUrl = `/uploads/${req.files.lanscapeFile[0].filename}`;
        }else if(req.body.landscapeUrl){
            landscapeUrl = req.body.landscapeUrl
        }

        // Insert into the Shows table
        const queryShow = `INSERT INTO Shows (contentTypeId, ownerId, showTypeId) VALUES (1, ${user_id}, 2)`;
        const resultShow = await queryData(queryShow);

        // Get the ShowId from the inserted record
        const showId = resultShow.insertId;

        // Insert into the Series table using the ShowId
        const querySeries = `
            INSERT INTO Series (SeriesName, SeriesDescription, Genre, Language, Cast, Producer, Director, PilotAirDate, ShowId, thumbnailUrl, landscapeUrl, externalId)
            VALUES ('${title}', '${description}', '${genre}', '${language}', '${cast}', '${producer}', '${director}', '${pilotAirDate}', ${showId}, '${thumbnailUrl}', '${landscapeUrl}', '${extId}')
        `;

        const resultSeries = await queryData(querySeries);

        const seriesId = resultSeries.insertId;

        res.send({
            code: 200,
            message: 'Series created successfully',
            showId: showId,
            seriesId:seriesId
        });
    } catch (error) {
        console.error('Error creating series:', error);
        res.send({ code: 500, message: 'Failed to create series' });
    }
});

router.get('/fetchSeries', async (req, res) => {
    const { id } = req.params;  // Extracting the ID from the route parameter
    const { user_id } = req.user;  // Extracting the user ID from the authenticated user
    
    try {
        // SQL query to fetch shows and series where showTypeId = 2 and ownerId = user_id
        const query = `
            SELECT 
                s.id,s.contentTypeId, s.ownerId, s.showTypeId, se.externalId,
                se.SeriesName, se.SeriesDescription, se.Genre, se.Language, 
                se.Cast, se.Producer, se.Director, se.PilotAirDate 
            FROM Shows s
            JOIN Series se ON s.id = se.ShowId
            WHERE s.showTypeId = 2 AND s.ownerId = ${user_id}
        `;
        
        // Execute the query
        const result = await queryData(query);

        // Check if any data is returned
        if (result.length > 0) {
            res.send({
                code: 200,
                message: 'Shows and series fetched successfully',
                data: result
            });
        } else {
            res.send({
                code: 404,
                message: 'No shows or series found for the given ID and user',
            });
        }
    } catch (error) {
        console.error('Error fetching shows and series:', error);
        res.send({
            code: 500,
            message: 'Failed to fetch shows and series',
        });
    }
});

router.post('/createSeasonBulk', async (req, res) => {
    const { seasons } = req.body; // Expecting an array of seasons
    const { user_id } = req.user;  // Extracting the user ID from the authenticated user

    console.log(req.body);
    // Validate input
    if (!Array.isArray(seasons) || seasons.length === 0) {
        return res.status(400).send({
            code: 400,
            message: '`seasons` must be a non-empty array of season objects.',
        });
    }

    // Initialize transaction
    const connection = await queryData('START TRANSACTION');

    try {
        const insertedSeasons = [];

        for (const season of seasons) {
            const {
                seasonNumber,
                title,
                releaseDate,
                seriesId,
                description,
                imageUrl,
                noOfEpisodes,
            } = season;

            // SQL query to insert a season
            const query = `
                INSERT INTO Season 
                (seasonNumber, title, releaseDate, seriesId, description, imageUrl, ownerId, noOfEpisodes)
                VALUES 
                (${seasonNumber}, '${title}', '${releaseDate}', ${seriesId}, 
                ${description ? `'${description}'` : 'NULL'}, 
                ${imageUrl ? `'${imageUrl}'` : 'NULL'}, ${user_id},
                ${noOfEpisodes || 'NULL'})
            `;

            // Execute query
            const result = await queryData(query);

            // Collect inserted data
            insertedSeasons.push({
                seasonId: result.insertId,
                seasonNumber,
                title,
                releaseDate,
                user_id,
                seriesId,
                description,
                imageUrl,
                noOfEpisodes,
            });
        }

        // Commit transaction
        await queryData('COMMIT');

        // Respond with success
        res.status(201).send({
            code: 201,
            message: 'All seasons created successfully.',
            data: insertedSeasons,
        });
    } catch (error) {
        // Rollback transaction on error
        console.error('Error during bulk season creation:', error);
        await queryData('ROLLBACK');
        res.status(500).send({
            code: 500,
            message: 'Failed to create all seasons. Transaction rolled back.',
            error: error.message,
        });
    }
});


router.post('/createSeason', async (req, res) => {
    const { seasonNumber, title, releaseDate, ownerId, seriesId } = req.body;
    const { user_id } = req.user;  // Extracting the user ID from the authenticated user

    // Validate the required fields
    if (!seasonNumber || !title || !releaseDate || !ownerId || !seriesId) {
        return res.status(400).send({
            code: 400,
            message: 'All fields are required: seasonNumber, title, releaseDate, ownerId, and seriesId.',
        });
    }

    try {
        // SQL query to insert a new season into the database
        const query = `
            INSERT INTO Season (seasonNumber, title, releaseDate, ownerId, seriesId)
            VALUES (${seasonNumber}, '${title}', '${releaseDate}', ${user_id}, ${seriesId})
        `;
        
        // Execute the query
        const result = await queryData(query);

        // Respond with success
        res.status(201).send({
            code: 201,
            message: 'Season created successfully',
            data: {
                seasonId: result.insertId,  // Assuming result contains the insertId
                seasonNumber,
                title,
                releaseDate,
                ownerId,
                seriesId,
            },
        });
    } catch (error) {
        console.error('Error creating season:', error);
        res.status(500).send({
            code: 500,
            message: 'Failed to create season',
        });
    }
});

router.patch('/editShows/:id', async (req, res) => {
    const { id } = req.params; // The ID of the show to edit
    const { contentTypeId, title, image, showTypeId, description } = req.body;
    console.log(req.user);
    const { user_id } = req.user; // Assuming authentication middleware sets `req.user`

    // Ensure the `id` and `user_id` are provided
    if (!id || !user_id) {
        return res.status(400).send({ code: 400, message: 'Show ID and user_id are required.' });
    }

    try {
        // Build the SQL query dynamically to update only provided fields
        const updates = [];
        if (contentTypeId) updates.push(`contentTypeId = ${contentTypeId}`);
        if (title) updates.push(`title = '${title}'`);
        if (image) updates.push(`image = '${image}'`);
        if (showTypeId) updates.push(`showTypeId = ${showTypeId}`);
        if (description) updates.push(`description = '${description}'`);

        // If there are no fields to update, return an error
        if (updates.length === 0) {
            return res.status(400).send({ code: 400, message: 'No fields provided to update.' });
        }

        // Construct the update query
        const updateQuery = `UPDATE Shows SET ${updates.join(', ')} WHERE id = ${id} AND ownerId = ${user_id}`;

        // Execute the query
        const result = await queryData(updateQuery);

        // Check if the row was updated
        if (result.affectedRows === 0) {
            return res.status(404).send({ code: 404, message: 'Show not found or you do not have permission to edit it.' });
        }

        res.status(200).send({
            code: 200,
            message: 'Show updated successfully',
        });
    } catch (error) {
        console.error('Error updating show:', error);
        res.status(500).send({ code: 500, message: 'Failed to update show.' });
    }
});

router.get('/fetchShows', async (req, res) => {
    const { contentTypeId, title, showTypeId, page = 1, limit = 10 } = req.query;
    const { user_id } = req.user; // Extract user_id from req.user (assumes middleware sets this)

    try {
        // Base query to fetch shows
        let query = `SELECT * FROM Shows`;
        const conditions = [`ownerId = ${user_id}`]; // Add ownerId condition

        // Add filters if provided in the query parameters
        if (contentTypeId) conditions.push(`contentTypeId = ${contentTypeId}`);
        if (title) conditions.push(`title LIKE '%${title}%'`);
        if (showTypeId) conditions.push(`showTypeId = ${showTypeId}`);

        // Append conditions to the base query
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        // Add pagination
        const offset = (page - 1) * limit;
        query += ` LIMIT ${limit} OFFSET ${offset}`;

        // Execute the query
        const result = await queryData(query);

        res.status(200).send({
            code: 200,
            message: 'Shows fetched successfully',
            data: result,
        });
    } catch (error) {
        console.error('Error fetching shows:', error);
        res.status(500).send({ code: 500, message: 'Failed to fetch shows.' });
    }
});

router.post('/addMovie', async (req, res) => {
    const { name, description, genre, language, type, cast, producer, director, duration, releaseDate } = req.body;
    const { user_id } = req.user;

    if (!name || !user_id) {
        return res.status(400).send({
            code: 400,
            message: "Name and OwnerId are required fields."
        });
    }

    try {
        // Escape all string values
        const escapeString = (str) => (str ? str.replace(/'/g, "''") : '');

        // Insert into Shows table
        const showInsertQuery = `
            INSERT INTO Shows (contentTypeId, ownerId, showTypeId) 
            VALUES (1, ${user_id}, 1)
        `;
        const showInsertResult = await queryData(showInsertQuery);
        const showId = showInsertResult.insertId;

        // Insert a new movie
        const insertQuery = `
            INSERT INTO Movies 
            (Name, Description, Genre, Language, Type, Cast, Producer, Director, Duration, ReleaseDate, OwnerId, ShowId)
            VALUES (
                '${escapeString(name)}', 
                '${escapeString(description)}', 
                '${escapeString(genre)}', 
                '${escapeString(language)}', 
                '${escapeString(type)}', 
                '${escapeString(cast)}', 
                '${escapeString(producer)}', 
                '${escapeString(director)}', 
                '${escapeString(duration)}', 
                ${releaseDate ? `'${releaseDate}'` : 'NULL'}, 
                ${user_id}, 
                ${showId}
            )
        `;
        await queryData(insertQuery);

        return res.status(201).send({
            code: 201,
            message: "Movie added successfully!",
            showId: showId
        });
    } catch (error) {
        console.error("Error in adding movie:", error);
        return res.status(500).send({
            code: 500,
            message: "An error occurred while adding the movie."
        });
    }
});



router.get('/fetchShowDetails/:showId', async (req, res) => {
    const { showId } = req.params;

    try {
        if (!showId) {
            return res.status(400).send({
                code: 400,
                message: "showId is required.",
            });
        }

        const query = `
            SELECT 
                s.id AS ShowId, 
                s.contentTypeId, 
                s.ownerId, 
                s.showTypeId, 
                m.MovieID, 
                m.Name AS MovieName, 
                m.Description AS MovieDescription, 
                sc.contentId, 
                sc.youtubeId360p, 
                sc.youtubeId480p, 
                sc.youtubeId720p, 
                sc.externalUrl, 
                sc.url360p, 
                sc.url480p, 
                sc.url720p, 
                sc.thumbnailUrl, 
                sc.imageUrl, 
                sc.trailerUrl, 
                sc.trailerfileUrl, 
                sc.traileryoutubeUrl
            FROM Shows s
            INNER JOIN Movies m ON m.ShowId = s.id
            INNER JOIN showContent sc ON sc.showId = s.id
            WHERE s.id = ${showId}
        `;

        // Execute query (assuming queryData is your query execution function)
        const result = await queryData(query);

        res.status(200).send({
            code: 200,
            message: "Show details fetched successfully",
            data: result,
        });
    } catch (error) {
        console.error("Error fetching show details:", error);
        res.status(500).send({
            code: 500,
            message: "Failed to fetch show details.",
        });
    }
});

export default router;
