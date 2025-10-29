# 项目配置指南

## 一、环境准备

### 1. 安装微信开发者工具
- 下载地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- 安装并打开工具

### 2. 注册微信小程序
- 访问：https://mp.weixin.qq.com/
- 注册账号并获取 AppID

## 二、项目配置步骤

### 步骤1：修改项目配置

编辑 `project.config.json` 文件：

```json
{
  "appid": "your-appid-here",  // 改为你的小程序AppID
  ...
}
```

### 步骤2：开通云开发

1. 打开微信开发者工具
2. 点击工具栏"云开发"按钮
3. 首次使用需要开通云开发
4. 创建云开发环境（推荐创建两个环境：test 和 prod）
5. 记录环境ID（类似：cloud1-xxx）

### 步骤3：配置云开发环境ID

编辑 `app.js` 文件：

```javascript
wx.cloud.init({
  env: 'your-env-id',  // 改为你的云开发环境ID
  traceUser: true,
})
```

### 步骤4：创建数据库集合

在云开发控制台 -> 数据库中创建以下集合：

1. **users** - 用户表
2. **tasks** - 任务表
3. **orders** - 订单表
4. **reviews** - 评价表

### 步骤5：配置数据库索引

参考 `database/db.collection.json` 文件，为每个集合创建索引。

在云开发控制台 -> 数据库 -> 对应集合 -> 索引管理中添加：

#### users 表索引
- `openId` (唯一索引)
- `userType`
- `rating` (降序)

#### tasks 表索引
- `customerId`
- `developerId`
- `status`
- `createdAt` (降序)
- `status` + `createdAt` (组合索引)

#### orders 表索引
- `taskId` (唯一索引)
- `customerId`
- `developerId`
- `createdAt` (降序)

#### reviews 表索引
- `toUserId`
- `taskId` + `fromUserId` (组合唯一索引)
- `createdAt` (降序)

### 步骤6：配置数据库权限

在云开发控制台 -> 数据库 -> 对应集合 -> 权限设置：

建议所有集合设置为：**仅创建者可读写**

或参考 `database/permissions.json` 配置自定义安全规则。

### 步骤7：上传云函数

依次上传以下云函数：

1. 右键点击 `cloudfunctions/user`
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

重复以上步骤，部署所有云函数：
- `user`
- `task`
- `order`
- `payment`
- `review`

### 步骤8：准备图片资源

在 `images/` 目录下准备以下图片（png格式，建议尺寸81x81）：

**必需图标**：
- `task.png` / `task-active.png`
- `mytask.png` / `mytask-active.png`
- `order.png` / `order-active.png`
- `profile.png` / `profile-active.png`

**功能图标**：
- `logo.png` (120x120)
- `customer.png` (120x120)
- `developer.png` (120x120)
- `search.png` (32x32)
- `filter.png` (32x32)
- `add.png` (32x32)
- `close.png` (32x32)
- `arrow-right.png` (24x24)
- `money.png` (28x28)
- `time.png` (28x28)
- `calendar.png` (28x28)
- `star.png` (32x32)
- `ai.png` (36x36)
- `switch.png` (40x40)
- `info.png` (40x40)
- `service.png` (40x40)
- `empty.png` (200x200)

> 提示：可以使用在线图标网站如 iconfont.cn 下载免费图标

## 三、本地开发调试

### 1. 启动项目
1. 打开微信开发者工具
2. 导入项目
3. 点击"编译"

### 2. 模拟器调试
- 在模拟器中测试各项功能
- 查看控制台日志
- 调试云函数调用

### 3. 真机调试
1. 点击"预览"
2. 使用微信扫码
3. 在真机上测试

## 四、常见问题

### Q1: 云函数调用失败
**A**: 检查以下几点：
- 云函数是否已上传
- 环境ID是否正确
- 查看云函数日志

### Q2: 数据库操作失败
**A**: 检查：
- 集合是否已创建
- 权限是否正确配置
- 索引是否已添加

### Q3: 页面图片不显示
**A**: 确保：
- 图片文件已放入 images 目录
- 图片路径正确
- 图片格式为 png

### Q4: 用户登录失败
**A**: 
- 确保云函数 user 已部署
- 检查 users 集合是否已创建
- 查看云函数日志

### Q5: 支付功能无法使用
**A**: 
- 个人小程序无法使用支付功能
- 需要企业认证
- 需要开通微信支付

## 五、开发建议

### 1. 开发流程
1. 先在开发版测试
2. 确认无误后上传
3. 提交审核前充分测试

### 2. 版本管理
- 使用 git 管理代码
- 每次上传前打tag
- 记录版本更新日志

### 3. 调试技巧
- 善用 console.log
- 查看 Network 请求
- 利用云函数日志

### 4. 性能优化
- 图片使用 CDN
- 减少云函数调用
- 使用数据缓存
- 优化数据库查询

## 六、安全注意事项

### 1. 数据安全
- 不要在前端存储敏感信息
- 使用云函数处理业务逻辑
- 配置正确的数据库权限

### 2. 用户隐私
- 添加隐私政策
- 说明数据收集用途
- 提供用户协议

### 3. 支付安全
- 验证支付回调
- 记录交易日志
- 防止重复支付

## 七、上线前检查清单

- [ ] 修改 AppID
- [ ] 配置云开发环境ID
- [ ] 创建所有数据库集合
- [ ] 配置数据库索引
- [ ] 配置数据库权限
- [ ] 上传所有云函数
- [ ] 准备所有图片资源
- [ ] 测试所有功能
- [ ] 添加隐私政策
- [ ] 添加用户协议
- [ ] 配置服务类目
- [ ] 完成小程序认证（如需支付）
- [ ] 开通微信支付（如需支付）

## 八、获取帮助

### 官方文档
- 微信小程序文档：https://developers.weixin.qq.com/miniprogram/dev/
- 云开发文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html

### 社区支持
- 微信开放社区：https://developers.weixin.qq.com/community/
- GitHub Issues：（项目仓库）

### 常用工具
- 微信开发者工具
- 云开发控制台
- 小程序管理后台

---

配置完成后，就可以开始开发了！祝您开发顺利！🎉

