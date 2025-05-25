import { LinearClient } from '@linear/sdk';
import dotenv from 'dotenv';

dotenv.config();

const {
  LINEAR_CLIENT_ID,
  LINEAR_CLIENT_SECRET,
  LINEAR_REDIRECT_URI
} = process.env;

// Store tokens in memory (in production, use a database)
const tokens = {};

export function setupAuthRoutes(app) {
  // Initiate OAuth flow
  app.get('/auth', (req, res) => {
    const authUrl = `https://linear.app/oauth/authorize?client_id=${LINEAR_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINEAR_REDIRECT_URI)}&response_type=code&scope=read,write,issues:create,comments:create&actor=app&prompt=consent&app:assignable=true&app:mentionable=true`;
    res.redirect(authUrl);
  });

  // OAuth callback
  app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('Authorization code is missing');
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://api.linear.app/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: LINEAR_CLIENT_ID,
          client_secret: LINEAR_CLIENT_SECRET,
          redirect_uri: LINEAR_REDIRECT_URI,
          code,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        return res.status(400).send(`Error: ${tokenData.error}`);
      }

      const { access_token, organization_id } = tokenData;
      
      // Store the token (in production, save to database)
      tokens[organization_id] = access_token;

      // Get app user ID
      const linearClient = new LinearClient({ accessToken: access_token });
      const { viewer } = await linearClient.viewer;
      
      console.log(`App installed in organization ${organization_id}`);
      console.log(`App user ID: ${viewer.id}`);

      res.send(`
        <h1>Linear Agent Installed Successfully!</h1>
        <p>Organization ID: ${organization_id}</p>
        <p>App User ID: ${viewer.id}</p>
        <p>Please add the following to your .env file:</p>
        <pre>LINEAR_APP_USER_ID=${viewer.id}</pre>
        <p><a href="/">Return to home</a></p>
      `);
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      res.status(500).send('Error during authentication');
    }
  });

  // Get token for organization
  app.get('/api/token/:orgId', (req, res) => {
    const { orgId } = req.params;
    const token = tokens[orgId];
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found for this organization' });
    }
    
    res.json({ token });
  });
}

