# Deployment Guide for PolyPDF Site

This guide explains how to deploy the PolyPDF landing page and its direct-download artifacts to the production server.

## Prerequisites

1. A DigitalOcean droplet (or any Linux server)
2. Node.js 20 and npm installed on the server
3. Nginx installed (for production deployment)
4. systemd access for the license API service
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
   # Create directories for the site build and direct-download artifacts
   sudo mkdir -p /var/www/polypdf-site/build
   sudo mkdir -p /var/www/polypdf-downloads
   sudo mkdir -p /var/lib/polypdf
   
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
   sudo certbot --nginx -d polypdf.com -d www.polypdf.com
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
sudo rsync -av --delete build/ /var/www/polypdf-site/build/
sudo systemctl reload nginx
```

## Downloads And Sparkle

Production serves the website build from `/var/www/polypdf-site/build` and direct-download artifacts from `/var/www/polypdf-downloads`.

- Stable DMG URL: `https://www.polypdf.com/downloads/PolyPDFMac.dmg`
- Primary Sparkle feed: `https://www.polypdf.com/downloads/polypdfmac-appcast.xml`
- Legacy `appcast.xml` should redirect to `polypdfmac-appcast.xml` instead of serving a second feed
- Publish release archives with `scripts/publish_sparkle_release.sh`, then verify the live feed contains the shipped versioned archive

## Stripe License API

The direct Mac app activates against the PolyPDF license API, proxied by Nginx under `https://www.polypdf.com/api/`.

```bash
cd /var/www/polypdf-site/Website/license-api
npm install --omit=dev
sudo install -d -o www-data -g www-data /var/lib/polypdf
sudo cp .env.example /etc/polypdf/license-api.env
sudo nano /etc/polypdf/license-api.env
```

Required production values:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `LICENSE_SIGNING_SECRET`
- `RESEND_API_KEY`
- `SUPPORT_EMAIL=support@polypdf.app`

Example systemd unit:

```ini
[Unit]
Description=PolyPDF License API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/polypdf-site/Website/license-api
EnvironmentFile=/etc/polypdf/license-api.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

After installing the unit:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now polypdf-license-api
curl -fsS https://www.polypdf.com/api/licenses/healthz || curl -fsS http://127.0.0.1:3087/healthz
```

Configure Stripe with a one-time `PolyPDF Pro for Mac` price and a webhook destination pointed at `https://www.polypdf.com/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `refund.created`, `refund.updated`, and `charge.refunded`.

## Environment Variables

If you need environment variables, create a `.env` file in the project root:

```env
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
