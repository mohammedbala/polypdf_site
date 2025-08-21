# Deployment Guide for PolyPDF Site

This guide explains how to deploy the PolyPDF landing page to your server.

## Prerequisites

1. A DigitalOcean droplet (or any Linux server)
2. Node.js and npm installed on the server
3. Nginx installed (for production deployment)
4. PM2 installed globally (`npm install -g pm2`)
5. Git installed and configured

## GitHub Secrets Required

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

- `SSH_PRIVATE_KEY`: Your SSH private key for accessing the server
- `DROPLET_HOST`: Your server's IP address or domain
- `DROPLET_USER`: SSH username (usually `root` or a sudo user)

## Deployment Options

### Option 1: PM2 with Serve (Simple)

Uses the `deploy.yml` workflow. This serves the React build using PM2 and the `serve` package.

```bash
# On your server, create the directory:
sudo mkdir -p /var/www/polypdf-site
sudo chown -R $USER:$USER /var/www/polypdf-site

# Clone the repository:
cd /var/www/polypdf-site
git clone https://github.com/mohammedbala/polypdf_site.git .
```

### Option 2: Nginx (Recommended for Production)

Uses the `deploy-nginx.yml` workflow. This builds the app and serves it with Nginx.

1. **Setup Nginx:**
   ```bash
   # Create directory for the built files
   sudo mkdir -p /var/www/html/polypdf-site
   
   # Copy the nginx configuration
   sudo cp nginx.conf.example /etc/nginx/sites-available/polypdf-site
   
   # Enable the site
   sudo ln -s /etc/nginx/sites-available/polypdf-site /etc/nginx/sites-enabled/
   
   # Test and reload nginx
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Setup SSL (if using HTTPS):**
   ```bash
   # Install Certbot
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   
   # Get SSL certificate
   sudo certbot --nginx -d polypdf.app -d www.polypdf.app
   ```

## Manual Deployment

If you prefer to deploy manually:

```bash
# SSH into your server
ssh user@your-server-ip

# Navigate to the project directory
cd /var/www/polypdf-site

# Pull latest changes
git pull origin master

# Install dependencies
npm install

# Build the project
npm run build

# For PM2 deployment:
pm2 start serve --name "polypdf-site" -- -s build -l 3001

# For Nginx deployment:
sudo cp -r build/* /var/www/html/polypdf-site/
sudo systemctl reload nginx
```

## Environment Variables

If you need environment variables, create a `.env` file in the project root:

```env
REACT_APP_API_URL=https://api.polypdf.app
REACT_APP_ANALYTICS_ID=your-analytics-id
```

## Monitoring

Check the app status:
```bash
# If using PM2
pm2 status
pm2 logs polypdf-site

# If using Nginx
sudo tail -f /var/log/nginx/polypdf-site.error.log
```

## Troubleshooting

1. **Build fails**: Check Node.js version matches local development
2. **404 errors**: Ensure nginx configuration handles React Router
3. **Permission errors**: Check file ownership and permissions
4. **SSL issues**: Verify certificate paths and renewal

## Rollback

To rollback to a previous version:
```bash
cd /var/www/polypdf-site
git log --oneline  # Find the commit to rollback to
git reset --hard <commit-hash>
npm install
npm run build
# Restart/reload your server
```