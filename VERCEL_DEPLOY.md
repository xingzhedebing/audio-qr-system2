# 🚀 Vercel 部署完整指南

本指南将详细介绍如何将音频转二维码系统部署到Vercel，实现全球访问。

## 📋 准备工作

### 1. 需要的账号
- [x] GitHub账号 (免费)
- [x] Vercel账号 (免费，用GitHub登录)
- [x] 腾讯云COS配置信息

### 2. 需要的软件
- Git (如果本地没有，可直接在GitHub网页操作)

## 🔧 第一步：上传代码到GitHub

### 方法1：使用Git命令行（推荐）

#### 1.1 初始化Git仓库
```bash
# 在项目目录下执行
cd E:\Project\Audio_QR
git init
```

#### 1.2 添加文件到Git
```bash
git add .
git commit -m "🎵 音频转二维码系统初始版本"
```

#### 1.3 创建GitHub仓库
1. 访问 [github.com](https://github.com)
2. 点击右上角的 "+" → "New repository"
3. 仓库名称填写：`audio-qr-system`
4. 选择 "Public" (公开)
5. 不要勾选 "Add a README file"
6. 点击 "Create repository"

#### 1.4 推送代码到GitHub
```bash
# 添加远程仓库（替换成你的GitHub用户名）
git remote add origin https://github.com/你的用户名/audio-qr-system.git

# 推送代码
git branch -M main
git push -u origin main
```

### 方法2：直接上传文件（简单方式）

如果不熟悉Git，可以直接上传：

1. 在GitHub创建新仓库（步骤同上）
2. 点击 "uploading an existing file"
3. 将项目文件夹中的所有文件拖拽到页面上
4. 填写提交信息：`音频转二维码系统`
5. 点击 "Commit changes"

## 🌐 第二步：部署到Vercel

### 2.1 注册/登录Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Sign up" 注册（如果没有账号）
3. 选择 "Continue with GitHub" 用GitHub账号登录
4. 授权Vercel访问你的GitHub

### 2.2 导入项目
1. 登录后，点击 "Add New..." → "Project"
2. 在 "Import Git Repository" 中找到你的 `audio-qr-system` 仓库
3. 点击 "Import"

### 2.3 配置项目设置
在配置页面：

**Project Name**: 保持默认或修改为 `audio-qr-system`

**Framework Preset**: 选择 `Other` 或保持默认

**Root Directory**: 保持默认 `./`

**Build and Output Settings**: 保持默认

### 2.4 设置环境变量（重要！）
在 "Environment Variables" 部分添加以下变量：

| Name | Value |
|------|-------|
| `COS_SECRET_ID` | 你的腾讯云SecretId |
| `COS_SECRET_KEY` | 你的腾讯云SecretKey |
| `COS_BUCKET` | 你的存储桶名称 |
| `COS_REGION` | 你的存储桶地域 |
| `NODE_ENV` | `production` |

**重要提示**：环境变量值不要包含引号，直接填入原始值。

### 2.5 部署项目
1. 确认所有设置正确
2. 点击 "Deploy" 开始部署
3. 等待2-3分钟完成部署

## ✅ 第三步：验证部署

### 3.1 获取域名
部署成功后，你会得到一个类似的域名：
```
https://audio-qr-system-你的用户名.vercel.app
```

### 3.2 测试功能
1. **访问主页**：打开你的Vercel域名
2. **测试上传**：上传一个音频文件
3. **检查二维码**：确认二维码生成成功
4. **手机测试**：用手机扫描二维码测试播放

### 3.3 验证环境变量
在部署后的控制台查看是否有COS配置错误信息。

## 🛠️ 第四步：自定义域名（可选）

### 4.1 在Vercel添加自定义域名
1. 进入项目的 "Domains" 设置
2. 添加你的域名
3. 按照提示配置DNS记录

### 4.2 配置DNS
在你的域名服务商添加CNAME记录：
```
Type: CNAME
Name: @（或www）
Value: cname.vercel-dns.com
```

## 🔄 第五步：后续更新

### 5.1 代码更新
当你修改代码后，只需推送到GitHub：
```bash
git add .
git commit -m "更新描述"
git push
```

Vercel会自动检测到更改并重新部署。

### 5.2 环境变量更新
在Vercel项目设置中的 "Environment Variables" 部分可以随时修改。

## 🎯 部署完成检查清单

- [ ] GitHub仓库创建成功
- [ ] 代码上传到GitHub
- [ ] Vercel项目导入成功
- [ ] 环境变量配置正确
- [ ] 部署成功，获得域名
- [ ] 主页可以正常访问
- [ ] 音频上传功能正常
- [ ] 二维码生成功能正常
- [ ] 手机扫码播放正常

## 🆘 常见问题解决

### Q1: 部署失败，显示 "Build Error"
**解决方案**：
1. 检查 `package.json` 中的依赖是否正确
2. 确保 `vercel.json` 配置文件存在
3. 查看构建日志，找到具体错误信息

### Q2: 环境变量不生效
**解决方案**：
1. 确认环境变量名称完全正确
2. 重新部署项目（Vercel项目页面点击 "Redeploy"）
3. 检查值中是否有特殊字符需要转义

### Q3: COS上传失败
**解决方案**：
1. 验证腾讯云COS密钥是否正确
2. 确认存储桶名称和地域设置
3. 检查存储桶权限设置

### Q4: 二维码链接错误
**解决方案**：
1. 检查生成的二维码链接是否使用正确的域名
2. 确认Vercel域名访问正常
3. 重新上传音频生成新的二维码

## 🌟 部署成功后的优势

✅ **全球访问**：世界任何地方都能访问你的系统
✅ **自动HTTPS**：安全的SSL加密连接
✅ **CDN加速**：全球多个节点，访问速度快
✅ **自动部署**：代码更新后自动重新部署
✅ **零维护**：无需服务器维护
✅ **完全免费**：Vercel免费套餐足够使用

## 📞 获取帮助

如果在部署过程中遇到问题：
1. 查看 [Vercel官方文档](https://vercel.com/docs)
2. 检查本项目的GitHub Issues
3. 查看Vercel项目的部署日志

---

🎉 **恭喜！部署完成后，你的音频转二维码系统就可以在全世界访问了！** 