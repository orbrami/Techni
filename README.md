# 🏫 טכנולוגי ב"ש — Techni Be'er Sheva Social Network

> רשת חברתית פנימית לתלמידי הטכנולוגי באר שבע  
> **⚠️ אתר זה נוצר על ידי תלמידים ואינו משויך רשמית לטכני באר שבע**

---

## 📁 מבנה הפרויקט (Monorepo)

```
techni-social/
├── frontend/          # Next.js 14 + TypeScript + Tailwind
│   └── src/
│       ├── app/       # App Router pages
│       ├── components/ # UI components
│       ├── hooks/     # Custom hooks
│       ├── i18n/      # Hebrew + Russian translations
│       └── lib/       # API client, Zustand store
│
└── backend/           # Node.js + Express + TypeScript
    └── src/
        ├── routes/    # API routes
        ├── models/    # MongoDB models
        ├── middleware/ # Auth, error handling
        └── utils/     # Email, Socket.IO
```

---

## 🚀 פריסה — Deployment Guide

### שלב 1: MongoDB Atlas

1. לך ל-[mongodb.com/atlas](https://mongodb.com/atlas) → צור חשבון חינמי
2. צור **Cluster** חינמי (M0)
3. צור **Database User**: `Settings → Database Access → Add User`
4. Allow all IPs: `Network Access → Add IP → 0.0.0.0/0`
5. קבל connection string: `Connect → Connect your application`
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/techni-social
   ```

---

### שלב 2: Cloudinary (העלאת תמונות/וידאו)

1. לך ל-[cloudinary.com](https://cloudinary.com) → חשבון חינמי
2. Dashboard → Copy: `Cloud Name`, `API Key`, `API Secret`

---

### שלב 3: Gmail SMTP (שליחת מיילים)

1. חשבון Gmail → [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification → **App Passwords**
3. Create app password → תקבל 16 תווים → שמור!

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx   # 16-char App Password
```

---

### שלב 4: Backend → Render

1. דחף קוד ל-GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USER/techni-social
   git push -u origin main
   ```

2. לך ל-[render.com](https://render.com) → **New Web Service**
3. Connect GitHub repo
4. הגדרות:
   - **Name**: `techni-social-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Environment Variables** — הוסף את כולם:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=<your Atlas URI>
   JWT_SECRET=<random 64-char string>
   ADMIN_CODE=1324
   ADMIN_SECRET_TOKEN=<random 32-char string>
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=<your gmail>
   SMTP_PASS=<app password>
   CLOUDINARY_CLOUD_NAME=<your cloud name>
   CLOUDINARY_API_KEY=<your api key>
   CLOUDINARY_API_SECRET=<your api secret>
   FRONTEND_URL=https://techni-social.vercel.app
   ```

6. לאחר Deploy — קבל URL כגון: `https://techni-social-backend.onrender.com`

---

### שלב 5: Frontend → Vercel

1. לך ל-[vercel.com](https://vercel.com) → **New Project**
2. Import GitHub repo
3. הגדרות:
   - **Framework**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`

4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://techni-social-backend.onrender.com/api
   NEXT_PUBLIC_SOCKET_URL=https://techni-social-backend.onrender.com
   ```

5. Deploy! → קבל URL כגון: `https://techni-social.vercel.app`

6. 🔄 חזור ל-Render → עדכן `FRONTEND_URL` עם ה-URL של Vercel

---

## 💻 פיתוח מקומי (Local Development)

### דרישות
- Node.js 18+
- npm 9+

### התקנה

```bash
# Clone
git clone https://github.com/YOUR_USER/techni-social
cd techni-social

# Install all dependencies
npm run install:all

# Setup environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit both .env files with your credentials
```

### הרצה

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

פתח: [http://localhost:3000](http://localhost:3000)

---

## 🔐 מצב אדמין (Owner Mode)

### כיצד להיכנס:
1. לחץ **7 פעמים** על הפינה הימנית העליונה של המסך (אזור 64×64px)
2. בחלון שנפתח, הזן את הקוד: **`1324`**
3. תיכנס למצב מנהל מלא

### יכולות מנהל:
- 🗑️ מחיקת פוסטים
- 🚫 חסימת/ביטול חסימת משתמשים
- 📊 סטטיסטיקות רחבות
- 👥 ניהול כל המשתמשים

### אבטחה:
- המצב **לא נשמר** לאחר רענון — יש להזין קוד בכל פעם
- עובד מכל מכשיר ובכל חשבון
- הקוד מאומת מול השרת (לא client-side בלבד)

---

## ✨ פיצ'רים

| פיצ'ר | פירוט |
|-------|-------|
| 🔐 **הרשמה** | רק @edu-darom.org.il + אימות מייל אמיתי |
| 👤 **פרופיל** | שם (לא ניתן לשינוי), כיתה, תמונה, bio |
| 📝 **פוסטים** | טקסט + תמונה + וידאו |
| ❤️ **לייקים** | אנימציה, real-time counter |
| 💬 **תגובות** | nested, real-time |
| 🔄 **שיתוף** | share post עם תגובה |
| 📩 **הודעות** | צ'אט 1:1 real-time (Socket.IO) |
| 🔍 **חיפוש** | חיפוש תלמידים |
| 🌐 **שפות** | עברית + רוסית (i18n) |
| 🎓 **כיתות** | סינון פיד לפי כיתה/שכבה |
| 📱 **Mobile** | Responsive + Mobile navigation |
| 🛡️ **Admin** | Secret 7-tap mode |

---

## 🔑 Environment Variables — Reference

### Backend
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=           # Vercel URL
MONGODB_URI=            # Atlas connection string
JWT_SECRET=             # Random 64+ char string
ADMIN_CODE=1324         # The 4-digit secret code
ADMIN_SECRET_TOKEN=     # Random token for admin API calls
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=              # Gmail address
SMTP_PASS=              # Gmail App Password
CLOUDINARY_CLOUD_NAME=  # Cloudinary cloud name
CLOUDINARY_API_KEY=     # Cloudinary API key
CLOUDINARY_API_SECRET=  # Cloudinary API secret
```

### Frontend
```env
NEXT_PUBLIC_API_URL=    # Backend URL + /api
NEXT_PUBLIC_SOCKET_URL= # Backend URL (without /api)
```

---

## 🛡️ אבטחה

- JWT tokens (30-day expiry)
- Password hashing (bcrypt, 12 rounds)
- Email domain validation + MX record check
- Rate limiting (100 req/15min, 10 auth/hour)
- Helmet.js security headers
- CORS whitelist
- Input validation (express-validator + Zod)
- Admin mode requires server-side token validation

---

## 📊 מבנה MongoDB

| Collection | תיאור |
|------------|-------|
| `users` | תלמידים, כיתות, grade changes |
| `posts` | פוסטים, לייקים, תגובות, שיתופים |
| `messages` | הודעות פרטיות |
| `conversations` | שיחות בין משתמשים |

---

## 🆘 פתרון בעיות נפוצות

**Backend לא עולה?**
```bash
# בדוק שה-MONGODB_URI נכון
# בדוק ש-Network Access ב-Atlas מאפשר 0.0.0.0/0
```

**מיילים לא נשלחים?**
```bash
# ודא שהפעלת 2FA ב-Gmail
# ודא שיצרת App Password (לא הסיסמה הרגילה)
```

**Socket.IO לא מתחבר?**
```bash
# ודא NEXT_PUBLIC_SOCKET_URL ללא /api בסוף
# ודא CORS_ORIGIN בשרת תואם ל-FRONTEND_URL
```

---

*נבנה על ידי תלמידים 💙 | Not affiliated with Techni Be'er Sheva*
