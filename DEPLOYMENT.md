# Cloud Deployment Guide for FarmPlotter

This guide covers multiple cloud deployment options for FarmPlotter, from easiest to most advanced.

---

## 🚀 Option 1: Render (Recommended - Free & Easy)

**Best for**: Quick deployment, automatic HTTPS, zero DevOps experience needed

### Steps:

1. **Push to GitHub** (if not already done):
   ```bash
   cd c:\Users\himyn\FarmWalk
   git init
   git add .
   git commit -m "Initial FarmPlotter deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/farmplotter.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - Sign up/Login with GitHub
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Configure:
     - **Name**: `farmplotter`
     - **Environment**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `gunicorn -c gunicorn_config.py app:app`
     - **Environment Variables**: 
       - `ENVIRONMENT` = `production`
   - Click **"Create Web Service"**

3. **Access Your App**:
   - Render provides: `https://farmplotter.onrender.com`
   - Automatic HTTPS ✅
   - GPS will work immediately! 📍

**Free Tier**: 750 hours/month, sleeps after 15 min inactivity

---

## 🌐 Option 2: Railway (Fast & Modern)

**Best for**: Modern deployment, great developer experience

### Steps:

1. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app)
   - Login with GitHub
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Select your FarmPlotter repository
   - Railway auto-detects Python and deploys!

2. **Set Environment Variable**:
   - In Railway dashboard → **Variables** tab
   - Add: `ENVIRONMENT` = `production`

3. **Generate Domain**:
   - Go to **Settings** → **Networking**
   - Click **"Generate Domain"**
   - Get: `https://farmplotter-production.up.railway.app`

**Free Tier**: $5 credit/month (enough for testing)

---

## ☁️ Option 3: Google Cloud Run (Scalable)

**Best for**: Production-ready, auto-scaling, pay-per-use

### Prerequisites:
- Google Cloud account
- `gcloud` CLI installed

### Steps:

1. **Create Dockerfile**:
   ```dockerfile
   FROM python:3.11-slim
   
   WORKDIR /app
   
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   
   COPY . .
   
   ENV ENVIRONMENT=production
   
   CMD exec gunicorn -c gunicorn_config.py app:app
   ```

2. **Deploy**:
   ```bash
   # Authenticate
   gcloud auth login
   
   # Set project
   gcloud config set project YOUR_PROJECT_ID
   
   # Deploy to Cloud Run
   gcloud run deploy farmplotter \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars ENVIRONMENT=production
   ```

3. **Access**:
   - Get URL: `https://farmplotter-xxxxx-uc.a.run.app`
   - Automatic HTTPS ✅
   - Auto-scales to zero when not in use

**Pricing**: Free tier includes 2 million requests/month

---

## 🐳 Option 4: Heroku (Classic Choice)

**Best for**: Traditional PaaS, simple deployment

### Steps:

1. **Create `Procfile`**:
   ```
   web: gunicorn -c gunicorn_config.py app:app
   ```

2. **Deploy**:
   ```bash
   # Install Heroku CLI
   # Then:
   heroku login
   heroku create farmplotter-app
   heroku config:set ENVIRONMENT=production
   git push heroku main
   ```

3. **Access**:
   - URL: `https://farmplotter-app.herokuapp.com`

**Note**: Heroku removed free tier in 2022. Starts at $5/month.

---

## 🔧 Option 5: DigitalOcean App Platform

**Best for**: Balance of simplicity and control

### Steps:

1. **Deploy via GitHub**:
   - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Click **"Create App"** → **GitHub**
   - Select repository
   - Configure:
     - **Type**: Web Service
     - **Build Command**: `pip install -r requirements.txt`
     - **Run Command**: `gunicorn -c gunicorn_config.py app:app`
     - **Environment Variables**: `ENVIRONMENT=production`

2. **Access**:
   - Get: `https://farmplotter-xxxxx.ondigitalocean.app`

**Pricing**: $5/month for basic tier

---

## 📱 Testing GPS on Deployed App

Once deployed with HTTPS:

1. **Open on Mobile Device**:
   - Visit your HTTPS URL on smartphone
   - Browser will prompt for location permission
   - Grant permission

2. **Test Recording**:
   - Tap play button
   - Walk around (even just 10 meters)
   - Verify green line appears
   - Tap finish
   - Download GeoJSON

3. **Verify Accuracy**:
   - Check coordinate precision (6 decimals)
   - Compare area calculation with known measurements

---

## 🎯 Quick Recommendation

**For immediate testing**: Use **Render** (Option 1)
- Free
- Automatic HTTPS
- Deploy in 5 minutes
- No credit card required

**For production**: Use **Google Cloud Run** (Option 3)
- Auto-scaling
- Pay only for actual usage
- Enterprise-grade reliability
- Global CDN

---

## 🔒 Security Checklist

Before deploying to production:

- ✅ HTTPS enforced (automatic on all platforms)
- ✅ CORS configured (already in `app.py`)
- ✅ No sensitive data stored (stateless design)
- ✅ Input validation (coordinate checks in backend)
- ⚠️ Consider adding rate limiting for public APIs
- ⚠️ Monitor usage and costs

---

## 🐛 Troubleshooting

### GPS Not Working
- Ensure HTTPS is enabled (check URL starts with `https://`)
- Check browser console for permission errors
- Try on different browser/device

### App Sleeps on Free Tier
- Render/Railway free tiers sleep after inactivity
- First request after sleep takes ~30 seconds
- Upgrade to paid tier for always-on

### Build Fails
- Check Python version (3.11+ recommended)
- Verify all dependencies in `requirements.txt`
- Check build logs for specific errors

---

## 📊 Cost Comparison

| Platform | Free Tier | Paid Tier | Best For |
|----------|-----------|-----------|----------|
| **Render** | 750 hrs/mo | $7/mo | Testing |
| **Railway** | $5 credit/mo | $5/mo | Development |
| **Cloud Run** | 2M requests/mo | Pay-per-use | Production |
| **Heroku** | None | $5/mo | Legacy apps |
| **DigitalOcean** | None | $5/mo | Predictable costs |

---

## 🎉 Next Steps

1. Choose a platform (Render recommended for testing)
2. Deploy following the steps above
3. Test GPS functionality on mobile device
4. Share HTTPS URL with farmers for field testing
5. Monitor usage and gather feedback

Good luck with your deployment! 🌾
