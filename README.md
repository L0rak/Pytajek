# Pytajek




A full-stack application built with Next.js, secured by Better Auth, and backed by PostgreSQL with Prisma ORM.

---

## Tech Stack & Versions

- **Framework:** [![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
- **Authentication:** [![Better Auth](https://img.shields.io/badge/Better_Auth-1.7.12-blue?style=flat-square)](https://www.better-auth.com/)
- **ORM:** [![Prisma](https://img.shields.io/badge/Prisma-7.10-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
- **Database:** [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.x-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
---

## Prerequisites

Ensure you have the following installed locally before proceeding:

- [Node.js](https://nodejs.org/) (`>= 20.x`)
- [npm](https://www.npmjs.com/) (`>= 10.x`)
- [PostgreSQL](https://www.postgresql.org/) running locally or a remote database instance URL

---

## Quick Run & Command Guide

### 1. Installation

Install all project dependencies:

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory and configure your credentials:

```env
# Database connection string
DATABASE_URL="postgresql://user:password@localhost:5432/pytajek?schema=public"

# Better Auth Secret & Base URL
BETTER_AUTH_SECRET="your-super-secret-key"
BETTER_AUTH_URL="http://localhost:2337"

# Gemini API key
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Database Operations

Apply the migrations and generate the client using Prisma:

```bash
# Apply database migrations
npx prisma migrate deploy --config prisma7.config.ts

# Generate Prisma Client
npx prisma generate --config prisma7.config.ts

# (Optional) Open Prisma Studio to inspect data visually
npx prisma studio --config prisma7.config.ts
```

### 4. Application Lifecycle Commands

Pytajek is meant to run on one computer. Open it at `http://localhost:2337`: the microphone needs `localhost` or HTTPS, and logging in from `127.0.0.1` or a network IP is rejected by the auth origin check. There is no e-mail verification or password reset.

Commands to run, build, and deploy the application:

```bash
# Start the local development server with hot-reload (http://localhost:2337)
npm run dev

# Build the app for production
npm run build

# Start the production server (http://localhost:2337)
npm run start
```

---

## Project Structure Overview

```text
├── app/               # Next.js App Router (pages, layouts, API routes)
├── components/        # Reusable UI components
├── src/lib            # Shared libraries (Prisma client, Better Auth config)
├── prisma/            # Prisma schema and database migrations
└── public/            # Static assets
```


## Authors

All rights reserved for the respected authors:

Krzysztof Dudzik, Karol Brodowicz, Marcin Węgrzyn, Adam Jabłoński