# Deployment Configuration Guide

## For Different Hosting Platforms

### 1. **Render (Static Site)**
Create `render.yaml` in project root:
```yaml
services:
  - type: web
    name: laksh-solanki-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
    envVars:
      - key: VITE_BASE_URL
        value: /
```

Or configure in Render dashboard:
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/dist`
- **Environment Variable**: `VITE_BASE_URL=/`

### 2. **GitHub Pages**
Create `.env.production`:
```
VITE_BASE_URL=/LakshSolanki/
```

### 3. **Firebase Hosting**
Create `.env.production`:
```
VITE_BASE_URL=/
```

### 4. **Custom Server/Subdirectory**
If deploying to `https://example.com/myapp/`:
```env
VITE_BASE_URL=/myapp/
```

## Important Notes

1. **Always test locally** with the same `VITE_BASE_URL` as your deployment
2. **Clear browser cache** after deployment
3. **Check browser console** for 404 errors on assets
4. **Verify API endpoints** work with the new base URL

## Render-Specific Setup

### Static Site Configuration
1. **Service Type**: Choose "Static Site"
2. **Build Command**: `cd frontend && npm install && npm run build`
3. **Publish Directory**: `frontend/dist`
4. **Environment Variables**:
   - `VITE_BASE_URL=/` (for root domain)
   - Add your API keys and other environment variables

### Important Notes for Render
- Render serves static sites from the root path by default
- If you have a custom domain, ensure `VITE_BASE_URL` is set to `/`
- Render automatically handles the build process
- Your site will be available at `https://your-app-name.onrender.com`

## Testing Deployment Locally

```bash
# Set the base URL for Render (usually root)
echo "VITE_BASE_URL=/" > .env.production

# Build for production
npm run build

# Serve locally to test
npx serve dist -s -l 3000
```

## Common Issues & Solutions

### Build Failures on Render
- Ensure your `package.json` has the correct build script: `"build": "vite build"`
- Check that all dependencies are listed in `package.json`
- Verify your Node.js version in Render settings (recommend Node 18+)

### Vuetify Components Not Working
- Ensure `vuetify/styles` is imported
- Check that Vuetify plugin is registered correctly
- Verify theme configuration

### Tailwind Classes Not Applied
- Check content paths in `tailwind.config.js`
- Ensure CSS is imported in `main.js`
- Verify build includes Tailwind styles

### Routing Issues
- Confirm `VITE_BASE_URL` is set to `/` for Render
- Check router history mode configuration
- Test navigation after deployment

### Environment Variables Not Working
- Ensure all `VITE_` prefixed variables are set in Render dashboard
- Restart deployment after adding new environment variables
- Check variable names match exactly (case-sensitive)