const http = require('http');

// 简单测试multipart请求
const testMultipart = () => {
  console.log('🧪 测试multipart请求处理...');

  // 构造一个简单的multipart请求体
  const boundary = '----WebKitFormBoundary32JnD35GERfBZdtx';

  let body = '';

  // 添加albumId字段
  body += `--${boundary}\r\n`;
  body += 'Content-Disposition: form-data; name="albumId"\r\n\r\n';
  body += '2\r\n';

  // 添加文件字段
  body += `--${boundary}\r\n`;
  body += 'Content-Disposition: form-data; name="files"; filename="test.png"\r\n';
  body += 'Content-Type: image/png\r\n\r\n';

  // 添加一个简单的PNG文件头
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  ]);

  const bodyBuffer = Buffer.concat([
    Buffer.from(body),
    pngHeader,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/photos/upload',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': bodyBuffer.length,
      'Authorization': 'Bearer test-token'
    }
  };

  console.log('📤 发送测试请求...');
  console.log(`Content-Type: ${options.headers['Content-Type']}`);
  console.log(`Content-Length: ${options.headers['Content-Length']}`);

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
    });
  });

  req.on('error', (error) => {
    console.error('❌ 请求错误:', error.message);
  });

  req.write(bodyBuffer);
  req.end();
};

testMultipart();