
# Deployment Guide

## Running in Production

### Port Configuration
The application is configured to run on port **4500** by default in production.
To change this, set the `PORT` environment variable.

```bash
# Run on default port 4500
npm start

# Run on custom port 8080
PORT=8080 npm start
```

### Docker
The Dockerfile exposes port 4500.
```bash
docker build -t kechiki-app .
docker run -p 4500:4500 kechiki-app
```
