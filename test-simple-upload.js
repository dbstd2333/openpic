const fs = require('fs');
const path = require('path');
const http = require('http');

// 创建一个简单的测试图片文件（1x1像素的PNG）
const createTestFile = () => {
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

  const testFilePath = path.join(__dirname, 'test-image.png');
  fs.writeFileSync(testFilePath, pngData);
  return testFilePath;
};

// 简单的multipart数据构建器
const createMultipartData = (filePath, albumId) => {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);
  const fileName = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath);

  let body = '';

  // 添加albumId字段
  if (albumId) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="albumId"\r\n\r\n`;
    body += `${albumId}\r\n`;
  }

  // 添加文件字段
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
  body += `Content-Type: image/png\r\n\r\n`;

  const header = Buffer.from(body, 'utf8');
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');

  return {
    header,
    fileContent,
    footer,
    boundary,
    totalLength: header.length + fileContent.length + footer.length
  };
};

// 测试流式上传
const testStreamingUpload = async () => {
  try {
    console.log('🚀 开始测试流式文件上传...');

    // 创建测试文件
    const testFilePath = createTestFile();
    console.log('✅ 测试文件已创建:', testFilePath);

    // 构建multipart数据
    const multipartData = createMultipartData(testFilePath, 1);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/photos/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${multipartData.boundary}`,
        'Content-Length': multipartData.totalLength
      }
    };

    console.log('📤 发送上传请求...');
    console.log(`📊 文件大小: ${multipartData.fileContent.length} bytes`);

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
            console.log('🎉 上传成功！', response.data);
          } else {
            console.log('⚠️ 上传失败:', response.error);
          }
        } catch (parseError) {
          console.log('📄 原始响应:', data);
        }

        console.log('🎉 测试完成！');

        // 清理测试文件
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
          console.log('🧹 测试文件已清理');
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求错误:', error.message);
      console.log('💡 提示: 请确保服务器正在 localhost:3000 运行');

      // 清理测试文件
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    // 流式发送数据
    req.write(multipartData.header);
    req.write(multipartData.fileContent);
    req.write(multipartData.footer);
    req.end();

    console.log('🌊 数据正在流式发送...');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

// 运行测试
testStreamingUpload();