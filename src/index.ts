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

// Serve static files from the public directory
app.use(express.static('public'));

// Set up authentication routes
setupAuthRoutes(app);

// Webhook endpoint
app.post('/webhook', handleWebhook);

// Home page
app.get('/', (_req, res) => {
  res.sendFile('index.html', { root: './public' });
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Linear Agent server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to get started`);
  });
}

export default app;

