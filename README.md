# 💖 Birthday Countdown Website 💖

A beautiful, romantic birthday countdown website with 15 days of special messages and images.

## Features

- ⏰ Live countdown timer to November 30, 2025
- 💕 15 day cards with 30 wonderful words
- 🖼️ Beautiful images for each word
- ❤️ Flying hearts animations
- 📱 Fully responsive design
- 🎨 Modal popups with detailed descriptions

## Deployment to GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Name your repository (e.g., `birthday-countdown`)
4. Make it **Public** (required for free GitHub Pages)
5. **Don't** initialize with README, .gitignore, or license
6. Click **"Create repository"**

### Step 2: Initialize Git and Push to GitHub

Open PowerShell/Terminal in this folder and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Birthday countdown website"

# Add your GitHub repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/birthday-countdown.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **"Settings"** tab
3. Scroll down to **"Pages"** in the left sidebar
4. Under **"Source"**, select **"main"** branch
5. Click **"Save"**
6. Wait 1-2 minutes for GitHub to deploy

### Step 4: Access Your Live Website

Your website will be available at:
```
https://YOUR_USERNAME.github.io/birthday-countdown/
```

## Updating Your Website

After making changes:

```bash
git add .
git commit -m "Update website"
git push
```

Changes will be live in 1-2 minutes!

## Files Structure

```
birthday/
├── index.html          # Main HTML file
├── style.css           # All styling
├── images/             # All images folder
└── README.md           # This file
```

## Notes

- The countdown works automatically using JavaScript
- All images are included in the `images` folder
- The website is fully client-side (no server needed)
- Works perfectly on GitHub Pages!

---

Made with ❤️ for someone special

