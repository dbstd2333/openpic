# 图片床 API 后端

基于 NestJS + TypeORM + PostgreSQL 构建的图片床 API 后端服务。

## 功能特性

- ✅ JWT 认证系统（HttpOnly Cookie）
- ✅ 相册管理（CRUD）
- ✅ 图片上传与管理
- ✅ 静态文件服务
- ✅ 统一响应格式
- ✅ TypeScript 支持
- ✅ 自动数据库同步

## 快速开始

### 1. 环境准备

确保已安装：
- Node.js (>= 16)
- PostgreSQL
- pnpm

### 2. 安装依赖

```bash
pnpm install
```

### 3. 环境配置

配置 `.env` 文件：

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=photo_album

# JWT Configuration
JWT_SECRET=your_strong_secret_here_change_this_in_production

# Application Configuration
PORT=3000
NODE_ENV=development
```

### 4. 启动服务

```bash
# 开发模式
pnpm run start:dev

# 生产模式
pnpm run build
pnpm run start:prod
```

服务启动后，会自动创建默认管理员用户：
- 用户名：`admin`
- 密码：`admin123`

## API 接口

### 认证接口

#### 登录
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### 登出
```http
POST /auth/logout
```

### 相册接口

#### 获取所有相册
```http
GET /albums
```

#### 创建相册
```http
POST /albums
Content-Type: application/json

{
  "name": "我的相册",
  "description": "相册描述"
}
```

#### 删除相册
```http
DELETE /albums/:id
```

### 图片接口

#### 获取相册图片
```http
GET /photos/:albumId
```

#### 上传图片
```http
POST /photos/upload
Content-Type: multipart/form-data

files: [File, File, ...]
albumId: 1
```

#### 删除图片
```http
POST /photos/delete
Content-Type: application/json

{
  "ids": [1, 2, 3]
}
```

#### 移动图片到其他相册
```http
POST /photos/move
Content-Type: application/json

{
  "photoIds": [1, 2, 3],
  "albumId": 2
}
```

### 静态文件访问

上传的图片可通过以下方式访问：
```http
GET /public/uploads/:filename
```

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": { ... }
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 安全特性

- JWT Token 通过 HttpOnly Cookie 传输，防止 XSS 攻击
- 密码使用 bcrypt 加密存储
- 文件上传类型限制（仅允许图片格式）
- 文件大小限制（单文件最大 10MB）

## 数据库结构

### Users 表
- id: 主键
- username: 用户名（唯一）
- password: 加密密码
- createdAt/updatedAt: 时间戳

### Albums 表
- id: 主键
- name: 相册名称
- description: 相册描述（可选）
- photoCount: 图片数量
- createdAt/updatedAt: 时间戳

### Photos 表
- id: 主键
- filename: 存储文件名
- originalName: 原始文件名
- path: 文件路径
- albumId: 所属相册ID（可选）
- size: 文件大小
- mimeType: 文件类型
- createdAt/updatedAt: 时间戳

## 开发说明

- 使用 TypeORM 进行数据库操作
- 支持开发环境自动同步数据库结构
- 生产环境建议关闭 `synchronize` 并使用 migration
- 支持 CORS 跨域请求
- 全局异常处理和参数验证

## 许可证

Private License