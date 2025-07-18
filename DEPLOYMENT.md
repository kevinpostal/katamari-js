# GitHub Pages Deployment Guide

## Recommended: Deploy from /dist folder

The easiest way to deploy your Katamari-JS game to GitHub Pages:

### Step 1: Build your project
```bash
npm run build
```

### Step 2: Commit and push your dist folder
```bash
git add dist/
git commit -m "Update build for deployment"
git push origin main
```

### Step 3: Configure GitHub Pages
1. Go to your repository on GitHub: https://github.com/kevinpostal/katamari-js
2. Click **Settings** → **Pages**
3. Under "Source", select **"Deploy from a branch"**
4. Choose **"main"** branch and **"/ (root)"** folder
5. Click **Save**

### Step 4: Access your site
Your site will be available at: **https://kevinpostal.github.io/katamari-js/**

## Alternative: Deploy from /dist subfolder

If you prefer to deploy only the dist folder contents:

1. Follow steps 1-2 above
2. In GitHub Pages settings, choose **"main"** branch and **"/dist"** folder
3. Click **Save**

## Build Commands

- **Development build**: `npm run build:dev`
- **Production build**: `npm run build`
- **Build and preview**: `npm run preview:build`
- **Clean build**: `npm run build:clean`

## Troubleshooting

- **404 Error**: Make sure GitHub Pages is enabled and pointing to the right branch/folder
- **Build Fails**: Run `npm install` and try `npm run build` again
- **Old version showing**: GitHub Pages can take 5-10 minutes to update
- **Assets not loading**: Make sure your `dist` folder is committed and pushed

## Manual Deployment Process

If you want to deploy manually each time:

1. `npm run build` - Build the project
2. `git add dist/` - Stage the dist folder
3. `git commit -m "Deploy update"` - Commit changes
4. `git push origin main` - Push to GitHub
5. Wait 5-10 minutes for GitHub Pages to update

Your game will be live at: https://kevinpostal.github.io/katamari-js/