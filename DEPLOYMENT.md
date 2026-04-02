# 🚀 ZenithFlow Deployment Guide

## 📋 Prerequisites
- Railway account (recommended) or Heroku/Vercel
- GitHub repository
- MySQL database (Railway provides built-in)

## 🛠️ Deployment Options

### Option 1: Railway (Recommended) 🎯

#### Step 1: Prepare Your Repository
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Deploy Backend on Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will automatically detect the Node.js project
5. Set environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://your-app-name.railway.app
   DATABASE_URL=mysql://user:password@host:3306/database_name
   ```

#### Step 3: Configure Database
1. In Railway, add a MySQL service
2. Once created, go to your MySQL service settings
3. Copy the DATABASE_URL from the MySQL service
4. Paste it into your backend service environment variables

#### Step 4: Deploy Frontend (Separate or Combined)
**Option A: Combined Deployment (Current Setup)**
- The backend serves the frontend in production
- Single deployment URL serves both frontend and backend

**Option B: Separate Frontend Deployment**
1. Create new Railway project for frontend
2. Set build command: `cd frontend && npm run build`
3. Set start command: `cd frontend && npm run preview`

### Option 2: Vercel (Frontend) + Railway (Backend) 🎨

#### Frontend on Vercel
```bash
# In frontend directory
npm run build
```

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `frontend`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```

#### Backend on Railway
Follow Option 1 steps for backend deployment

### Option 3: Heroku (Full Stack) 🌿

#### Prepare for Heroku
```bash
# Create Procfile
echo "web: cd backend && npm start" > Procfile

# Update package.json scripts
```

#### Deploy
```bash
# Install Heroku CLI
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secret-jwt-key
heroku config:set DATABASE_URL=your-mysql-url
git push heroku main
```

## 🔧 Environment Variables

### Required Environment Variables
```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-domain.com
DATABASE_URL=mysql://user:password@host:3306/database_name
```

### Security Notes
- **JWT_SECRET**: Use a strong, random string (min 32 characters)
- **DATABASE_URL**: Keep this secure and private
- **FRONTEND_URL**: Set to your deployed frontend URL

## 🌐 Post-Deployment Checklist

### ✅ Verify Deployment
1. Backend health check: `https://your-app.railway.app/`
2. Frontend loads: `https://your-app.railway.app/`
3. API endpoints work: Test registration/login
4. Real-time messaging: Test with two users

### 🔒 Security Configuration
- CORS is configured for your frontend URL
- Rate limiting is enabled (10,000 requests per 15 minutes)
- Helmet.js provides security headers
- Socket.IO CORS is properly configured

### 📊 Monitoring
- Railway provides built-in logs and metrics
- Check for any runtime errors
- Monitor database connections
- Verify Socket.IO connections

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```
Error: connect ECONNREFUSED
```
**Solution**: Verify DATABASE_URL is correct and MySQL service is running

#### 2. CORS Errors
```
Access to fetch at '...' blocked by CORS policy
```
**Solution**: Ensure FRONTEND_URL matches your deployed frontend URL

#### 3. Socket.IO Connection Issues
```
WebSocket connection failed
```
**Solution**: Check that both frontend and backend use HTTPS in production

#### 4. Build Failures
```
Error: Module not found
```
**Solution**: Ensure all dependencies are installed and package.json is correct

## 🚀 Performance Optimization

### Frontend
- Gzip compression enabled by Vite
- Code splitting implemented
- Static assets optimized

### Backend
- Connection pooling configured (150 connections)
- Rate limiting prevents abuse
- Efficient Socket.IO room management

## 📱 Mobile Compatibility

The application is fully responsive and works on:
- Desktop browsers
- Mobile browsers
- Tablets

## 🔄 Continuous Deployment

Set up automatic deployments:
1. Railway: Automatically deploys on git push
2. Vercel: Automatically deploys on git push
3. Heroku: Set up GitHub integration

## 📞 Support

If you encounter issues:
1. Check Railway/Vercel logs
2. Verify environment variables
3. Test locally with production settings
4. Check this troubleshooting guide

---

**🎉 Your ZenithFlow chat application is now ready for production!**
