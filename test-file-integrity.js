const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const http = require('http');

// 创建一个真实的PNG图片
const createRealTestImage = () => {
  // 创建一个简单的2x2像素的PNG图片（使用更标准的PNG数据）
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature

    // IHDR chunk
    0x00, 0x00, 0x00, 0x0D, // Chunk length: 13 bytes
    0x49, 0x48, 0x44, 0x52, // Chunk type: IHDR
    0x00, 0x00, 0x00, 0x02, // Width: 2
    0x00, 0x00, 0x00, 0x02, // Height: 2
    0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 6 (RGBA), etc.
    0x4C, 0x87, 0x94, 0x95, // CRC

    // IDAT chunk (compressed image data)
    0x00, 0x00, 0x00, 0x1A, // Chunk length: 26 bytes
    0x49, 0x44, 0x41, 0x54, // Chunk type: IDAT
    0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Compressed data
    0x72, 0x24, 0x1F, 0x97, 0x6E, 0x0F, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // More data and IEND
    0xAE, 0x42, 0x60, 0x82  // IEND CRC
  ]);

  const filePath = path.join(__dirname, 'test-real-image.png');
  fs.writeFileSync(filePath, pngData);
  return filePath;
};

// 获取认证token
const getAuthToken = () => {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      username: 'admin',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.headers['set-cookie']) {
            const cookieHeader = res.headers['set-cookie'].find(cookie => cookie.startsWith('token='));
            const token = cookieHeader ? cookieHeader.split('=')[1].split(';')[0] : 'test-token';
            resolve(token);
          } else {
            resolve('test-token');
          }
        } catch {
          resolve('test-token');
        }
      });
    });

    req.on('error', () => resolve('test-token'));
    req.write(loginData);
    req.end();
  });
};

// 验证上传的文件
const verifyUploadedFile = (originalPath, uploadedFilePath) => {
  try {
    const originalBuffer = fs.readFileSync(originalPath);
    const uploadedBuffer = fs.readFileSync(uploadedFilePath);

    const isIdentical = Buffer.compare(originalBuffer, uploadedBuffer) === 0;

    console.log('📊 文件完整性验证:');
    console.log(`   原始文件大小: ${originalBuffer.length} bytes`);
    console.log(`   上传文件大小: ${uploadedBuffer.length} bytes`);
    console.log(`   文件是否一致: ${isIdentical ? '✅ 是' : '❌ 否'}`);

    if (!isIdentical) {
      console.log('   ❌ 文件内容不匹配！');
      return false;
    }

    // 检查文件头
    const originalHeader = originalBuffer.slice(0, 8).toString('hex');
    const uploadedHeader = uploadedBuffer.slice(0, 8).toString('hex');

    console.log(`   原始文件头: ${originalHeader}`);
    console.log(`   上传文件头: ${uploadedHeader}`);
    console.log(`   PNG签名验证: ${originalHeader === '89504e470d0a1a0a' && uploadedHeader === '89504e470d0a1a0a' ? '✅ 通过' : '❌ 失败'}`);

    return isIdentical;
  } catch (error) {
    console.log('❌ 验证文件时出错:', error.message);
    return false;
  }
};

// 测试上传
const testUploadWithIntegrityCheck = async () => {
  try {
    console.log('🚀 开始文件完整性测试...');

    // 获取token
    const token = await getAuthToken();
    console.log('✅ 获取认证token成功');

    // 创建测试图片
    const originalImagePath = createRealTestImage();
    console.log('✅ 原始测试图片已创建:', originalImagePath);

    // 读取原始文件信息
    const originalStats = fs.statSync(originalImagePath);
    console.log(`📁 原始文件: ${originalImagePath} (${originalStats.size} bytes)`);

    // 创建FormData
    const form = new FormData();
    form.append('albumId', '1');
    form.append('file', fs.createReadStream(originalImagePath), {
      filename: 'integrity-test.png',
      contentType: 'image/png'
    });

    // 发送请求
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/photos/upload',
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    };

    console.log('📤 发送上传请求...');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`📡 响应状态: ${res.statusCode}`);
          console.log('📥 响应内容:', response);

          if (response.success && response.data && response.data.files && response.data.files.length > 0) {
            const uploadedFile = response.data.files[0];
            const uploadedFilePath = path.join(process.cwd(), 'public', uploadedFile.path);

            console.log(`📁 上传文件路径: ${uploadedFilePath}`);

            // 等待一小段时间确保文件写入完成
            setTimeout(() => {
              if (fs.existsSync(uploadedFilePath)) {
                const isValid = verifyUploadedFile(originalImagePath, uploadedFilePath);

                if (isValid) {
                  console.log('🎉 文件完整性测试通过！');
                } else {
                  console.log('❌ 文件完整性测试失败！');
                }
              } else {
                console.log('❌ 上传的文件不存在:', uploadedFilePath);
              }

              // 清理测试文件
              if (fs.existsSync(originalImagePath)) {
                fs.unlinkSync(originalImagePath);
                console.log('🧹 原始测试文件已清理');
              }
            }, 1000);
          } else {
            console.log('❌ 上传失败:', response.error || '未知错误');
          }
        } catch (parseError) {
          console.log('❌ 解析响应失败:', parseError.message);
          console.log('原始响应:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求错误:', error.message);
    });

    form.pipe(req);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

// 运行测试
testUploadWithIntegrityCheck();