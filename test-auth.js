const http = require('http');

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
        console.log('🔐 登录响应:', data);
        console.log('📡 响应状态码:', res.statusCode);
        console.log('📡 响应头:', res.headers);

        try {
          const response = JSON.parse(data);
          if (res.headers['set-cookie']) {
            const cookieHeader = res.headers['set-cookie'].find(cookie => cookie.startsWith('token='));
            const token = cookieHeader ? cookieHeader.split('=')[1].split(';')[0] : null;
            console.log('✅ 获取到token:', token ? token.substring(0, 20) + '...' : 'null');
            resolve(token);
          } else {
            console.log('❌ 没有找到token cookie');
            resolve(null);
          }
        } catch (error) {
          console.log('❌ 解析登录响应失败:', error.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 登录请求错误:', error.message);
      reject(error);
    });

    req.write(loginData);
    req.end();
  });
};

// 测试multipart上传
const testUploadWithAuth = async () => {
  try {
    console.log('🚀 开始带认证的multipart测试...');

    // 获取token
    const token = await getAuthToken();
    if (!token) {
      console.log('❌ 无法获取认证token，测试终止');
      return;
    }

    // 构造multipart请求
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
        'Authorization': `Bearer ${token}`
      }
    };

    console.log('📤 发送上传请求...');
    console.log(`Authorization: Bearer ${token.substring(0, 20)}...`);

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

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

testUploadWithAuth();