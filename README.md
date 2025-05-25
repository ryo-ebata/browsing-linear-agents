# Linear Agents Environment

A TypeScript application for setting up and using Linear Agents, enabling seamless integration with Linear's API for automation and enhanced productivity.

## Features

- OAuth authentication flow with proper agent scopes
- Webhook handling for agent notifications
- Automatic issue assignment and status updates
- Reaction and comment handling
- TypeScript for type safety and better developer experience

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Linear account with admin access
- A registered Linear OAuth application

## Setup

1. Clone the repository:

```bash
git clone https://github.com/ryo-ebata/browsing-linear-agents.git
cd browsing-linear-agents
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on the example:

```bash
cp .env.example .env
```

4. Fill in the environment variables in the `.env` file:

```
# Linear OAuth Application credentials
LINEAR_CLIENT_ID=your_client_id
LINEAR_CLIENT_SECRET=your_client_secret
LINEAR_REDIRECT_URI=http://localhost:3000/auth/callback

# Linear API token (for testing and webhook setup)
LINEAR_TOKEN=your_linear_token

# Webhook secret (for verifying webhook signatures)
LINEAR_WEBHOOK_SECRET=your_webhook_secret

# Webhook URL (for setting up the webhook)
LINEAR_WEBHOOK_URL=https://your-domain.com/webhook
```

## Creating a Linear OAuth Application

1. Go to your Linear workspace settings
2. Navigate to "API" > "OAuth applications"
3. Click "Create new"
4. Fill in the application details:
   - Name: Your application name
   - Redirect URL: `http://localhost:3000/auth/callback` (for local development)
   - Scopes: Select `read`, `write`, `issues:create`, `comments:create`
   - Actor: Select "App"
   - Check "App can be assigned to issues" and "App can be mentioned"
5. Save the application and note the Client ID and Client Secret

## Running the Application

1. Build the TypeScript code:

```bash
npm run build
```

2. Start the server:

```bash
npm start
```

3. Visit `http://localhost:3000` in your browser to install the agent in your Linear workspace

## Setting Up Webhooks

After installing the agent, you need to set up a webhook to receive notifications from Linear:

1. Make sure your server is accessible from the internet (you can use ngrok for local development)
2. Run the webhook setup script:

```bash
node dist/setup-webhook.js
```

3. Follow the prompts to enter your webhook URL

## Testing the Connection

To test your Linear API connection:

```bash
node dist/test.js
```

## Development

For development with hot reloading:

```bash
npm run dev
```

## Running Tests

```bash
npm test
```

## Linting

```bash
npm run lint
```

## License

MIT

