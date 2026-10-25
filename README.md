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
BETTER_AUTH_URL="http://localhost:3000"
```

### 3. Database Operations

Prepare and sync your database schema using Prisma:

```bash
# Push schema changes to the database during development
npx prisma db push

# Generate Prisma Client
npx prisma generate

# (Optional) Open Prisma Studio to inspect data visually
npx prisma studio
```

### 4. Application Lifecycle Commands

Commands to run, build, and deploy the application:

```bash
# Start the local development server with hot-reload
npm run dev

# Build the app for production
npm run build

# Start the production server
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