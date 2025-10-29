## Moodle Frontend Integration

This repository contains a lightweight React frontend that integrates with a backend proxy to Moodle's Web Services. The UI allows users to browse Moodle courses, view course details and sections, register/login, and enroll into courses.

### High-level Architecture

- **Frontend (this project)**: React app created with Create React App. Main logic lives in `src/App.js` with a few composable views (Landing, Register, Login, Course Details).
- **Backend proxy**: Expected to run at `http://localhost:5000`. It exposes simplified REST endpoints and connects to your Moodle instance via Moodle Web Services (token-based auth). The frontend never calls Moodle directly.

Data flow:
1. Frontend calls backend REST endpoints (e.g., `/api/moodle-courses`).
2. Backend authenticates against Moodle using a token and invokes Moodle Web Service functions.
3. Backend normalizes responses and returns JSON to the frontend.
4. Frontend renders lists, details, and lets users enroll or manage sessions.

## Available Features

- **Browse courses**: Fetches a list of courses and renders a responsive grid.
- **View course details**: Loads course metadata and section/module contents.
- **Register**: Creates a user via the backend; on success, signs in locally.
- **Login**: Authenticates via backend and stores a session locally.
- **Enroll into a course**: Enrolls the current or specified user into a course; supports optional role selection by role ID.
- **Session persistence**: Stores current user in `localStorage` and shows contextual actions (Profile/Logout) in the navbar.

## How the Frontend Connects to Moodle

The frontend does not talk to Moodle directly. It interacts with a backend proxy hosted at `http://localhost:5000`, which in turn communicates with Moodle's Web Services using a Moodle token.

Endpoints used by the frontend:
- `GET /api/moodle-courses`: Returns an array of course objects.
- `GET /api/courses/:id`: Returns course metadata (typically wrapped under `courses[0]`).
- `GET /api/courses/:id/contents`: Returns sections with modules for the course.
- `POST /api/register`: Registers a new user; may return `{ user: { ... } }` on success.
- `POST /api/login`: Authenticates and returns `{ user, token }`.
- `POST /api/enroll`: Enrolls a user into a course `{ username, courseid, roleid? }`.

Token handling in the frontend:
- The frontend stores the current "session" under `localStorage.currentUser`.
- For simplicity in this integration, the stored token value is currently set to a fixed token string `76b0021b6dd8585361cc977655a27ab0` on successful register/login to align with backend/Moodle usage. If your backend returns a token and you prefer to use that instead, see the Configuration section below.

## Project Structure

- `src/App.js`: All views and logic in a single file for simplicity. Contains:
  - `Navbar`, `Hero`, `CourseGrid` (landing page components)
  - `Register` form and submission logic
  - `Login` form and submission logic
  - `CourseDetails` view with enrollment actions
  - Helpers for persisting the current user in `localStorage`

## Quick Start

Prerequisites:
- Node.js 18+ and npm
- Backend proxy running locally at `http://localhost:5000` with a valid Moodle token configured

Install and run:
1. `npm install`
2. `npm start`
3. Open `http://localhost:3000`

## Configuration

- **Backend base URL**: The frontend currently uses absolute URLs pointing to `http://localhost:5000` in `src/App.js` (`/api/moodle-courses`, `/api/login`, `/api/register`, `/api/enroll`, `/api/courses/:id`, `/api/courses/:id/contents`).
  - To change the API base, search these URLs in `src/App.js` and update them, or refactor them behind an environment variable.

- **Token behavior**: On successful register/login, the frontend sets `currentUser.token` to the fixed value `76b0021b6dd8585361cc977655a27ab0` so that subsequent actions assume a known token.
  - If your backend returns a token and you want to store that instead, update the following in `src/App.js`:
    - In Register success: replace the fixed token with a backend-provided value.
    - In Login success: replace the fixed token with `data?.token`.

- **Optional Moodle service**: The Login form allows specifying a Moodle Web Service `service` name. When provided, it is sent to the backend and cached in `localStorage.moodleService`.

## Expected Backend Responses (at a glance)

- `GET /api/moodle-courses` → `[{ id, fullname, shortname, categoryid?, idnumber?, startdate? }]`
- `GET /api/courses/:id` → `{ courses: [{ id, fullname, shortname, ... }] }` or a normalized object
- `GET /api/courses/:id/contents` → `[{ id, name, section, modules: [{ id, name, modname, ... }] }]`
- `POST /api/register` → `{ user: { id, username, firstname, lastname, email } }`
- `POST /api/login` → `{ user: { id|userid, username, firstname, lastname }, token }`
- `POST /api/enroll` → `{ userid, courseid, roleid }` on success

## Security Notes

- Do not commit real production tokens to version control. Use environment variables on the backend and a secure auth flow in production.
- The fixed token approach is only for local integration/testing. Replace it with a proper auth/token flow for real deployments.

## Troubleshooting

- **Empty courses list**: Ensure the backend is running and reachable at `http://localhost:5000`, and that the backend can connect to your Moodle instance with a valid token.
- **CORS errors**: Configure CORS on the backend to allow `http://localhost:3000` during development.
- **500/exception from course endpoints**: The frontend surfaces `exception` messages from backend/Moodle responses. Check backend logs and Moodle WS permissions.
- **Enrollment fails**: Verify the user exists in Moodle and has permission to be enrolled; confirm `roleid` is valid (default role is typically 5 for student).

## Next Steps / Improvements

- Move API base URLs to environment variables (`REACT_APP_API_BASE`)
- Extract API client to a separate module and add centralized error handling
- Replace fixed token with backend-issued tokens and attach them to requests
- Add protected routes and a real profile page
- Improve UI components and add tests
