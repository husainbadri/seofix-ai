# Production Deployment & Infrastructure Guide

This guide details steps for deploying the **AI SEO Audit Platform** to production environments.

---

## 🏗️ Architecture Overview

The system runs as a multi-tier microservice architecture:
1. **Frontend App (`apps/web`)**: Next.js 14 App Router client & SSR server.
2. **Core API Server (`apps/api`)**: Node.js / Express backend handling HTTP requests, AI chat, and reports.
3. **Queue Worker (`apps/api/src/workers`)**: BullMQ worker executing asynchronous domain crawls and 25 SEO sub-skills.
4. **PostgreSQL Database**: Primary relational data store managed via Prisma ORM.
5. **Redis Cache**: Message queue broker for BullMQ background workers.

---

## 🛠️ Step-by-Step Deployment Options

### Option 1: Docker Compose (Single Host / Cloud VM)

1. Provision an Ubuntu 22.04 LTS instance (e.g. AWS EC2 t3.medium or DigitalOcean Droplet).
2. Install Docker & Docker Compose.
3. Clone repository and set up production environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with production database credentials and API tokens
   ```
4. Build and start services:
   ```bash
   docker-compose up -d --build
   ```

---

## 🔒 Production Security Checklist

- [x] Enable SSL/TLS encryption via Reverse Proxy (Nginx / Cloudflare).
- [x] Set strong `POSTGRES_PASSWORD` and `DATABASE_URL` credentials.
- [x] Restrict Redis port 6379 to internal Docker bridge network.
- [x] Configure Google Search Console & Ads Developer Tokens safely in environment variables.
