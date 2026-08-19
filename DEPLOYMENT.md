# Deployment Guide for PolyPDF Site

This guide explains how to deploy the PolyPDF landing page and its direct-download artifacts to the production server.

## Prerequisites

1. A DigitalOcean droplet (or any Linux server)
2. Node.js 18 and npm installed on the server
3. Nginx installed (for production deployment)
4. systemd access for the license API service
5. Git installed and configured

## GitHub Secrets Required

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

- `SSH_PRIVATE_KEY`: Your SSH private key for accessing the server
- `DROPLET_HOST`: Your server's IP address or domain
- `DROPLET_USER`: SSH username (usually `root` or a sudo user)

## Deployment Architecture

The `deploy.yml` workflow builds a commit-addressed release, atomically switches the `current` symlink, and lets Nginx serve that selected directory. A live smoke test covers every registered HTML route plus download, trust, checkout, and plugin-authoring artifacts. A post-activation failure restores the previous symlink target; a validation failure before activation leaves the healthy current release untouched.

```bash
# On your server, create the directory:
sudo mkdir -p /var/www/polypdf-site
sudo chown -R $USER:$USER /var/www/polypdf-site

# Clone the repository:
cd /var/www/polypdf-site
git clone https://github.com/mohammedbala/polypdf_site.git .
```

### Initial Nginx setup

1. **Set up Nginx:**
   ```bash
   # Create directories for versioned site releases and direct-download artifacts
   sudo mkdir -p /var/www/polypdf-site/releases
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

# Install the exact locked dependency tree
npm ci --include=dev

# Build into a temporary commit-addressed candidate and select it atomically
release_sha=$(git rev-parse HEAD)
release="releases/$release_sha"
candidate="releases/$release_sha.next"
if [ "$(readlink current || true)" = "$release" ]; then
  echo "$release_sha is already active; leaving it intact"
  exit 0
fi
rm -rf "$candidate"
NODE_OPTIONS=--experimental-global-webcrypto BUILD_PATH="$candidate" npm run build
test -s "$candidate/index.html"
rm -rf "$release"
mv "$candidate" "$release"
ln -sfn "$release" current.next
mv -Tf current.next current

# Configure the Nginx document root as:
# /var/www/polypdf-site/current
```

## Downloads And Sparkle

Production serves the website release selected by `/var/www/polypdf-site/current` and direct-download artifacts from `/var/www/polypdf-downloads`.

- Stable DMG URL: `https://www.polypdf.com/downloads/PolyPDFMac.dmg`
- Primary Sparkle feed: `https://www.polypdf.com/downloads/polypdfmac-appcast.xml`
- Legacy `appcast.xml` should redirect to `polypdfmac-appcast.xml` instead of serving a second feed
- Publish release archives with `scripts/publish_sparkle_release.sh`, then verify the live feed contains the shipped versioned archive

## Stripe License API

The direct Mac and Windows apps activate against the PolyPDF license API, proxied by Nginx under `https://www.polypdf.com/api/`.

```bash
# From the main PolyPDF repository:
scripts/deploy_license_api.sh ~/.ssh/polypdf-deploy root@your-server-ip
```

Required production values:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `LICENSE_SIGNING_SECRET`
- `RESEND_API_KEY`
- `SUPPORT_EMAIL=support@polypdf.com`

The API deploy keeps versioned releases under `/opt/polypdf-license-api-releases`, atomically selects `/opt/polypdf-license-api`, restarts the existing systemd unit, checks `/api/healthz`, and rolls back automatically if validation fails. Production secrets remain in `/etc/polypdf/license-api.env`.

```bash
curl -fsS https://www.polypdf.com/api/healthz
```

Configure Stripe with the one-time `PolyPDF Pro Founder's License — Perpetual 1.x` price and a webhook destination pointed at `https://www.polypdf.com/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `refund.created`, `refund.updated`, and `charge.refunded`.

## Environment Variables

If you need environment variables, create a `.env` file in the project root:

```env
REACT_APP_ANALYTICS_ID=your-analytics-id
```

## Monitoring

Check the Nginx-served site:
```bash
sudo tail -f /var/log/nginx/polypdf-site.error.log
```

## Troubleshooting

1. **Build fails**: Check Node.js version matches local development
2. **404 errors**: Ensure nginx configuration handles React Router
3. **Permission errors**: Check file ownership and permissions
4. **SSL issues**: Verify certificate paths and renewal

## Rollback

The deployment workflow records the prior `current` target and automatically switches back when any revenue/trust smoke fails. For a manual rollback:
```bash
cd /var/www/polypdf-site
previous=$(cat .deploy-previous-target)
test -s "$previous/index.html"
ln -sfn "$previous" current.rollback
mv -Tf current.rollback current
```
