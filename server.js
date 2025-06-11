require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

// 基本中间件
app.use(express.json());
app.use(express.static('public'));

// 测试路由
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>音频转二维码系统</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 50px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                margin: 0;
            }
            .container {
                background: rgba(255,255,255,0.1);
                padding: 30px;
                border-radius: 20px;
                backdrop-filter: blur(10px);
                max-width: 600px;
                margin: 0 auto;
            }
            h1 { font-size: 2.5em; margin-bottom: 20px; }
            .status { font-size: 1.2em; margin: 10px 0; }
            .success { color: #4CAF50; }
            .error { color: #f44336; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎵 音频转二维码系统</h1>
            <div class="status success">✅ 服务器运行正常</div>
            <div class="status">📡 Vercel部署成功</div>
            <div class="status">🔧 正在调试中...</div>
            
            <h3>环境变量检查：</h3>
            <div class="status ${process.env.TENCENT_SECRET_ID ? 'success' : 'error'}">
                TENCENT_SECRET_ID: ${process.env.TENCENT_SECRET_ID ? '✅ 已配置' : '❌ 未配置'}
            </div>
            <div class="status ${process.env.TENCENT_SECRET_KEY ? 'success' : 'error'}">
                TENCENT_SECRET_KEY: ${process.env.TENCENT_SECRET_KEY ? '✅ 已配置' : '❌ 未配置'}
            </div>
            <div class="status ${process.env.COS_REGION ? 'success' : 'error'}">
                COS_REGION: ${process.env.COS_REGION || '❌ 未配置'}
            </div>
            <div class="status ${process.env.COS_BUCKET ? 'success' : 'error'}">
                COS_BUCKET: ${process.env.COS_BUCKET || '❌ 未配置'}
            </div>
            
            <div style="margin-top: 30px;">
                <p>如果所有环境变量都显示"已配置"，说明基础设置正确。</p>
                <p>接下来会逐步恢复完整功能。</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// API测试路由
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API正常工作',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasSecretId: !!process.env.TENCENT_SECRET_ID,
      hasSecretKey: !!process.env.TENCENT_SECRET_KEY,
      region: process.env.COS_REGION,
      bucket: process.env.COS_BUCKET
    }
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: '页面不存在',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
}

module.exports = app; 