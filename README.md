# CoCo POps

A full-stack web application for managing inspections, certifications, and related workflows.

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Radix UI
- **Backend**: Express.js, tRPC
- **Database**: MySQL with Drizzle ORM
- **Authentication**: JWT with jose
- **File Storage**: AWS S3
- **PDF Generation**: PDFKit, pdf-lib

## Project Structure

```
├── client/          # React frontend application
│   ├── public/      # Static assets
│   └── src/         # Source code
├── server/          # Express backend
│   ├── _core/       # Core server setup
│   └── *.ts         # API routes and services
├── shared/          # Shared types and utilities
├── drizzle/         # Database migrations
└── patches/         # Package patches
```

## Getting Started

### Prerequisites

- Node.js 22.x
- pnpm 10.x
- MySQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration.

4. Run database migrations:
   ```bash
   pnpm db:push
   ```

5. Start development server:
   ```bash
   pnpm dev
   ```

### Production Build

```bash
pnpm build
pnpm start
```

## Deployment

This application is configured for deployment on Vercel with the following considerations:

- Backend runs as a serverless function
- Database should be hosted externally (e.g., PlanetScale, Railway, AWS RDS)
- Environment variables must be configured in Vercel dashboard
- Static assets are served from the `client/public` directory

## Environment Variables

See `.env.example` for required environment variables.

## License

MIT
