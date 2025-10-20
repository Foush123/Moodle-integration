## Moodle Integration – Setup and Enablement Guide

This repository contains a Node.js backend (`server.js`) and a React frontend (`moodle-frontend/`) designed to integrate with Moodle. This guide explains how to set up the project locally, configure environments, and enable the integration inside Moodle using several supported approaches.

The instructions are tailored for Windows PowerShell and use npm.


### Overview

- **Backend**: Node.js server at the repository root (`server.js`).
- **Frontend**: React app under `moodle-frontend/`.
- **Integration options in Moodle**:
  - LTI 1.3 (recommended for secure, standards-based SSO and grade/passback)
  - External Tool (simple URL/iframe embedding)
  - Web Services + Token (REST calls to Moodle APIs)


### Prerequisites

- Node.js 18+ and npm 9+
- A Moodle site where you have admin access (site-level)
- Windows PowerShell (commands below assume PowerShell)


### Repository Layout

- `server.js`: Node.js server entry point
- `package.json` and `package-lock.json`: Backend dependencies and scripts
- `moodle-frontend/`: React application
  - `src/`, `public/`, and typical CRA structure
- `node_modules/` (generated after install)


### Local Setup

1) Clone or extract this repository, then open PowerShell in the project root:

```bash
cd C:\Users\Administrator\Downloads\Moodle-integration
```

2) Install backend dependencies:

```bash
npm install
```

3) Install frontend dependencies:

```bash
cd .\moodle-frontend
npm install
```

4) Create environment files (optional but recommended):

- Backend (project root): create `.env` with values appropriate to your deployment

```bash
# Example .env (root)
PORT=4000
NODE_ENV=development
# If you implement LTI 1.3, you will also need issuer, client IDs, keys, etc.
# LTI_ISSUER=https://your-moodle.example.com
# LTI_CLIENT_ID=...
# LTI_DEPLOYMENT_ID=...
# LTI_AUTHORIZATION_ENDPOINT=...
# LTI_TOKEN_ENDPOINT=...
# LTI_JWKS_ENDPOINT=...
# PRIVATE_KEY_PEM="..."
```

- Frontend (`moodle-frontend/`): create `.env` with the backend URL the React app should call

```bash
# Example moodle-frontend/.env
REACT_APP_API_BASE=http://localhost:4000
PORT=3000
```

5) Run backend and frontend (two terminals):

- Terminal A (root):

```bash
cd C:\Users\Administrator\Downloads\Moodle-integration
npm start
# or, if your package.json uses a different script, run: node server.js
```

- Terminal B (frontend):

```bash
cd C:\Users\Administrator\Downloads\Moodle-integration\moodle-frontend
npm start
```

By default, the frontend will be at `http://localhost:3000` and the backend at `http://localhost:4000` (adjust to your ports).


### Production Deployment (high-level)

- Deploy the Node.js backend behind HTTPS (reverse proxy with Nginx/Apache or a managed platform).
- Build the React frontend and serve via a static host or from the backend.

```bash
cd moodle-frontend
npm run build
# serve build/ via your chosen web server or configure the backend to serve static files
```

- Ensure all callback/launch URLs referenced in Moodle use HTTPS and are reachable from Moodle.


## Enabling the Integration in Moodle

There are three common ways to integrate. Choose the one that matches your needs and what your backend supports.


### Option A: LTI 1.3 (Recommended)

LTI 1.3 provides secure single sign-on, role provisioning, and optional services (e.g., Names and Role Provisioning Services, Assignment and Grade Services). This requires work on both the Moodle side and your backend to implement the LTI OIDC flow and JWT validation.

Prerequisites in your backend:
- Support for LTI 1.3 OIDC login initiation, auth callback, key management (JWKS or static keys), and deep-linking if needed.
- Define these endpoints (example; adapt to your server):
  - Login Initiation URL: `https://your-app.example.com/lti/login`
  - Redirect/Callback URL: `https://your-app.example.com/lti/callback`
  - JWKS URL: `https://your-app.example.com/.well-known/jwks.json`

Steps in Moodle (as Site Administrator):
1) Enable external tools:
   - Go to: Site administration → Plugins → Activity modules → External tool → Manage tools
   - Ensure LTI is enabled

2) Configure a new LTI 1.3 tool:
   - Click “Configure a tool manually”
   - Set:
     - Name: A friendly name (e.g., "My App (LTI 1.3)")
     - Platform/Tool URLs (from your backend):
       - Initiate login URL: `https://your-app.example.com/lti/login`
       - Redirection URI(s): `https://your-app.example.com/lti/callback`
       - JWKS URL: `https://your-app.example.com/.well-known/jwks.json`
     - Public key type: URL (prefer) or paste public key
     - Custom parameters: optional (key=value lines)
     - Services: enable as needed (NRPS, AGS) if your backend supports them
     - Privacy: share email/name if your app requires them
   - Save changes

3) Capture issued details from Moodle:
   - Client ID
   - Issuer (Platform ID), Authorization endpoint, Token endpoint, and JWKS URL
   - Deployment ID (once you add the tool to a course)

4) Configure your backend with Moodle platform details:
   - Set environment variables like `LTI_ISSUER`, `LTI_CLIENT_ID`, `LTI_DEPLOYMENT_ID`, `LTI_AUTHORIZATION_ENDPOINT`, `LTI_TOKEN_ENDPOINT`, `LTI_JWKS_ENDPOINT`, and your private key
   - Restart your backend

5) Add the tool to a course:
   - Go to a course → Turn editing on → Add an activity or resource → External tool
   - Select your configured tool from the “Preconfigured tool” list
   - Optionally set a custom launch URL/path if your tool supports routing
   - Save and display

6) Test the launch:
   - Open the activity; verify a successful OIDC login and that the app receives an LTI launch JWT
   - Check backend logs for any validation errors

Notes:
- If deep-linking (content item selection) is required, enable it in the tool settings and implement the deep-link return flow on your backend.
- All URLs must be HTTPS in production.


### Option B: External Tool (Simple URL/iFrame)

Use this when you only need to embed your application UI and do not require LTI services or SSO. Moodle will display your app in an iframe.

Steps in Moodle:
1) Site administration → Plugins → Activity modules → External tool → Manage tools → “Configure a tool manually”
2) Set:
   - Name: e.g., "My App (Embedded)"
   - Tool URL: `https://your-app.example.com/` (or a specific route)
   - Launch container: Embed (default) or New window
   - Privacy: choose what to share (may be ignored by your app)
   - Custom parameters: optional (key=value)
3) Save, then add the tool to a course as an activity
4) Test the embedded view

Notes:
- If your app requires knowing the user, you’ll need your own auth mechanism (e.g., SSO via your IdP) since this mode is not LTI.
- Ensure your site sets appropriate `X-Frame-Options` / `Content-Security-Policy` headers to allow embedding by Moodle’s origin.


### Option C: Moodle Web Services + Token (REST)

Use this to have your app call Moodle APIs (e.g., enrollments, grades) via REST.

Enable and configure in Moodle:
1) Enable web services:
   - Site administration → Advanced features → Enable web services
2) Enable the REST protocol:
   - Site administration → Plugins → Web services → Manage protocols → Enable "REST"
3) Create an external service:
   - Site administration → Plugins → Web services → External services → Add
   - Name it (e.g., "My App Service"), set it to Enabled
   - Add required functions (e.g., `core_user_get_users_by_field`, `gradereport_user_get_grade_items`, etc.)
4) Create a service token:
   - Site administration → Plugins → Web services → Manage tokens → Add
   - Choose the user (service account) and the service you created
   - Copy the token

Use from your app/backend:
- Base URL: `https://your-moodle.example.com/webservice/rest/server.php`
- Required parameters: `wstoken`, `wsfunction`, `moodlewsrestformat=json`, and function-specific params

Example request (PowerShell):

```bash
curl "https://your-moodle.example.com/webservice/rest/server.php" \
  -G \
  --data-urlencode "wstoken=YOUR_TOKEN" \
  --data-urlencode "wsfunction=core_webservice_get_site_info" \
  --data-urlencode "moodlewsrestformat=json"
```

Security notes:
- Keep tokens secret; rotate periodically
- Use HTTPS only


## Common Configuration Values

- Frontend origin (development): `http://localhost:3000`
- Backend base URL (development): `http://localhost:4000`
- Production: use your public HTTPS domains and update Moodle tool URLs accordingly


## Troubleshooting

- Blank iframe or “refused to connect”: adjust `X-Frame-Options` and `Content-Security-Policy` to allow Moodle origin to embed your app
- LTI login loop or error: verify issuer, client ID, deployment ID, and that your backend’s time is correct (JWT expiry/nbf)
- 401/403 from backend: check CORS, cookies/samesite, and auth headers
- REST token calls failing: confirm `wsfunction` name, token permissions, and that REST protocol is enabled


## Security Considerations

- Always use HTTPS in production
- Validate JWTs and signatures for LTI 1.3 launches
- Store secrets in environment variables or a secure vault
- Apply least-privilege for Moodle web service tokens


## Support

If you run into issues enabling the integration in Moodle, capture:
- Moodle version, error messages, and screenshots where possible
- The exact tool configuration (redact secrets)
- Backend logs (sanitize tokens/keys)

Then open an issue in your tracker or contact the maintainer.


