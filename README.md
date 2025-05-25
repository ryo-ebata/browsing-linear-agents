# Browsing Linear Agents

This repository contains a TypeScript application for setting up and using Linear Agents. Linear Agents are app users that can be mentioned, assigned issues, and interact with Linear workspaces.

## Overview

Linear Agents allow you to build integrations that appear as users within Linear workspaces. They can:

- Be mentioned in issues and comments
- Be assigned to issues
- Create and reply to comments
- Move issues between states
- Receive webhook notifications for relevant events

This application demonstrates how to:

1. Set up a Linear OAuth application with agent capabilities
2. Handle the OAuth flow for installation
3. Process webhook notifications
4. Respond to mentions and assignments

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Linear workspace where you have admin permissions

## Setup Instructions

### 1. Create a Linear OAuth Application

1. Go to your Linear workspace settings
2. Navigate to "API" > "OAuth applications"
3. Click "Create new"
4. Fill in the application details:
   - Name: "Browsing Linear Agent" (or your preferred name)
   - Redirect URI: `http://localhost:3000/auth/callback`
   - Description: A brief description of your agent
5. Under "Webhook settings", enable webhooks and select "Inbox notifications"
6. Save the application
7. Note your Client ID and Client Secret

### 2. Configure the Environment

1. Clone this repository
2. Create a `.env` file in the root directory based on `.env.example`
3. Fill in your Linear OAuth application credentials:
   ```
   LINEAR_CLIENT_ID=your_client_id
   LINEAR_CLIENT_SECRET=your_client_secret
   LINEAR_REDIRECT_URI=http://localhost:3000/auth/callback
   LINEAR_WEBHOOK_SECRET=your_webhook_secret
   PORT=3000
   NODE_ENV=development
   ```

### 3. Install Dependencies and Run

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Start the server
npm start

# For development with auto-reload
npm run dev
```

### 4. Install the Agent

1. Visit `http://localhost:3000` in your browser
2. Click the "Install Linear Agent" button
3. Authorize the application in Linear
4. After successful installation, you'll see your App User ID
5. Add this ID to your `.env` file as `LINEAR_APP_USER_ID`

## Usage

Once installed, your Linear Agent can:

- Respond to mentions in issues and comments
- Handle issue assignments
- Move issues to started state when assigned
- React to comments and issues

### Testing the Agent

1. In Linear, mention the agent in an issue or comment using `@YourAgentName`
2. Assign an issue to the agent
3. Check the server logs to see the webhook notifications
4. Observe the agent's responses in Linear

## Development

### Project Structure

- `src/index.ts` - Main server file
- `src/auth.ts` - OAuth authentication handling
- `src/webhooks.ts` - Webhook processing
- `src/types/` - TypeScript type definitions
- `public/` - Static files and frontend
- `tests/` - Test files

### Running Tests

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

### Adding New Features

To extend the agent's capabilities:

1. Add new webhook handlers in `src/webhooks.ts`
2. Implement new Linear API interactions using the Linear SDK
3. Update the frontend as needed
4. Add tests for new functionality

## CI/CD

This project uses GitHub Actions for continuous integration. The CI pipeline:

1. Builds the TypeScript code
2. Runs linting checks
3. Executes tests
4. Reports test coverage

## Resources

- [Linear Developers - Agents](https://linear.app/developers/agents)
- [Linear SDK Documentation](https://developers.linear.app/docs/sdk/getting-started)
- [Linear API Reference](https://developers.linear.app/docs/api/introduction)

## License

MIT

