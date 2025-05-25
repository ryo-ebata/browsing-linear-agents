import { Express, Request, Response } from 'express';
import { LinearClient } from '@linear/sdk';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Tokens, TokenData } from './types/index.js';

dotenv.config();

const {
  LINEAR_CLIENT_ID,
  LINEAR_CLIENT_SECRET,
  LINEAR_REDIRECT_URI
} = process.env;

// Store tokens in memory (in production, use a database)
const tokens: Tokens = {};

export function setupAuthRoutes(app: Express): void {
  // Initiate OAuth flow
  app.get('/auth', (_req: Request, res: Response) => {
    if (!LINEAR_CLIENT_ID || !LINEAR_REDIRECT_URI) {
      return res.status(500).send('Missing LINEAR_CLIENT_ID or LINEAR_REDIRECT_URI environment variables');
    }

    const authUrl = `https://linear.app/oauth/authorize?client_id=${LINEAR_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINEAR_REDIRECT_URI)}&response_type=code&scope=read,write,issues:create,comments:create&actor=app&prompt=consent&app:assignable=true&app:mentionable=true`;
    res.redirect(authUrl);
  });

  // OAuth callback
  app.get('/auth/callback', async (req: Request, res: Response) => {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).send('Authorization code is missing or invalid');
    }

    if (!LINEAR_CLIENT_ID || !LINEAR_CLIENT_SECRET || !LINEAR_REDIRECT_URI) {
      return res.status(500).send('Missing Linear OAuth credentials in environment variables');
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

      const tokenData = await tokenResponse.json() as TokenData;
      
      if ('error' in tokenData) {
        return res.status(400).send(`Error: ${tokenData.error}`);
      }

      const { access_token, organization_id } = tokenData;
      
      if (!access_token || !organization_id) {
        return res.status(400).send('Invalid token response from Linear');
      }
      
      // Store the token (in production, save to database)
      tokens[organization_id] = access_token;

      // Get app user ID
      const linearClient = new LinearClient({ accessToken: access_token });
      // @ts-ignore - The LinearClient type definitions are incomplete
      const viewerData = await linearClient.viewer;
      
      console.log(`App installed in organization ${organization_id}`);
      // @ts-ignore - The LinearClient type definitions are incomplete
      console.log(`App user ID: ${viewerData.id}`);

      res.send(`
        <h1>Linear Agent Installed Successfully!</h1>
        <p>Organization ID: ${organization_id}</p>
        <p>App User ID: ${viewerData.id}</p>
        <p>Please add the following to your .env file:</p>
        <pre>LINEAR_APP_USER_ID=${viewerData.id}</pre>
        <p><a href="/">Return to home</a></p>
      `);
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      res.status(500).send('Error during authentication');
    }
  });

  // Get token for organization
  app.get('/api/token/:orgId', (req: Request, res: Response) => {
    const { orgId } = req.params;
    const token = tokens[orgId];
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found for this organization' });
    }
    
    res.json({ token });
  });
}

