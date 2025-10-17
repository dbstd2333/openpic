const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const http = require('http');

// 创建一个测试图片文件（简单的1x1像素PNG）
const createTestImage = () => {
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Compressed data
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);

  fs.writeFileSync(path.join(__dirname, 'test-image-fixed.png'), pngData);
  return path.join(__dirname, 'test-image-fixed.png');
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

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && res.headers['set-cookie']) {
            // 从Cookie中提取token
            const cookieHeader = res.headers['set-cookie'].find(cookie => cookie.startsWith('token='));
            if (cookieHeader) {
              const token = cookieHeader.split('=')[1].split(';')[0];
              resolve(token);
            } else {
              reject(new Error('Token not found in cookies'));
            }
          } else {
            reject(new Error('Login failed: ' + (response.error || 'Unknown error')));
          }
        } catch (error) {
          reject(new Error('Failed to parse login response: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(loginData);
    req.end();
  });
};

// 测试流式上传
const testStreamingUpload = async () => {
  try {
    console.log('🚀 开始测试流式文件上传...');

    // 获取认证token
    console.log('🔐 正在获取认证token...');
    let token;
    try {
      token = await getAuthToken();
      console.log('✅ 认证token获取成功');
    } catch (authError) {
      console.log('⚠️  无法获取认证token，将使用测试token继续测试');
      console.log('   错误信息:', authError.message);
      token = 'test-token';
    }

    // 创建测试图片
    const testImagePath = createTestImage();
    console.log('✅ 测试图片已创建:', testImagePath);

    // 创建FormData
    const form = new FormData();
    form.append('albumId', '1'); // 可选的相册ID
    form.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-image-fixed.png',
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
    console.log('   请求头:', options.headers);

    const req = http.request(options, (res) => {
      console.log(`📡 响应状态码: ${res.statusCode}`);
      console.log(`📡 响应头:`, res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 响应内容:', data);

        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('🎉 上传测试成功！');
          } else {
            console.log('❌ 上传测试失败:', response.error);
          }
        } catch (parseError) {
          console.log('❌ 无法解析响应:', parseError.message);
        }

        console.log('🎉 测试完成！');

        // 清理测试文件
        if (fs.existsSync(testImagePath)) {
          fs.unlinkSync(testImagePath);
          console.log('🧹 测试文件已清理');
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求错误:', error.message);
      console.log('💡 提示: 请确保服务器正在运行在 http://localhost:3001');

      // 清理测试文件
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
        console.log('🧹 测试文件已清理');
      }
    });

    // 将FormData数据流式发送
    form.pipe(req);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

// 运行测试
testStreamingUpload();