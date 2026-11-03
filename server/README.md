# StudyDesk PostgreSQL API

This API keeps the PostgreSQL password on the server. The website sends sign-in requests to the API and saves each student's StudyDesk data under that student's account.

## Run it locally

1. Install Node.js 20+ and PostgreSQL.
2. Create a database named `studydesk` (for example, in `psql`: `CREATE DATABASE studydesk;`).
3. Run `psql -d studydesk -f server/schema.sql` from the project directory.
4. Copy `server/.env.example` to `server/.env`. Set `DATABASE_URL` to your PostgreSQL username, password, host, and database. Set `JWT_SECRET` to a random secret of at least 32 characters.
5. In a terminal, run `cd server`, `npm install`, then `npm start`.
6. Open `http://localhost:3000/login.html`. Express serves the website and API from the same origin.

The health endpoint is `http://localhost:3000/api/health`. Keep `server/.env` private; it contains credentials and should never be committed or copied into browser JavaScript.

## API

- `POST /api/auth/register` with `{ "name", "email", "password" }`
- `POST /api/auth/login` with `{ "email", "password" }`
- `GET /api/data` with `Authorization: Bearer <token>`
- `PUT /api/data` with `Authorization: Bearer <token>` and the StudyDesk JSON object

The app expects to be served from the same origin as the API in this starter. For separate production domains, configure a strict CORS allowlist and HTTPS before deployment.
