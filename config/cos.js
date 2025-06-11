const COS = require('cos-nodejs-sdk-v5');
const path = require('path');
const fs = require('fs');

// 初始化COS实例
const cos = new COS({
    SecretId: process.env.TENCENT_SECRET_ID,
    SecretKey: process.env.TENCENT_SECRET_KEY,
});

const BUCKET = process.env.COS_BUCKET;
const REGION = process.env.COS_REGION;

/**
 * 上传文件到腾讯云COS
 * @param {string} filePath - 本地文件路径
 * @param {string} key - COS中的文件键名
 * @returns {Promise<string>} - 返回文件的访问URL
 */
async function uploadFile(filePath, key) {
    return new Promise((resolve, reject) => {
        cos.putObject({
            Bucket: BUCKET,
            Region: REGION,
            Key: key,
            Body: fs.createReadStream(filePath),
            ContentLength: fs.statSync(filePath).size,
        }, (err, data) => {
            if (err) {
                console.error('COS上传错误:', err);
                reject(err);
            } else {
                // 构建访问URL
                const url = `https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`;
                resolve(url);
            }
        });
    });
}

/**
 * 删除COS中的文件
 * @param {string} key - COS中的文件键名
 * @returns {Promise<boolean>} - 删除是否成功
 */
async function deleteFile(key) {
    return new Promise((resolve, reject) => {
        cos.deleteObject({
            Bucket: BUCKET,
            Region: REGION,
            Key: key,
        }, (err, data) => {
            if (err) {
                console.error('COS删除错误:', err);
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * 批量删除COS中的文件
 * @param {string[]} keys - 要删除的文件键名数组
 * @returns {Promise<boolean>} - 删除是否成功
 */
async function deleteMultipleFiles(keys) {
    if (!keys || keys.length === 0) return true;
    
    return new Promise((resolve, reject) => {
        cos.deleteMultipleObject({
            Bucket: BUCKET,
            Region: REGION,
            Objects: keys.map(key => ({ Key: key }))
        }, (err, data) => {
            if (err) {
                console.error('COS批量删除错误:', err);
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * 检查COS配置是否正确
 * @returns {Promise<boolean>} - 配置是否正确
 */
async function checkCOSConfig() {
    return new Promise((resolve) => {
        cos.getBucket({
            Bucket: BUCKET,
            Region: REGION,
        }, (err, data) => {
            if (err) {
                console.error('COS配置检查失败:', err.message);
                resolve(false);
            } else {
                console.log('✅ COS配置检查通过');
                resolve(true);
            }
        });
    });
}

module.exports = {
    uploadFile,
    deleteFile,
    deleteMultipleFiles,
    checkCOSConfig,
    BUCKET,
    REGION
}; 