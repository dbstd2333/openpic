const axios = require('axios');

// API基础URL
const API_BASE_URL = 'http://localhost:3001';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 示例通知数据
const sampleNotifications = [
  {
    title: '欢迎使用图床系统',
    content: '这是一个功能强大的图片管理和分享平台，您可以轻松创建相册、上传照片并与朋友分享。',
    type: 'info',
    isActive: true,
    priority: 10,
  },
  {
    title: '新功能上线',
    content: '我们刚刚推出了批量上传功能，现在您可以一次性上传多张照片，大大提高效率！',
    type: 'success',
    isActive: true,
    priority: 8,
    link: '/upload',
    linkText: '立即体验',
  },
  {
    title: '系统维护通知',
    content: '系统将于本周六凌晨2点至4点进行维护升级，期间服务可能会暂时中断，敬请谅解。',
    type: 'warning',
    isActive: true,
    priority: 5,
  },
];

// 登录获取token
async function login() {
  try {
    console.log('尝试登录到:', `${API_BASE_URL}/auth/login`);
    console.log('登录数据:', { username: 'admin', password: 'admin123' });
    
    const response = await api.post('/auth/login', {
      username: 'admin',
      password: 'admin123',
    });
    
    console.log('登录响应:', response.data);
    
    if (response.data?.success && response.data?.data?.token) {
      return response.data.data.token;
    }
    throw new Error('登录失败: ' + JSON.stringify(response.data));
  } catch (error) {
    console.error('登录错误详情:');
    console.error('- 错误消息:', error.message);
    console.error('- 响应状态:', error.response?.status);
    console.error('- 响应数据:', error.response?.data);
    console.error('- 请求URL:', error.config?.url);
    console.error('- 请求方法:', error.config?.method);
    throw error;
  }
}

// 创建通知
async function createNotification(token, notificationData) {
  try {
    const response = await api.post('/notifications', notificationData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (response.data?.success) {
      console.log(`✅ 成功创建通知: ${notificationData.title}`);
      return response.data.data;
    }
    throw new Error('创建通知失败');
  } catch (error) {
    console.error(`❌ 创建通知失败 (${notificationData.title}):`, error.response?.data || error.message);
    throw error;
  }
}

// 主函数
async function main() {
  console.log('🚀 开始创建示例通知数据...');
  
  try {
    // 1. 登录获取token
    console.log('📝 正在登录...');
    const token = await login();
    console.log('✅ 登录成功');
    
    // 2. 创建示例通知
    console.log('📢 正在创建示例通知...');
    for (const notification of sampleNotifications) {
      await createNotification(token, notification);
    }
    
    console.log('🎉 所有示例通知创建完成！');
    console.log('💡 您现在可以访问首页查看横幅通知效果');
  } catch (error) {
    console.error('❌ 创建示例通知失败:', error.message);
    process.exit(1);
  }
}

// 执行主函数
main();