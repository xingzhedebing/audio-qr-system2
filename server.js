require('dotenv').config();
const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { uploadFile, deleteFile, checkCOSConfig } = require('./config/cos');

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 中间件 - 添加移动端和微信兼容性
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// 添加移动端和微信兼容性头信息
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  
  // 微信浏览器兼容性
  if (req.get('User-Agent') && req.get('User-Agent').includes('MicroMessenger')) {
    res.header('X-Frame-Options', 'ALLOWALL');
    console.log('微信浏览器访问:', req.url);
  }
  
  next();
});

app.use(express.json());
app.use(express.static('public'));

// Vercel环境下不需要创建本地目录
if (NODE_ENV !== 'production') {
  fs.ensureDirSync('uploads');
  fs.ensureDirSync('public');
}

// 初始化数据库 - Vercel环境使用内存存储
let audioData = { audios: [] };

// 配置文件上传 - Vercel环境使用内存存储
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // 检查文件类型
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传音频文件！'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB限制
  }
});

// 修复中文文件名编码问题
function fixChineseFilename(filename) {
  try {
    // 检查是否包含乱码字符
    if (filename.includes('æ') || filename.includes('ç') || filename.includes('¤') || filename.includes('å')) {
      // 尝试从latin1转换为utf8
      const fixed = Buffer.from(filename, 'latin1').toString('utf8');
      console.log(`文件名编码修复: "${filename}" -> "${fixed}"`);
      return fixed;
    }
    return filename;
  } catch (error) {
    console.log('文件名编码转换失败:', error);
    return filename;
  }
}

// 路由：上传音频并生成二维码
app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择音频文件' });
    }

    const audioId = uuidv4();
    const correctHost = getCorrectHost(req);
    const playUrl = `${req.protocol}://${correctHost}/play/${audioId}`;
    
    console.log(`生成播放链接: ${playUrl}`);
    
    // 上传音频到腾讯云COS (使用buffer)
    const audioKey = `audio/${audioId}${path.extname(req.file.originalname)}`;
    const cosAudioUrl = await uploadFile(req.file.buffer, audioKey);
    
    // 生成二维码 (生成buffer)
    const qrCodeBuffer = await QRCode.toBuffer(playUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // 上传二维码到腾讯云COS
    const qrKey = `qrcode/qr_${audioId}.png`;
    const cosQrUrl = await uploadFile(qrCodeBuffer, qrKey);

    // 保存到数据库
    try {
      audioData.audios.push({
        id: audioId,
        filename: `${audioId}${path.extname(req.file.originalname)}`,
        original_name: fixChineseFilename(req.file.originalname),
        cos_audio_url: cosAudioUrl,
        cos_qr_url: cosQrUrl,
        created_at: new Date().toISOString(),
        play_count: 0
      });
      
      res.json({
        success: true,
        audioId: audioId,
        playUrl: playUrl,
        qrCodeUrl: cosQrUrl,
        cosAudioUrl: cosAudioUrl,
        message: '音频上传成功，二维码已生成并上传到云端'
      });
    } catch (err) {
      console.error('数据库错误:', err);
      return res.status(500).json({ error: '保存失败' });
    }

  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({ error: '上传失败: ' + error.message });
  }
});

// 路由：播放页面
app.get('/play/:id', async (req, res) => {
  const audioId = req.params.id;
  
  try {
    const row = audioData.audios.find(audio => audio.id === audioId);
    
    if (!row) {
      console.log(`音频不存在: ${audioId}`);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>音频不存在</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { color: #e74c3c; font-size: 24px; margin-bottom: 20px; }
                .info { color: #666; font-size: 16px; }
            </style>
        </head>
        <body>
            <div class="error">😔 音频不存在</div>
            <div class="info">请检查二维码是否正确，或联系管理员</div>
            <div class="info">音频ID: ${audioId}</div>
        </body>
        </html>
      `);
    }

    // 检查音频文件是否存在
    if (!row.cos_audio_url) {
      console.log(`音频文件URL不存在: ${audioId}`);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>音频文件不存在</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { color: #e74c3c; font-size: 24px; margin-bottom: 20px; }
                .info { color: #666; font-size: 16px; }
            </style>
        </head>
        <body>
            <div class="error">😔 音频文件不存在</div>
            <div class="info">音频文件可能已被删除或上传失败</div>
        </body>
        </html>
      `);
    }

    // 增加播放次数
    row.play_count = (row.play_count || 0) + 1;
    
    console.log(`播放音频: ${row.original_name}, 播放次数: ${row.play_count}`);

    // 返回播放页面HTML
    const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="format-detection" content="telephone=no">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <title>音频播放 - ${fixChineseFilename(row.original_name)}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .player-container {
                background: white;
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 400px;
                width: 100%;
                text-align: center;
            }
            .audio-title {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin-bottom: 20px;
                word-break: break-all;
            }
            .audio-player {
                width: 100%;
                margin: 20px 0;
            }
            .play-info {
                color: #666;
                font-size: 14px;
                margin-top: 15px;
            }
            .download-btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 15px;
                transition: background 0.3s;
            }
            .download-btn:hover {
                background: #5a67d8;
            }
            .debug-info {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 15px;
                margin-top: 20px;
                text-align: left;
                font-size: 12px;
                color: #495057;
            }
            .status {
                margin-top: 10px;
                padding: 10px;
                border-radius: 5px;
                font-size: 14px;
            }
            .status.success { background: #d4edda; color: #155724; }
            .status.error { background: #f8d7da; color: #721c24; }
            .status.loading { background: #d1ecf1; color: #0c5460; }
        </style>
    </head>
    <body>
        <div class="player-container">
            <div class="audio-title">${fixChineseFilename(row.original_name)}</div>
            <audio class="audio-player" controls preload="auto" crossorigin="anonymous">
                <source src="${row.cos_audio_url}" type="audio/mpeg">
                <source src="${row.cos_audio_url}" type="audio/wav">
                <source src="${row.cos_audio_url}" type="audio/ogg">
                您的浏览器不支持音频播放。
            </audio>
            <div class="play-info">播放次数: ${row.play_count + 1}</div>
            <button class="download-btn" onclick="downloadAudio()">下载音频</button>
            
            <div id="status" class="status loading">正在加载音频...</div>
            
            <div class="debug-info">
                <strong>调试信息:</strong><br>
                音频ID: ${audioId}<br>
                文件名: ${fixChineseFilename(row.original_name)}<br>
                音频URL: <a href="${row.cos_audio_url}" target="_blank">${row.cos_audio_url}</a><br>
                播放次数: ${row.play_count + 1}<br>
                用户代理: <span id="userAgent"></span>
            </div>
        </div>
        
        <script>
            // 显示用户代理信息
            document.getElementById('userAgent').textContent = navigator.userAgent;
            
            function downloadAudio() {
                const link = document.createElement('a');
                link.href = '${row.cos_audio_url}';
                link.download = '${fixChineseFilename(row.original_name)}';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            // 音频事件监听
            const audio = document.querySelector('.audio-player');
            const status = document.getElementById('status');
            
            audio.addEventListener('loadstart', () => {
                console.log('开始加载音频');
                status.textContent = '正在加载音频...';
                status.className = 'status loading';
            });
            
            audio.addEventListener('canplay', () => {
                console.log('音频可以播放');
                status.textContent = '音频加载成功，可以播放';
                status.className = 'status success';
            });
            
            audio.addEventListener('error', (e) => {
                console.error('音频加载错误:', e);
                console.error('错误详情:', e.target.error);
                const errorCode = e.target.error ? e.target.error.code : '未知';
                const errorMessage = e.target.error ? e.target.error.message : '未知错误';
                status.textContent = '音频加载失败，错误代码: ' + errorCode + ', 错误信息: ' + errorMessage;
                status.className = 'status error';
            });
            
            audio.addEventListener('loadeddata', () => {
                console.log('音频数据加载完成');
            });
            
            audio.addEventListener('play', () => {
                console.log('开始播放音频');
            });
            
            // 测试音频URL是否可访问
            console.log('测试音频URL:', '${row.cos_audio_url}');
            fetch('${row.cos_audio_url}', { 
                method: 'HEAD',
                mode: 'no-cors' // 避免CORS问题
            })
            .then(response => {
                console.log('音频URL测试结果:', response.status, response.statusText);
            })
            .catch(error => {
                console.error('音频URL测试失败:', error);
            });
            
            // 页面加载完成后的调试信息
            console.log('播放页面加载完成');
            console.log('音频元素:', audio);
            console.log('音频源:', audio.src);
        </script>
    </body>
    </html>`;
    
    res.send(html);
  } catch (err) {
    console.error('数据库错误:', err);
    return res.status(500).send('服务器错误');
  }
});

// 路由：获取音频列表
app.get('/api/audios', async (req, res) => {
  try {
    const rows = audioData.audios.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const correctHost = getCorrectHost(req);
    const audios = rows.map(row => ({
      id: row.id,
      originalName: fixChineseFilename(row.original_name),
      playUrl: `${req.protocol}://${correctHost}/play/${row.id}`,
      qrCodeUrl: row.cos_qr_url || `${req.protocol}://${correctHost}/qr_${row.id}.png`,
      cosAudioUrl: row.cos_audio_url,
      playCount: row.play_count || 0,
      createdAt: row.created_at
    }));
    
    res.json(audios);
  } catch (err) {
    console.error('数据库错误:', err);
    return res.status(500).json({ error: '获取列表失败' });
  }
});

// 路由：删除音频
app.delete('/api/audio/:id', async (req, res) => {
  const audioId = req.params.id;
  
  try {
    const rowIndex = audioData.audios.findIndex(audio => audio.id === audioId);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: '音频不存在' });
    }
    
    const row = audioData.audios[rowIndex];
    
    // 删除COS中的文件
    const deletePromises = [];
    if (row.cos_audio_url) {
      const audioKey = `audio/${audioId}${path.extname(row.filename)}`;
      deletePromises.push(deleteFile(audioKey));
    }
    if (row.cos_qr_url) {
      const qrKey = `qrcode/qr_${audioId}.png`;
      deletePromises.push(deleteFile(qrKey));
    }
    
    // 删除本地文件
    fs.remove(row.file_path).catch(console.error);
    fs.remove(row.qr_code_path).catch(console.error);
    
    // 等待COS删除完成
    try {
      await Promise.all(deletePromises);
    } catch (cosError) {
      console.error('COS删除失败:', cosError);
    }
    
    // 删除数据库记录
    audioData.audios.splice(rowIndex, 1);
    
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('数据库错误:', err);
    return res.status(500).json({ error: '数据库错误' });
  }
});

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 获取本机IP地址
function getLocalIPAddress() {
  const interfaces = require('os').networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

// 获取正确的主机地址（用于二维码生成）
function getCorrectHost(req) {
  const host = req.get('host');
  
  // 生产环境直接使用请求的host
  if (NODE_ENV === 'production') {
    return host;
  }
  
  // 开发环境处理localhost
  const localIP = getLocalIPAddress();
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return `${localIP}:${PORT}`;
  }
  
  return host;
}

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🎵 音频二维码服务器已启动！`);
  console.log(`🌍 环境: ${NODE_ENV}`);
  console.log(`🚀 端口: ${PORT}`);
  
  if (NODE_ENV === 'development') {
    const localIP = getLocalIPAddress();
    console.log(`🖥️  本机访问: http://localhost:${PORT}`);
    console.log(`📱 手机访问: http://${localIP}:${PORT}`);
    console.log(`📋 局域网访问: http://${localIP}:${PORT}`);
    console.log(`\n💡 使用手机连接同一WiFi网络，扫描二维码即可播放音频`);
  } else {
    console.log(`🌐 生产环境运行中...`);
  }
  
  console.log(`📱 上传音频并生成二维码，扫码即可播放！`);
  
  // 检查COS配置
  const cosConfigValid = await checkCOSConfig();
  if (cosConfigValid) {
    console.log('✅ COS配置检查通过');
  } else {
    console.log('\n⚠️  COS配置无效，请检查环境变量配置');
    console.log('📝 请设置正确的COS环境变量');
  }
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  console.log('数据库已保存。');
  process.exit(0);
}); 