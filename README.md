# 🎵 音频转二维码系统

一个现代化的音频分享系统，上传音频文件自动生成永久有效的二维码，扫码即可播放。

## ✨ 功能特点

- 🎵 **音频上传**：支持MP3、WAV、OGG等格式
- 📱 **二维码生成**：自动生成永久有效的播放二维码
- ☁️ **云端存储**：集成腾讯云COS，文件永久保存
- 🎧 **在线播放**：手机扫码直接播放，支持微信内置浏览器
- 📊 **播放统计**：记录每个音频的播放次数
- 🎨 **现代UI**：响应式设计，完美适配手机和电脑

## 🚀 快速部署

### 方案1：Vercel 部署（推荐）

1. **Fork 此项目到你的 GitHub**
2. **登录 [Vercel](https://vercel.com)**
3. **导入项目**：选择你的 GitHub 仓库
4. **设置环境变量**：
   ```
   COS_SECRET_ID=你的腾讯云SecretId
   COS_SECRET_KEY=你的腾讯云SecretKey
   COS_BUCKET=你的存储桶名称
   COS_REGION=你的存储桶地域
   ```
5. **点击部署**：几分钟后获得永久域名

### 方案2：Railway 部署

1. **登录 [Railway](https://railway.app)**
2. **连接 GitHub 仓库**
3. **设置环境变量**（同上）
4. **自动部署完成**

### 方案3：Render 部署

1. **登录 [Render](https://render.com)**
2. **选择 Web Service**
3. **连接 GitHub 仓库**
4. **设置环境变量**（同上）
5. **部署完成**

### 方案4：Docker 部署

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/audio-qr-system.git
cd audio-qr-system

# 2. 构建镜像
docker build -t audio-qr-system .

# 3. 运行容器
docker run -p 8080:8080 \
  -e COS_SECRET_ID=你的SecretId \
  -e COS_SECRET_KEY=你的SecretKey \
  -e COS_BUCKET=你的存储桶 \
  -e COS_REGION=你的地域 \
  audio-qr-system
```

## 🛠️ 本地开发

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/audio-qr-system.git
   cd audio-qr-system
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp env.example .env
   # 编辑 .env 文件，填入你的腾讯云COS配置
   ```

4. **启动服务**
   ```bash
   npm start
   ```

5. **访问应用**
   - 电脑：http://localhost:8080
   - 手机：http://你的IP:8080

## ⚙️ 环境变量配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `COS_SECRET_ID` | 腾讯云SecretId | `AKIDxxx...` |
| `COS_SECRET_KEY` | 腾讯云SecretKey | `xxx...` |
| `COS_BUCKET` | 存储桶名称 | `audio-qr-1234567890` |
| `COS_REGION` | 存储桶地域 | `ap-chengdu` |
| `PORT` | 服务端口 | `8080` |
| `NODE_ENV` | 运行环境 | `production` |

## 📱 使用方法

1. **访问网站**：打开部署后的域名
2. **上传音频**：拖拽或选择音频文件上传
3. **获取二维码**：上传完成后自动生成二维码
4. **分享播放**：将二维码分享给朋友，扫码即可播放

## 🔧 技术栈

- **后端**：Node.js + Express
- **前端**：原生HTML/CSS/JavaScript
- **存储**：腾讯云COS
- **数据库**：LowDB (JSON文件)
- **二维码**：QRCode.js

## 📂 项目结构

```
audio-qr-system/
├── server.js              # 主服务器文件
├── package.json           # 项目配置
├── config/
│   └── cos.js             # 腾讯云COS配置
├── public/
│   ├── index.html         # 前端主页
│   └── test.html          # 测试页面
├── uploads/               # 临时上传目录
├── audio_qr.json          # 数据库文件
├── vercel.json            # Vercel部署配置
├── railway.json           # Railway部署配置
├── render.yaml            # Render部署配置
└── Dockerfile             # Docker配置
```

## 🌟 部署优势对比

| 平台 | 免费额度 | 域名 | HTTPS | 优势 |
|------|----------|------|-------|------|
| **Vercel** | 无限制 | 自定义 | ✅ | 全球CDN，最快 |
| **Railway** | 500h/月 | 自动分配 | ✅ | 简单易用 |
| **Render** | 750h/月 | 自定义 | ✅ | 功能丰富 |
| **本地部署** | 无限制 | IP地址 | ❌ | 需要电脑常开 |

## 🎯 推荐方案

**新手推荐**：Vercel（最简单，完全免费）
**进阶推荐**：Railway（功能丰富，易于管理）
**企业推荐**：Docker + 云服务器（完全控制）

## 🔒 安全说明

- 所有文件存储在腾讯云COS，安全可靠
- 支持HTTPS加密传输
- 无用户系统，无隐私泄露风险
- 二维码永久有效，适合长期分享

## 📞 技术支持

如有问题，请提交 Issue 或联系开发者。

---

⭐ 如果这个项目对你有帮助，请给个 Star！ 