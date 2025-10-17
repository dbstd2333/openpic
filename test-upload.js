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

  fs.writeFileSync(path.join(__dirname, 'test-image.png'), pngData);
  return path.join(__dirname, 'test-image.png');
};

// 测试流式上传
const testStreamingUpload = async () => {
  try {
    console.log('🚀 开始测试流式文件上传...');

    // 创建测试图片
    const testImagePath = createTestImage();
    console.log('✅ 测试图片已创建:', testImagePath);

    // 创建FormData
    const form = new FormData();
    form.append('albumId', '1'); // 可选的相册ID
    form.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
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
        'Authorization': 'Bearer fake-token-for-test' // 这里需要真实的token
      }
    };

    console.log('📤 发送上传请求...');

    const req = http.request(options, (res) => {
      console.log(`📡 响应状态码: ${res.statusCode}`);
      console.log(`📡 响应头:`, res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 响应内容:', data);
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
      console.log('💡 提示: 请确保服务器正在运行并且有有效的认证token');
    });

    // 将FormData数据流式发送
    form.pipe(req);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

// 运行测试
testStreamingUpload();