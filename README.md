# Color Game Client

A simple client application for the Color Game, built with Lit web components.

## Features

- User authentication (login/signup)
- Session management
- Dashboard view
- Modern web components with Lit
- Client-side routing

## Project Structure

```
color-game-client/
├── src/
│   ├── services/         # API calls and data fetching
│   │   ├── api-fetch.js
│   │   └── users.js
│   ├── session/          # Session management
│   │   └── session.js
│   ├── router/           # Client-side routing
│   │   ├── routes.js
│   │   └── router-mixin.js
│   ├── views/            # View components
│   │   ├── login/
│   │   ├── signup/
│   │   └── dashboard/
│   ├── shared/           # Shared components
│   │   └── components/
│   ├── styles/           # Global styles
│   │   └── global-styles.js
│   └── app-enter.js      # Main app entry point
├── index.html
├── webpack.config.js
└── package.json
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.template`:
```bash
cp .env.template .env
```

3. Update the `.env` file with your API URL if needed.

## Development

Start the development server:
```bash
npm start
```

The app will be available at `https://localhost:8000`

## Build

Build for production:
```bash
npm run build
```

The built files will be in the `dist/` directory.

## Routes

- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - User dashboard (requires authentication)

## Technologies

- **Lit** - Web components library
- **Webpack** - Module bundler
- **path-to-regexp** - Route matching
