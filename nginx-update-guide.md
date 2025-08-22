# Nginx Configuration Update Guide: Migrating to /var/www/polypdf-site

This guide provides step-by-step instructions for updating your nginx configuration to serve your site from `/var/www/polypdf-site` instead of `/var/www/polypdf`.

## Prerequisites

- Root or sudo access to your server
- Nginx installed and running
- Your website files ready in the new directory

## Step 1: Backup Current Configuration

Before making any changes, backup your current nginx configuration:

```bash
sudo cp /etc/nginx/sites-available/polypdf /etc/nginx/sites-available/polypdf.backup
sudo cp /etc/nginx/sites-enabled/polypdf /etc/nginx/sites-enabled/polypdf.backup
```

## Step 2: Locate Your Nginx Configuration

Your nginx configuration file is typically located in one of these locations:

- `/etc/nginx/sites-available/polypdf` (Debian/Ubuntu)
- `/etc/nginx/conf.d/polypdf.conf` (CentOS/RHEL)
- `/etc/nginx/nginx.conf` (if using main config)

## Step 3: Update the Root Directory

Edit your nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/polypdf
```

Find the `root` directive and update it from:
```nginx
root /var/www/polypdf;
```

To:
```nginx
root /var/www/polypdf-site;
```

### Complete Example Configuration

Here's a complete nginx configuration example for reference:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name polypdf.app www.polypdf.app;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name polypdf.app www.polypdf.app;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/polypdf.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/polypdf.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Updated root directory
    root /var/www/polypdf-site;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logs
    access_log /var/log/nginx/polypdf-site.access.log;
    error_log /var/log/nginx/polypdf-site.error.log;
}
```

## Step 4: Update Log File Paths (Optional)

If you want to update the log file names to match the new directory structure:

```nginx
access_log /var/log/nginx/polypdf-site.access.log;
error_log /var/log/nginx/polypdf-site.error.log;
```

## Step 5: Test Nginx Configuration

Before reloading nginx, test the configuration for syntax errors:

```bash
sudo nginx -t
```

You should see:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

## Step 6: Create the New Directory and Set Permissions

Create the new directory if it doesn't exist:

```bash
sudo mkdir -p /var/www/polypdf-site
```

Set proper ownership and permissions:

```bash
# Set ownership to the web server user (usually www-data on Ubuntu/Debian)
sudo chown -R www-data:www-data /var/www/polypdf-site

# Set directory permissions
sudo chmod -R 755 /var/www/polypdf-site
```

## Step 7: Move Your Files

If you're migrating from the old directory:

```bash
# Copy files from old to new directory
sudo cp -r /var/www/polypdf/* /var/www/polypdf-site/

# Or move them if you want to remove from old location
sudo mv /var/www/polypdf/* /var/www/polypdf-site/
```

## Step 8: Reload Nginx

After confirming the configuration is valid, reload nginx:

```bash
sudo systemctl reload nginx
```

Or on older systems:

```bash
sudo service nginx reload
```

## Step 9: Verify the Changes

1. Check nginx status:
   ```bash
   sudo systemctl status nginx
   ```

2. Visit your website to ensure it's loading correctly

3. Check the error logs for any issues:
   ```bash
   sudo tail -f /var/log/nginx/polypdf-site.error.log
   ```

## Troubleshooting

### Common Issues and Solutions

1. **403 Forbidden Error**
   - Check directory permissions: `ls -la /var/www/polypdf-site`
   - Ensure nginx user has read access
   - Check for .htaccess files blocking access

2. **404 Not Found**
   - Verify files exist in the new directory
   - Check the `index` directive points to the correct file
   - Ensure the `root` path is absolute and correct

3. **502 Bad Gateway**
   - If using a reverse proxy, update upstream configurations
   - Check if your application is running

4. **Site Still Loading from Old Directory**
   - Clear browser cache
   - Check for hardcoded paths in your application
   - Verify no other server blocks are conflicting

### SELinux Considerations (CentOS/RHEL)

If you're using SELinux, you may need to update the security context:

```bash
sudo semanage fcontext -a -t httpd_sys_content_t "/var/www/polypdf-site(/.*)?"
sudo restorecon -Rv /var/www/polypdf-site
```

## Additional Considerations

### Update Any Deployment Scripts

Don't forget to update:
- CI/CD pipelines
- Deployment scripts
- Backup scripts
- Any hardcoded paths in your application

### Update SSL Certificate Paths

If your SSL certificates reference the old directory, update them accordingly.

### Monitor After Migration

Keep an eye on:
- Error logs: `/var/log/nginx/polypdf-site.error.log`
- Access logs: `/var/log/nginx/polypdf-site.access.log`
- Server performance and response times

## Rollback Plan

If you need to rollback:

1. Restore the original configuration:
   ```bash
   sudo cp /etc/nginx/sites-available/polypdf.backup /etc/nginx/sites-available/polypdf
   ```

2. Test and reload:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Conclusion

After following these steps, your nginx server should now be serving content from `/var/www/polypdf-site`. Remember to update any related configurations, scripts, or documentation that reference the old path.