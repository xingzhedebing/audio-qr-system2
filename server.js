const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cors = require('cors');
const { uploadFile, deleteFile, checkCOSConfig } = require('./config/cos');

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// 内存数据存储
let audioData = { audios: [] };

// 配置文件上传 - 使用内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
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
    if (filename.includes('æ') || filename.includes('ç') || filename.includes('¤') || filename.includes('å')) {
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

// 获取正确的主机地址
function getCorrectHost(req) {
  return req.get('host');
}

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 上传音频并生成二维码
app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择音频文件' });
    }

    const audioId = uuidv4();
    const correctHost = getCorrectHost(req);
    const playUrl = `${req.protocol}://${correctHost}/play/${audioId}`;
    
    console.log(`生成播放链接: ${playUrl}`);
    
    // 上传音频到腾讯云COS
    const audioKey = `audio/${audioId}${path.extname(req.file.originalname)}`;
    const cosAudioUrl = await uploadFile(req.file.buffer, audioKey);
    
    // 生成二维码
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

    // 保存到内存数据库
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

  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({ error: '上传失败: ' + error.message });
  }
});

// 播放页面
app.get('/play/:id', async (req, res) => {
  const audioId = req.params.id;
  
  try {
    const row = audioData.audios.find(audio => audio.id === audioId);
    
    if (!row) {
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
            <div class="play-info">播放次数: ${row.play_count}</div>
            <button class="download-btn" onclick="downloadAudio()">下载音频</button>
        </div>
        
        <script>
            function downloadAudio() {
                const link = document.createElement('a');
                link.href = '${row.cos_audio_url}';
                link.download = '${fixChineseFilename(row.original_name)}';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        </script>
    </body>
    </html>`;
    
    res.send(html);
  } catch (err) {
    console.error('播放页面错误:', err);
    return res.status(500).send('服务器错误');
  }
});

// 获取音频列表
app.get('/api/audios', async (req, res) => {
  try {
    const rows = audioData.audios.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const correctHost = getCorrectHost(req);
    const audios = rows.map(row => ({
      id: row.id,
      originalName: fixChineseFilename(row.original_name),
      playUrl: `${req.protocol}://${correctHost}/play/${row.id}`,
      qrCodeUrl: row.cos_qr_url,
      cosAudioUrl: row.cos_audio_url,
      playCount: row.play_count || 0,
      createdAt: row.created_at
    }));
    
    res.json(audios);
  } catch (err) {
    console.error('获取列表错误:', err);
    return res.status(500).json({ error: '获取列表失败' });
  }
});

// 删除音频
app.delete('/api/audio/:id', async (req, res) => {
  const audioId = req.params.id;
  
  try {
    const rowIndex = audioData.audios.findIndex(audio => audio.id === audioId);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: '音频不存在' });
    }
    
    const row = audioData.audios[rowIndex];
    
    // 删除COS中的文件
    try {
      const audioKey = `audio/${audioId}${path.extname(row.filename)}`;
      const qrKey = `qrcode/qr_${audioId}.png`;
      await Promise.all([
        deleteFile(audioKey),
        deleteFile(qrKey)
      ]);
    } catch (cosError) {
      console.error('COS删除失败:', cosError);
    }
    
    // 删除数据库记录
    audioData.audios.splice(rowIndex, 1);
    
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除错误:', err);
    return res.status(500).json({ error: '删除失败' });
  }
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