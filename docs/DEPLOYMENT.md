# Deployment Guide

This guide covers various deployment options for Katamari-JS, from simple static hosting to advanced CDN configurations.

## 🚀 Quick Deployment

### Static File Hosting

The simplest deployment method - just upload your files to any web server:

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload the `dist/` folder** to your web server

3. **Configure your server** to serve `index.html` for all routes

### GitHub Pages

Deploy directly from your GitHub repository:

1. **Enable GitHub Pages** in repository settings
2. **Select source**: GitHub Actions or branch
3. **Create workflow** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## 🌐 Platform-Specific Deployments

### Netlify

1. **Connect your repository** to Netlify
2. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Add environment variables** if needed
4. **Deploy automatically** on git push

**netlify.toml** configuration:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from command line**
   ```bash
   vercel --prod
   ```

**vercel.json** configuration:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### AWS S3 + CloudFront

1. **Create S3 bucket**
   ```bash
   aws s3 mb s3://your-katamari-bucket
   ```

2. **Configure bucket for static hosting**
   ```bash
   aws s3 website s3://your-katamari-bucket \
     --index-document index.html \
     --error-document index.html
   ```

3. **Upload files**
   ```bash
   npm run build
   aws s3 sync dist/ s3://your-katamari-bucket --delete
   ```

4. **Create CloudFront distribution**
   ```bash
   aws cloudfront create-distribution \
     --distribution-config file://cloudfront-config.json
   ```

**cloudfront-config.json**:
```json
{
  "CallerReference": "katamari-js-deployment",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-katamari-origin",
        "DomainName": "your-katamari-bucket.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-katamari-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true,
    "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
  },
  "Comment": "Katamari-JS Game Distribution",
  "Enabled": true
}
```

## 🔧 Build Optimization

### Production Build Configuration

Optimize your build for production deployment:

```javascript
// vite.config.js - Production optimizations
export default defineConfig(({ mode }) => ({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'debugLog']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['three', 'cannon-es', 'tone']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}));
```

### Bundle Analysis

Analyze your bundle size:

```bash
npm run build:analyze
```

This generates a visual report showing:
- Bundle composition
- Largest dependencies
- Optimization opportunities

### Performance Optimization

1. **Enable compression**
   ```bash
   # Gzip compression
   gzip -9 dist/*.js dist/*.css
   
   # Brotli compression (better)
   brotli -q 11 dist/*.js dist/*.css
   ```

2. **Optimize images** (if any)
   ```bash
   # Install optimization tools
   npm install -g imagemin-cli imagemin-webp
   
   # Optimize images
   imagemin assets/*.png --out-dir=dist/assets --plugin=webp
   ```

## 🌍 CDN Configuration

### Cloudflare

1. **Add your domain** to Cloudflare
2. **Enable optimizations**:
   - Auto Minify (JS, CSS, HTML)
   - Brotli compression
   - Rocket Loader (optional)
3. **Configure caching rules**:
   ```
   *.js, *.css: Cache Everything, Edge TTL 1 month
   *.html: Cache Everything, Edge TTL 1 hour
   ```

### jsDelivr (for open source projects)

If your project is open source, you can use jsDelivr:

```html
<!-- Load from jsDelivr CDN -->
<script type="module" src="https://cdn.jsdelivr.net/gh/yourusername/katamari-js@latest/dist/main.js"></script>
```

## 📱 Mobile Optimization

### Service Worker

Add offline support with a service worker:

```javascript
// sw.js
const CACHE_NAME = 'katamari-js-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/main.js',
  '/assets/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

Register in your main HTML:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### PWA Manifest

Make your game installable:

```json
{
  "name": "Katamari-JS",
  "short_name": "Katamari",
  "description": "3D physics-based rolling game",
  "start_url": "/",
  "display": "fullscreen",
  "background_color": "#000000",
  "theme_color": "#ff6b6b",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🔒 Security Configuration

### Content Security Policy

Add CSP headers for security:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self';
  media-src 'self' blob:;
  worker-src 'self' blob:;
">
```

### HTTPS Configuration

Always serve over HTTPS in production:

```nginx
# Nginx configuration
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        root /var/www/katamari-js;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 📊 Monitoring & Analytics

### Performance Monitoring

Add performance tracking:

```javascript
// Performance monitoring
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'navigation') {
      console.log('Page load time:', entry.loadEventEnd - entry.loadEventStart);
    }
  }
});
observer.observe({ entryTypes: ['navigation'] });
```

### Error Tracking

Implement error tracking:

```javascript
window.addEventListener('error', (event) => {
  // Send error to tracking service
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })
  });
});
```

## 🚀 Automated Deployment

### GitHub Actions CI/CD

Complete deployment pipeline:

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm run test
    
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm run build
    - uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/
        
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/download-artifact@v3
      with:
        name: dist
        path: dist/
    - name: Deploy to S3
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      run: |
        aws s3 sync dist/ s3://your-bucket --delete
        aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## 🔍 Troubleshooting

### Common Deployment Issues

1. **MIME Type Errors**
   ```nginx
   # Add to nginx config
   location ~* \.js$ {
       add_header Content-Type application/javascript;
   }
   ```

2. **CORS Issues**
   ```javascript
   // Add CORS headers
   app.use((req, res, next) => {
     res.header('Access-Control-Allow-Origin', '*');
     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
     next();
   });
   ```

3. **Mobile Performance**
   - Enable hardware acceleration
   - Reduce physics simulation quality on mobile
   - Implement adaptive quality settings

### Performance Checklist

- [ ] Gzip/Brotli compression enabled
- [ ] Static assets cached with long TTL
- [ ] CDN configured for global distribution
- [ ] Bundle size optimized (< 2MB total)
- [ ] Images optimized and properly sized
- [ ] Service worker implemented for offline support
- [ ] HTTPS enabled with proper certificates
- [ ] CSP headers configured for security

This deployment guide should help you get Katamari-JS running smoothly in production environments. Choose the deployment method that best fits your needs and infrastructure.