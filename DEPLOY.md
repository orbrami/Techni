# 🚀 הוראות פריסה — צעד אחר צעד

---

## צעד 1 — דחוף ל-GitHub

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## צעד 2 — פרוס Backend ב-Render

1. לך ל: https://render.com → **New** → **Web Service**
2. חבר את ה-GitHub repo שלך
3. מלא כך:
   - **Name**: `techni-backend`
   - **Root Directory**: `backend`   ← חשוב!
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. לחץ **Advanced** → **Add Environment Variables** — הוסף אחד אחד:

```
NODE_ENV              = production
PORT                  = 5000
MONGODB_URI           = mongodb+srv://user:1234@techni.jz092wg.mongodb.net/techni-social?retryWrites=true&w=majority&appName=Techni
JWT_SECRET            = techni-beer-sheva-super-secret-jwt-key-2024-change-me-64chars-min
ADMIN_CODE            = 1324
ADMIN_SECRET_TOKEN    = techni-admin-secret-token-2024-change-this-now
SMTP_HOST             = smtp.gmail.com
SMTP_PORT             = 587
SMTP_SECURE           = false
SMTP_USER             = your-email@gmail.com
SMTP_PASS             = your-16-char-app-password
CLOUDINARY_CLOUD_NAME = dmhkzdevt
CLOUDINARY_API_KEY    = 334642945362434
CLOUDINARY_API_SECRET = 17-hbIBVQHJF-UmjZ14BSuHT6Ss
FRONTEND_URL          = https://your-app.vercel.app   ← תעדכן אחרי Vercel
```

5. לחץ **Create Web Service** — חכה ~5 דקות
6. שמור את ה-URL שלך, למשל: `https://techni-backend.onrender.com`

---

## צעד 3 — פרוס Frontend ב-Vercel

1. לך ל: https://vercel.com → **New Project**
2. Import GitHub repo
3. **Framework Preset**: Next.js
4. **Root Directory**: לחץ **Edit** → הכנס `frontend`   ← חשוב!
5. **Build Command**: השאר ריק (אוטומטי)
6. לחץ **Environment Variables** → הוסף:

```
NEXT_PUBLIC_API_URL    = https://techni-backend.onrender.com/api
NEXT_PUBLIC_SOCKET_URL = https://techni-backend.onrender.com
```

7. לחץ **Deploy** — חכה ~2 דקות
8. שמור את ה-URL שלך, למשל: `https://techni-social.vercel.app`

---

## צעד 4 — עדכן FRONTEND_URL ב-Render

1. לך ל-Render → השירות שלך → **Environment**
2. מצא `FRONTEND_URL` → שנה ל-URL של Vercel שלך
3. לחץ **Save Changes** → Render יעשה redeploy אוטומטי

---

## ✅ סיום!

האתר יעבוד ב: `https://YOUR-APP.vercel.app`

---

## 🔐 כניסת מנהל

לחץ **7 פעמים** על הפינה הימנית העליונה → הזן **1324**

