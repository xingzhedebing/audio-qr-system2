@echo off
chcp 65001 >nul
echo 🚀 音频转二维码系统 - Vercel部署助手
echo.

echo 📋 部署前检查...
if not exist "package.json" (
    echo ❌ 错误：找不到package.json文件
    echo 请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

echo ✅ 项目文件检查通过
echo.

echo 🔧 初始化Git仓库...
git init
if %errorlevel% neq 0 (
    echo ❌ Git初始化失败，请确保已安装Git
    echo 下载地址：https://git-scm.com/download/win
    pause
    exit /b 1
)

echo 📦 添加文件到Git...
git add .
git commit -m "🎵 音频转二维码系统 - 初始提交"

echo.
echo 📚 接下来需要手动操作：
echo.
echo 1️⃣ 创建GitHub仓库：
echo    访问：https://github.com/new
echo    仓库名：audio-qr-system
echo    设置为Public（公开）
echo.
echo 2️⃣ 获取仓库地址后，运行以下命令：
echo    git remote add origin https://github.com/你的用户名/audio-qr-system.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3️⃣ 部署到Vercel：
echo    访问：https://vercel.com
echo    用GitHub账号登录
echo    导入你的audio-qr-system仓库
echo.
echo 4️⃣ 设置环境变量：
echo    COS_SECRET_ID=你的腾讯云SecretId
echo    COS_SECRET_KEY=你的腾讯云SecretKey
echo    COS_BUCKET=你的存储桶名称
echo    COS_REGION=你的存储桶地域
echo.
echo 🎉 部署完成后，你将获得一个永久可访问的域名！
echo.
pause 