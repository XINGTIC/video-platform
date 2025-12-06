# Video Platform Project

## 1. Project Overview
This is a complete video platform solution featuring:
- **Membership System**: Non-members are limited to 1 video per day. Members have unlimited access.
- **USDT Payment**: Mock integration for upgrading to membership.
- **Video Upload**: Self-service upload for registered users.
- **Auto Sync**: Tool to scrape and import videos from an external URL.

## 2. Directory Structure
- `frontend/`: Next.js application (Deployable to Cloudflare Pages).
- `backend/`: Node.js Express application (Deployable to VPS/Render/Railway).

## 3. Setup & Installation

### Prerequisites
- Node.js installed.
- MongoDB instance (local or Atlas).

### Backend Setup
1. Navigate to `backend` folder.
2. Install dependencies: `npm install`
3. Create a `.env` file in `backend/` with:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/videoplatform
   JWT_SECRET=your_super_secret_key
   ```
4. Run server: `npm run dev`

### Frontend Setup
1. Navigate to `frontend` folder.
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Open `http://localhost:3000`.

## 4. Deployment Guide

### Frontend (Cloudflare Pages)
1. Push this code to a GitHub repository.
2. Log in to Cloudflare Dashboard -> Pages.
3. "Create a project" -> "Connect to Git".
4. Select the repository.
5. Build Settings:
   - Framework preset: **Next.js**
   - Build command: `npm run build`
   - Output directory: `.next`
6. **Important**: You need to update `API_URL` in frontend files to point to your production backend URL instead of `localhost`.

### Backend (推荐免费方案: Render + MongoDB Atlas)

#### 1. 准备数据库 (MongoDB Atlas)
1. 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) (免费)。
2. 创建一个免费集群 (Shared, M0 Sandbox)。
3. 在 "Database Access" 中创建一个数据库用户 (记住用户名和密码)。
4. 在 "Network Access" 中添加 `0.0.0.0/0` (允许所有 IP 连接)。
5. 点击 "Connect" -> "Connect your application"，复制连接字符串 (类似 `mongodb+srv://<user>:<password>@...`)。

#### 2. 部署后端 (Render)
1. 注册 [Render](https://render.com/)。
2. 点击 "New +" -> "Web Service"。
3. 连接你的 GitHub 仓库。
4. Render 会自动检测到 `backend` 目录 (如果没有，Root Directory 填 `backend`)。
5. **Environment Variables** (环境变量设置):
   - `MONGO_URI`: 填入上面复制的 MongoDB 连接字符串 (记得替换 `<password>`)。
   - `JWT_SECRET`: 随便填一个复杂的字符串。
6. 点击 "Create Web Service"。
7. 等待部署完成，复制分配的 URL (例如 `https://xxx.onrender.com`)。

### Frontend (Cloudflare Pages)
1. Push this code to a GitHub repository.
2. Log in to Cloudflare Dashboard -> Pages.
3. "Create a project" -> "Connect to Git".
4. Select the repository.
5. Build Settings:
   - Framework preset: **Next.js**
   - Build command: `npm run build`
   - Output directory: `.next`
6. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: 填入你的 Render 后端 URL (不要带末尾的 `/`)。


### Video Sync (Auto Update)
1. Go to the Upload page (`/upload`).
2. Click "Sync from my Site".
3. Enter the URL of your existing website.
4. The backend will scrape video tags (title, img, link) and add them to the database.
   *Note: You may need to adjust the cheerio selectors in `backend/routes/sync.js` to match your specific website's HTML structure.*

### Membership & Payment
1. When a user hits the daily limit, they are prompted to pay.
2. The current implementation asks for a Transaction Hash.
3. If the hash starts with `0x`, it simulates a success. In production, integrate a real blockchain listener or payment gateway API.
