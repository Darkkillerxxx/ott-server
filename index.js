import "dotenv/config"
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from "jsonwebtoken";
import { authRoutes, showRoutes } from './routes.js'; // Import all routes
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

app.use(cors());

app.use(express.json({ limit: '50mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authenticateToken = (req, res, next) => {
    // Get token from the headers
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Assuming 'Bearer <token>'
  
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: "Access Denied. No token provided.",
      });
    }
  
    try {
      // Verify the token
      const jwtSecret = process.env.JWTSECRET;
      const decoded = jwt.verify(token, jwtSecret);
        
      // Attach user data from token to request body
      req.user = decoded;
      
  
      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.log(error);
      return res.status(403).json({
        code: 403,
        message: "Invalid or expired token.",
      });
    }
};

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/shows', authenticateToken, showRoutes);

app.use('/api/auth',authRoutes);

app.listen(process.env.PORT || 3000,()=>{
    console.log(`App listening on port 3000`);
})