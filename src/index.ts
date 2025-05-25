import express from 'express';
import dotenv from 'dotenv';
import { setupAuthRoutes } from './auth.js';
import { handleWebhook } from './webhooks.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up authentication routes
setupAuthRoutes(app);

// Webhook endpoint
app.post('/webhook', handleWebhook);

// Home page
app.get('/', (_req, res) => {
  res.send(`
    <h1>Linear Agent</h1>
    <p>This is a Linear Agent application.</p>
    <p><a href="/auth">Install the agent</a></p>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

