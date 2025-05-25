import express from 'express';
import dotenv from 'dotenv';
import { LinearClient } from '@linear/sdk';
import { handleWebhook } from './webhooks.js';
import { setupAuthRoutes } from './auth.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));

// Set up authentication routes
setupAuthRoutes(app);

// Webhook endpoint for Linear notifications
app.post('/webhook', handleWebhook);

// Home page
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

// Start the server
app.listen(port, () => {
  console.log(`Linear Agent server running on port ${port}`);
  console.log(`Visit http://localhost:${port} to get started`);
});

