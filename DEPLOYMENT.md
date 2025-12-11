# Deployment Documentation

This document details the deployment setup for the `studioxo` project on an Ubuntu VPS.

## Overview
We have containerized the Next.js application using Docker to ensure consistent behavior across different environments. A shell script (`deploy.sh`) automates the deployment process.

## 1. Environment Setup

### Prerequisites
- **Ubuntu VPS** (e.g., AWS EC2, DigitalOcean). Recommended size: `t3.small` (2GB RAM) or larger to avoid Out-Of-Memory errors during build.
- **SSH Access**: Key pair (`.pem` file) and username (usually `ubuntu`).
- **Ports**: Inbound Traffic on Port `3000` must be allowed in the server's Firewall/Security Group.

## 2. Docker Configuration

### Dockerfile
A multi-stage `Dockerfile` is used to create an optimized production image:
1.  **base**: Alpine Node.js image.
2.  **deps**: Installs dependencies.
3.  **builder**: Builds the Next.js application (`npm run build`).
4.  **runner**: Minimal image that runs the app `server.js`.

### docker-compose.yml
Simple orchestration to run the container:
-   Restarts automatically on failure (`restart: always`).
-   Maps host port `3000` to container port `3000`.

## 3. Deployment Script (`deploy.sh`)

The `deploy.sh` script automates the following:
1.  **Connects** to the server via SSH.
2.  **Installs Docker** if it's missing.
3.  **Syncs** your local project files to the server (excluding `node_modules`).
4.  **Rebuilds** and **Restarts** the Docker container.

### Usage
```bash
./deploy.sh <SERVER_IP> <USERNAME> <KEY_PATH>
```

**Example:**
```bash
./deploy.sh 3.226.180.13 ubuntu /Users/shazej/Downloads/testt.pem
```

## 4. Code Changes

To support the production build and deployment, the following changes were made:

### `next.config.ts`
-   Added `output: 'standalone'` to optimize the Docker image size.

### Refactoring Dynamic Pages
The files `src/app/(main)/product/[productName]/page.tsx` and `src/app/(main)/category/[slug]/page.tsx` were refactored to separate **Server Components** from **Client Components**.
-   **Server Component** (`page.tsx`): Handles `generateStaticParams` for pre-rendering paths.
-   **Client Component** (`client.tsx`): Handles interactive UI (State, Hooks).

This change was necessary because `generateStaticParams` cannot be used in the same file as `'use client'`.

## 5. Troubleshooting

### "Connection Timeout"
-   **Cause**: AWS Security Group closing port 3000.
-   **Fix**: Open Port 3000 in your AWS EC2 Security Group for "Custom TCP".

### "Server stopped responding"
-   **Cause**: Out of Memory (OOM) during `next build`.
-   **Fix**: Upgrade server instance to at least 2GB RAM (e.g., `t3.small`).
