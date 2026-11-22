# AI Study Buddy

A beginner-friendly full-stack study assistant with a responsive React UI, Express API, AI explanations, practice-question mode, chat history, and basic PWA support.

## 1. Requirements
- Node.js 20 or newer
- An OpenAI API key (kept on the server, never in browser code)

## 2. Install
From this project folder:

```bash
npm install
```

## 3. Add your secret key
Copy `.env.example` to `.env` in the project root and set:

```env
OPENAI_API_KEY=your_real_key
OPENAI_MODEL=gpt-4.1-mini
PORT=3001
```

Never commit `.env` or paste your API key into frontend files. The included `.gitignore` excludes it.

## 4. Run locally
```bash
npm run dev
```
Open http://localhost:5173

The Vite development server forwards `/api` requests to the backend using the included proxy configuration.

```js
server: {
  port: 5173,
  proxy: { "/api": "http://localhost:3001" }
}
```

## 5. Production build
```bash
npm run build
npm start
```

The Express server serves the built `client/dist` folder. Build the frontend first, then run `npm start`. Deploy the combined project to a Node.js host and add `OPENAI_API_KEY` as a private environment secret. If you host the frontend separately, set `CLIENT_ORIGIN` on the server to that frontend origin.

## Included
- Maths, Science, English subject selection
- AI explanation mode and practice-question mode
- Step-by-step teaching prompt
- Loading state and readable error messages
- Browser-local chat history
- Mobile navigation and responsive layout
- Basic installable PWA manifest and service worker

## Before public launch
Add authentication if chats must sync across devices or belong to individual accounts. Add persistent server-side storage, stronger abuse protection, request logging, and a privacy notice before collecting student data. The current starter stores chat history in the user's browser only. The service worker caches the app shell; AI requests still need an internet connection.
