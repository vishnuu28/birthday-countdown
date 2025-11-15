# 🚀 Quick Deployment Guide to GitHub Pages

## Step-by-Step Instructions

### Step 1: Create GitHub Repository

1. **Go to GitHub.com** and sign in to your account
2. Click the **"+"** button (top right) → Select **"New repository"**
3. **Repository name**: `birthday-countdown` (or any name you like)
4. **Description**: "A beautiful birthday countdown website"
5. **Visibility**: Select **Public** (required for free GitHub Pages)
6. **DO NOT** check "Add a README file" or any other options
7. Click **"Create repository"**

### Step 2: Copy Your Repository URL

After creating the repository, GitHub will show you a page with commands. 
**Copy the HTTPS URL** - it will look like:
```
https://github.com/YOUR_USERNAME/birthday-countdown.git
```

### Step 3: Run These Commands in PowerShell

Open PowerShell in this folder (`C:\Users\vishn\OneDrive\Desktop\birthday`) and run:

```powershell
# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Birthday countdown website"

# Add your GitHub repository (REPLACE YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/birthday-countdown.git

# Set main branch
git branch -M main

# Push to GitHub (you'll be asked for your GitHub username and password/token)
git push -u origin main
```

**Note**: When pushing, GitHub may ask for authentication:
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your password)
  - Go to GitHub → Settings → Developer settings → Personal access tokens → Generate new token
  - Give it `repo` permissions
  - Copy and use it as password

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click the **"Settings"** tab (top of the page)
3. Scroll down and click **"Pages"** in the left sidebar
4. Under **"Source"**, select:
   - Branch: **main**
   - Folder: **/ (root)**
5. Click **"Save"**
6. Wait 1-2 minutes for GitHub to build your site

### Step 5: Access Your Live Website! 🎉

Your website will be live at:
```
https://YOUR_USERNAME.github.io/birthday-countdown/
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## ✅ That's It!

Your countdown will work perfectly on GitHub Pages because it uses client-side JavaScript. 
The timer will update in real-time for anyone who visits your website!

## Updating Your Website

Whenever you make changes:

```powershell
git add .
git commit -m "Updated website"
git push
```

Changes will be live in 1-2 minutes!

---

**Need Help?** 
- Check GitHub's documentation: https://docs.github.com/en/pages
- Make sure your repository is **Public**
- Ensure `index.html` is in the root folder

