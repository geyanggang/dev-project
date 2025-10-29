# 程序员接单平台微信小程序

## 项目简介

这是一个极简风格的程序员接单平台微信小程序，连接开发需求客户和程序员，提供任务发布、接单、担保交易和评价服务。

## 核心功能

- ✅ 用户系统：微信授权登录、身份选择（客户/程序员）
- ✅ 任务系统：任务发布、浏览、搜索、筛选
- ✅ AI评估：智能评估任务参考价格
- ✅ 交易系统：抢单、押金支付、验收、结算
- ✅ 评价系统：星级评分、评价管理
- ✅ 订单管理：订单追踪、状态管理

## 技术架构

### 前端
- 微信小程序原生框架
- WXML + WXSS + JavaScript
- 极简设计风格

### 后端
- 微信小程序云开发
- 云函数（Serverless）
- 云数据库（MongoDB）
- 云存储

### 云函数列表
- `user`: 用户管理（注册、登录、信息更新）
- `task`: 任务管理（发布、列表、详情、抢单、取消）
- `order`: 订单管理（创建、查询、状态更新）
- `payment`: 支付管理（微信支付集成）
- `review`: 评价管理（创建评价、查询评价）

## 项目结构

```
wechatapp/
├── pages/                    # 页面目录
│   ├── index/               # 首页-任务大厅
│   ├── task-detail/         # 任务详情页
│   ├── publish-task/        # 发布任务页
│   ├── my-tasks/            # 我的任务页
│   ├── my-orders/           # 我的订单页
│   ├── profile/             # 个人中心页
│   ├── user-setup/          # 用户设置页
│   └── review/              # 评价页
├── cloudfunctions/          # 云函数目录
│   ├── user/               # 用户管理云函数
│   ├── task/               # 任务管理云函数
│   ├── order/              # 订单管理云函数
│   ├── payment/            # 支付管理云函数
│   └── review/             # 评价管理云函数
├── database/                # 数据库配置
│   ├── db.collection.json  # 集合和索引配置
│   └── permissions.json    # 权限配置
├── images/                  # 图片资源
├── app.js                   # 小程序入口
├── app.json                 # 小程序配置
├── app.wxss                 # 全局样式
└── project.config.json      # 项目配置
```

## 数据库设计

### users（用户表）
```javascript
{
  _id: ObjectId,
  openId: String,           // 微信openId
  avatar: String,           // 头像
  nickname: String,         // 昵称
  userType: String,         // customer/developer
  skills: Array,            // 技能标签（程序员）
  rating: Number,           // 评分
  completedOrders: Number,  // 完成订单数
  createdAt: Date,
  updatedAt: Date
}
```

### tasks（任务表）
```javascript
{
  _id: ObjectId,
  customerId: String,       // 客户ID
  title: String,            // 任务标题
  description: String,      // 任务描述
  budgetRange: {           // 预算范围
    min: Number,
    max: Number
  },
  aiSuggestedPrice: Number, // AI评估价格
  finalPrice: Number,       // 最终定价
  techStack: Array,         // 技术栈
  deadline: String,         // 截止日期
  status: String,           // pending/grabbed/in-progress/completed/cancelled
  developerId: String,      // 程序员ID
  createdAt: Date,
  updatedAt: Date
}
```

### orders（订单表）
```javascript
{
  _id: ObjectId,
  taskId: String,           // 任务ID
  customerId: String,       // 客户ID
  developerId: String,      // 程序员ID
  amount: Number,           // 订单金额
  depositStatus: String,    // pending/paid/refunded
  paymentStatus: String,    // pending/paid
  platformFee: Number,      // 平台费用（10%）
  developerAmount: Number,  // 程序员实收（90%）
  createdAt: Date,
  completedAt: Date
}
```

### reviews（评价表）
```javascript
{
  _id: ObjectId,
  orderId: String,          // 订单ID
  taskId: String,           // 任务ID
  fromUserId: String,       // 评价人ID
  toUserId: String,         // 被评价人ID
  rating: Number,           // 1-5星
  comment: String,          // 评价内容
  tags: Array,              // 标签
  createdAt: Date
}
```

## 快速开始

### 1. 环境准备

- 安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册[微信小程序账号](https://mp.weixin.qq.com/)
- 开通微信小程序云开发

### 2. 项目配置

1. 克隆或下载项目代码
2. 使用微信开发者工具打开项目
3. 修改 `project.config.json` 中的 `appid` 为你的小程序AppID
4. 修改 `app.js` 中的云开发环境ID：

```javascript
wx.cloud.init({
  env: 'your-env-id', // 替换为你的云开发环境ID
  traceUser: true,
})
```

### 3. 云开发配置

#### 3.1 创建云开发环境

1. 在微信开发者工具中，点击"云开发"按钮
2. 开通云开发（首次使用需要开通）
3. 创建环境，获取环境ID

#### 3.2 部署云函数

1. 右键点击 `cloudfunctions/user` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 重复以上步骤，部署所有云函数：
   - user
   - task
   - order
   - payment
   - review

#### 3.3 创建数据库集合

在云开发控制台 -> 数据库中创建以下集合：
- `users`
- `tasks`
- `orders`
- `reviews`

#### 3.4 配置数据库索引

根据 `database/db.collection.json` 文件中的配置，为每个集合创建索引。

在云开发控制台 -> 数据库 -> 对应集合 -> 索引管理中添加索引。

#### 3.5 配置数据库权限

在云开发控制台 -> 数据库 -> 对应集合 -> 权限设置中：
- 设置所有集合的权限为"仅创建者可读写"或"自定义安全规则"
- 参考 `database/permissions.json` 配置权限规则

### 4. 准备图片资源

在 `images/` 目录下准备以下图片（png格式）：
- `task.png` / `task-active.png` - 任务图标
- `mytask.png` / `mytask-active.png` - 我的任务图标
- `order.png` / `order-active.png` - 订单图标
- `profile.png` / `profile-active.png` - 个人中心图标
- `logo.png` - 应用Logo
- `customer.png` / `developer.png` - 用户角色图标
- `search.png`, `filter.png`, `add.png` 等功能图标
- `empty.png` - 空状态图片
- 其他UI所需图标

### 5. 运行项目

1. 在微信开发者工具中点击"编译"
2. 首次运行会进入用户设置页面
3. 选择身份（客户/程序员）并授权登录

## 业务流程

### 任务发布流程
1. 客户填写任务信息
2. AI智能评估参考价格
3. 客户确认最终价格
4. 任务发布成功

### 抢单与交易流程
1. 程序员浏览并抢单
2. 客户确认接单
3. 客户支付押金
4. 程序员开发任务
5. 程序员提交完成
6. 客户验收确认
7. 平台支付90%费用给程序员
8. 客户评价

## 配置说明

### 微信支付配置

要启用支付功能，需要：

1. 申请微信支付商户号
2. 在云开发控制台配置微信支付参数
3. 修改 `cloudfunctions/payment/index.js` 中的支付配置

**注意**：支付功能需要企业资质，个人小程序无法使用。

### AI价格评估

当前使用简化的算法进行价格评估，可以扩展：
- 接入第三方AI服务（如OpenAI、文心一言等）
- 使用机器学习模型
- 基于历史数据的价格预测

## 运营注意事项

### 1. 合规性
- 遵守微信小程序平台规则
- 完善用户协议和隐私政策
- 做好数据安全与隐私保护

### 2. 费用结算
- 平台收取10%服务费
- 程序员实收90%
- 需要配置企业付款到零钱功能

### 3. 风险控制
- 实施押金监管机制
- 建立纠纷处理流程
- 进行程序员资质审核
- 任务内容审核

## 扩展功能建议

- [ ] 消息系统：客户与程序员实时沟通
- [ ] 文件传输：需求文档、代码等文件交换
- [ ] 进度跟踪：分阶段提交与验收
- [ ] 推荐系统：基于技能智能匹配任务
- [ ] 会员体系：高级功能与特权
- [ ] 数据统计：收入、订单统计面板

## 问题排查

### 云函数调用失败
1. 检查云函数是否已上传部署
2. 检查云开发环境ID是否正确
3. 查看云函数日志排查错误

### 数据库操作失败
1. 检查数据库权限配置
2. 检查集合是否已创建
3. 检查索引是否已配置

### 支付功能异常
1. 确认已开通微信支付
2. 检查支付参数配置
3. 查看支付回调日志

## 技术支持

如有问题，请检查：
1. 微信开发者工具控制台日志
2. 云开发控制台云函数日志
3. 云开发控制台数据库日志

## 开源协议

MIT License

## 贡献指南

欢迎提交Issue和Pull Request！

---

**祝您开发顺利！** 🚀

