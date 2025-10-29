// utils/cloud.js - 云函数调用封装

/**
 * 调用云函数
 */
const callFunction = async (name, data) => {
  try {
    const res = await wx.cloud.callFunction({
      name,
      data
    })
    
    if (res.result && res.result.success) {
      return {
        success: true,
        data: res.result.data
      }
    } else {
      return {
        success: false,
        message: res.result.message || '操作失败'
      }
    }
  } catch (error) {
    console.error(`云函数${name}调用失败`, error)
    return {
      success: false,
      message: error.message || '网络错误'
    }
  }
}

/**
 * 用户相关
 */
const userApi = {
  // 注册/登录
  register: (userInfo, userType, skills) => {
    return callFunction('user', {
      action: 'register',
      userInfo,
      userType,
      skills
    })
  },
  
  // 获取用户信息
  getProfile: () => {
    return callFunction('user', {
      action: 'getProfile'
    })
  },
  
  // 更新用户信息
  updateProfile: (data) => {
    return callFunction('user', {
      action: 'updateProfile',
      ...data
    })
  }
}

/**
 * 任务相关
 */
const taskApi = {
  // 创建任务
  create: (taskData) => {
    return callFunction('task', {
      action: 'create',
      ...taskData
    })
  },
  
  // 获取任务列表
  list: (filter) => {
    return callFunction('task', {
      action: 'list',
      filter
    })
  },
  
  // 获取任务详情
  detail: (taskId) => {
    return callFunction('task', {
      action: 'detail',
      taskId
    })
  },
  
  // 我发布的任务
  myPublished: () => {
    return callFunction('task', {
      action: 'myPublished'
    })
  },
  
  // 我接的任务
  myGrabbed: () => {
    return callFunction('task', {
      action: 'myGrabbed'
    })
  },
  
  // 抢单
  grab: (taskId) => {
    return callFunction('task', {
      action: 'grab',
      taskId
    })
  },
  
  // 取消任务
  cancel: (taskId) => {
    return callFunction('task', {
      action: 'cancel',
      taskId
    })
  },
  
  // AI价格评估
  aiEstimate: (taskData) => {
    return callFunction('task', {
      action: 'aiEstimate',
      ...taskData
    })
  }
}

/**
 * 订单相关
 */
const orderApi = {
  // 创建订单
  create: (taskId) => {
    return callFunction('order', {
      action: 'create',
      taskId
    })
  },
  
  // 我的订单
  myOrders: () => {
    return callFunction('order', {
      action: 'myOrders'
    })
  },
  
  // 提交完成
  submitComplete: (taskId) => {
    return callFunction('order', {
      action: 'submitComplete',
      taskId
    })
  },
  
  // 确认验收
  confirmComplete: (taskId) => {
    return callFunction('order', {
      action: 'confirmComplete',
      taskId
    })
  }
}

/**
 * 支付相关
 */
const paymentApi = {
  // 创建支付
  createPayment: (orderId) => {
    return callFunction('payment', {
      action: 'createPayment',
      orderId
    })
  }
}

/**
 * 评价相关
 */
const reviewApi = {
  // 创建评价
  create: (reviewData) => {
    return callFunction('review', {
      action: 'create',
      ...reviewData
    })
  },
  
  // 获取用户评价
  getUserReviews: (userId) => {
    return callFunction('review', {
      action: 'getUserReviews',
      userId
    })
  }
}

module.exports = {
  callFunction,
  userApi,
  taskApi,
  orderApi,
  paymentApi,
  reviewApi
}

