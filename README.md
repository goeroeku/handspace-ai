# HandSpace AI

AI-powered hand gesture control for 3D space interaction using MediaPipe and Three.js

## Configuration

**IMPORTANT:** Before using this application, you need to create your configuration file:

### Initial Setup

1. **Copy the example configuration:**
   ```bash
   cp config.js.example config.js
   ```

2. **Edit `config.js` with your organization's information:**
   ```javascript
   window.APP_CONFIG = {
     organizationName: "Your Organization Name",
     websiteUrl: "https://your-website.com",
     websiteDisplay: "www.your-website.com",
     logoUrl: "https://your-website.com/logo.png",
     // ... customize all settings
   };
   ```

**Note:** `config.js` is in `.gitignore`, so your custom configuration won't be committed to the repository. Each user/organization should have their own `config.js` file.

This allows you to:
- ✅ Customize organization/school name
- ✅ Set your website URL
- ✅ Use your own logo
- ✅ Customize application title
- ✅ Adjust loading messages

The configuration file is **not minified** in production, so you can easily edit it after deployment.

## Quick Start

**IMPORTANT:** This project requires Node.js and npm for development and build.

```bash
# 1. Install dependencies (REQUIRED for first time)
npm install

# 2. Run development server (with auto-reload)
npm start

# 3. Build production files (after editing code)
npm run build

# 4. Test production build
npm run start:prod
```

**Note:**
- `package.json` and `build.js` **MUST be present** in the repository for the build process
- `npm install` is required to install build tool dependencies
- `npm run build` requires installed dependencies

## File Structure

**Development Files (Root):**
- `index.html` - HTML file for development (uses original files)
- `style.css` - CSS file for styling (development)
- `script.js` - JavaScript file for application logic (development)
- `config.js.example` - **Configuration template** - Copy this to `config.js` and customize
- `config.js` - **Your configuration file** (not in git, create from `config.js.example`)

**Production Files (Folder `dist/` - after build):**
- `dist/index.html` - HTML file for production (uses minified files)
- `dist/style.min.css` - Minified CSS (production)
- `dist/script.min.js` - Minified & obfuscated JavaScript (production)
- `dist/config.js` - **Configuration file** (not minified - edit this to customize)

**Build Tools:**
- `build.js` - Script to build production files to `dist/` folder
- `package.json` - Dependencies and npm scripts

**NPM Scripts:**
- `npm start` / `npm run start:dev` - Run development server with **auto-reload** (browser automatically refreshes when files change)
- `npm run start:prod` - Run production server (from dist/ folder)
- `npm run build` - Build production files to dist/ folder
- `npm run clean` - Remove dist/ folder
- `npm run deploy` - Build and copy to root for deployment
- `npm run pm2:start` - Start PM2 process (for VPS)
- `npm run pm2:stop` - Stop PM2 process
- `npm run pm2:restart` - Restart PM2 process
- `npm run pm2:logs` - View PM2 logs

## How to Run

**IMPORTANT:** This application uses ES Modules and Import Maps, so it **CANNOT** be run by double-clicking directly. The HTML file must be accessed through an HTTP server.

### Option 1: Using NPM Scripts (Recommended - Already Setup)

Since this project already uses a Node.js environment, the easiest way is to use npm scripts:

**Development Mode (with Auto-Reload):**
```bash
npm start
# or
npm run start:dev
```
This will run live-server at `http://localhost:8000` and automatically open the browser.
**Feature:** The browser will automatically refresh when there are changes to HTML, CSS, or JS files! 🎉

**Production Mode (Test Build):**
```bash
npm run build    # Build first
npm run start:prod
```
This will run the server from the `dist/` folder to test the production build.

### Option 2: Using Python

If Python is already installed:

```bash
# Python 3
python3 -m http.server 8000

# Or Python 2
python -m SimpleHTTPServer 8000
```

Then open your browser and access: `http://localhost:8000`

### Option 3: Using VS Code Live Server

If using VS Code:
1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 4: Using Browser with Flag (Chrome/Edge)

**For testing only, not recommended for production:**

Chrome/Edge:
```bash
# macOS/Linux
google-chrome --allow-file-access-from-files index.html

# Windows
chrome.exe --allow-file-access-from-files index.html
```

## Configuration Guide

### Initial Setup

**First time setup:**
```bash
# Copy the example configuration file
cp config.js.example config.js

# Then edit config.js with your organization's information
```

**Note:** `config.js` is in `.gitignore`, so your custom configuration won't be committed. Each user/organization should maintain their own `config.js` file.

### Customizing for Your Organization

Edit `config.js` to customize the application:

```javascript
window.APP_CONFIG = {
  // Your organization/school name (displayed in header)
  organizationName: "Your Organization Name",
  
  // Full website URL (for link)
  websiteUrl: "https://your-website.com",
  
  // Display text for website (shown in header)
  websiteDisplay: "www.your-website.com",
  
  // Logo image URL (displayed top-right)
  logoUrl: "https://your-website.com/logo.png",
  logoAlt: "Your Organization Logo",
  
  // Application title (used in page title)
  appTitle: "HandSpace AI",
  
  // Loading screen messages
  loadingText: "Loading AI System...",
  loadingHint: "Allow Camera & Ensure Adequate Lighting",
  waitingText: "Waiting for hand...",
  
  // Language (for future i18n support)
  language: "en"
};
```

### Example Configuration

**Example for a school/organization:**
```javascript
organizationName: "ABC High School",
websiteUrl: "https://abcschool.edu",
websiteDisplay: "www.abcschool.edu",
logoUrl: "https://abcschool.edu/images/logo.png",
```

### After Editing Config

1. **Development:** Changes take effect immediately after refreshing the browser
2. **Production:** 
   - Edit `config.js` in root folder
   - Run `npm run build` to copy updated config to `dist/`
   - Or edit `dist/config.js` directly after build

**Note:** `config.js` is **not minified** in production, so you can easily edit it even after deployment.

## Requirements

- Modern browser that supports ES Modules (Chrome, Firefox, Safari, Edge)
- Camera access (for hand tracking)
- Internet connection (to load Three.js and MediaPipe libraries)

## Features

- 🖐 **Palm**: Cursor to hover objects (Cyan)
- 🤏 **Pinch**: Drag objects (Yellow)
- ✊ **Fist**: Destroy objects (Red)
- 👍 **Thumbs Up**: Copy objects (Green)
- 👋 **Edge**: Camera control

## Build for Production (Minify & Obfuscate)

**IMPORTANT:** To build for production, you **MUST** have:
- ✅ `package.json` (for dependencies and scripts)
- ✅ `node_modules/` (install with `npm install`)
- ✅ `build.js` (build script)

### Production Build Workflow

**1. Install Dependencies (REQUIRED for first time or after clone):**
```bash
npm install
```
This will install all dependencies required for building:
- `terser` - to minify JavaScript
- `cssnano` - to minify CSS
- `postcss` - for CSS processing
- `javascript-obfuscator` - to obfuscate JavaScript

**2. Build Production Files:**
```bash
npm run build
```

After building, all production files will be in the `dist/` folder:
- `dist/script.min.js` - Minified and obfuscated JavaScript
- `dist/style.min.css` - Minified CSS
- `dist/index.html` - HTML file that uses minified files

**Complete Workflow:**
- **Development:** 
  - Edit files in root: `script.js`, `style.css`, `index.html`
  - Test with `npm start` (auto-reload)
  
- **Production Build:** 
  ```bash
  npm install  # Install dependencies (if not already)
  npm run build  # Build all files to dist/ folder
  npm run start:prod  # Test production build
  ```
  - Production files ready in `dist/` folder
  - Test with HTTP server from `dist/` folder
  - Deploy `dist/` folder to GitHub Pages

**Note:** 
- Original files in root (`script.js`, `style.css`, `index.html`) will not be changed
- All production files are in the `dist/` folder
- `dist/` folder is ready for deployment
- **package.json and build.js must remain in the repository** for the build process

**Security:** Obfuscation makes code harder to read, but it's not 100% secure. It's still recommended not to store sensitive information in client-side code.

## Deploy to GitHub Pages

### Deployment Preparation

**What MUST be in the repository:**
- ✅ `package.json` - for dependencies and build scripts
- ✅ `build.js` - script to build production files
- ✅ Development files: `script.js`, `style.css`, `index.html` (for development)
- ✅ `.gitignore` - to exclude `node_modules/` and `dist/`

**What does NOT need to be deployed to GitHub Pages:**
- ❌ `node_modules/` - will be ignored by `.gitignore`
- ❌ Development files in root (remain in repo for development)

**What WILL be deployed (build output):**
- ✅ `dist/index.html` - or copy to root
- ✅ `dist/script.min.js` - or copy to root
- ✅ `dist/style.min.css` - or copy to root

### Option 1: Deploy from Root (Recommended - Using npm run deploy)

1. **Create a new repository on GitHub**
   - Create a new repository with your desired name
   - Don't check "Initialize with README" (since one already exists)

2. **Local setup and build**
   ```bash
   # Clone or init repository
   git init
   
   # Install dependencies (REQUIRED for build)
   npm install
   
   # Build production files to dist/ folder
   npm run build
   
   # Copy production files to root (for GitHub Pages)
   npm run deploy
   ```

3. **Commit and push**
   ```bash
   git add .
   git commit -m "Initial commit - HandSpace AI"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO-NAME.git
   git push -u origin main
   ```

4. **Enable GitHub Pages**
   - Open the repository on GitHub
   - Click **Settings** > **Pages**
   - Under "Source", select:
     - Branch: **main**
     - Folder: **/ (root)**
   - Click **Save**

5. **Access website**
   - Website will be available at: `https://USERNAME.github.io/REPO-NAME/`
   - Usually takes a few minutes for the first time

### Option 2: Deploy from `dist/` Folder (Using GitHub Actions)

If you want to deploy only the `dist/` folder without development files in root:

1. **Setup GitHub Actions Workflow**
   - Create `.github/workflows/` folder
   - Create `deploy.yml` file with workflow to:
     - Install dependencies (`npm install`)
     - Build production (`npm run build`)
     - Deploy `dist/` folder to GitHub Pages

2. **Configure GitHub Pages**
   - Settings > Pages > Source: **GitHub Actions**

**Important:** 
- ✅ **package.json MUST be present** in the repository for the build process
- ✅ **build.js MUST be present** in the repository for the build process
- ✅ Run `npm install` before `npm run build` (can be automated with GitHub Actions)
- ✅ `dist/` folder contains all production files that are minified and obfuscated
- ❌ Don't commit `node_modules/` folder (already in `.gitignore`)
- ℹ️ Development files in root remain in the repo for development, but are not used in production

## Deploy to VPS with PM2

### VPS Preparation

**Requirements on VPS:**
- ✅ Node.js (v14 or newer)
- ✅ npm or yarn
- ✅ PM2 (will be installed automatically by script)
- ✅ SSH access to VPS
- ✅ Port 8000 (or other port as configured in package.json) open

**Initial Setup on VPS (one time only):**
```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# http-server is already in devDependencies, no need to install globally
```

### VPS Deployment Workflow

**1. Build Production Files (Local):**
```bash
npm install
npm run build
```

**2. Deploy to VPS using Script:**
```bash
# Edit deploy-vps.sh and set VPS_USER_HOST and VPS_PATH
# Or use parameters:
./deploy-vps.sh user@your-vps.com /var/www/handspace-ai
```

**3. Or Manual Deploy:**

**a. Upload files to VPS:**
```bash
# Upload dist folder
rsync -avz --delete dist/ user@your-vps.com:/var/www/handspace-ai/

# Upload config files
scp ecosystem.config.js package.json user@your-vps.com:/var/www/handspace-ai/
```

**b. Setup on VPS:**
```bash
# SSH to VPS
ssh user@your-vps.com

# Navigate to directory
cd /var/www/handspace-ai

# http-server is already in devDependencies, no need to install globally

# Stop existing process (if exists)
pm2 stop handspace-ai
pm2 delete handspace-ai

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup (optional - for auto-start after reboot)
pm2 startup
# Run the displayed command
```

### PM2 Configuration

The `ecosystem.config.js` file is already configured with:
- **Name:** `handspace-ai`
- **Script:** Uses `npm run start:prod` (safer and more reliable)
- **Port:** `8000` (change in `package.json` start:prod script if needed)
- **Auto-restart:** `true`
- **Logs:** `./logs/pm2-error.log` and `./logs/pm2-out.log`

**Change Port:**
Edit `package.json`:
```json
"start:prod": "npx http-server dist -p 8080 -a 0.0.0.0 -o"
```
Then update `ecosystem.config.js`:
```javascript
env: {
  PORT: 8080  // Update port here to match
}
```

### PM2 Commands

**Local (if running locally with PM2):**
```bash
npm run pm2:start    # Start PM2 process
npm run pm2:stop     # Stop PM2 process
npm run pm2:restart  # Restart PM2 process
npm run pm2:delete   # Delete PM2 process
npm run pm2:logs     # View logs
```

**On VPS (via SSH):**
```bash
# View logs
pm2 logs handspace-ai

# Restart
pm2 restart handspace-ai

# Stop
pm2 stop handspace-ai

# Start
pm2 start handspace-ai

# Status
pm2 status

# Monitor
pm2 monit

# List all processes
pm2 list
```

### Setup Nginx Reverse Proxy (Optional)

If you want to use a domain and HTTPS:

**1. Install Nginx:**
```bash
sudo apt update
sudo apt install nginx
```

**2. Create Nginx Config:**
```bash
sudo nano /etc/nginx/sites-available/handspace-ai
```

**3. Config content:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**4. Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/handspace-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**5. Setup SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Troubleshooting

**Port already in use:**
```bash
# Check which process is using the port
sudo lsof -i :8000

# Or change port in package.json start:prod script
```

**PM2 process won't start:**
```bash
# Check logs
pm2 logs handspace-ai

# Make sure you're in the project directory
cd /var/www/handspace-ai

# Make sure dependencies are installed
npm install

# Make sure dist folder exists (build first)
npm run build
```

**Files not updated:**
```bash
# Make sure build has been run
npm run build

# Restart PM2 after deployment
pm2 restart handspace-ai
```

## Notes

This application requires camera access to detect hand movements. Make sure to grant camera access when requested by the browser.
