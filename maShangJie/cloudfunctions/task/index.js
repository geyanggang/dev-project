// cloudfunctions/task/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action } = event

  try {
    switch (action) {
      case 'create':
        return await createTask(event, wxContext)
      case 'list':
        return await listTasks(event)
      case 'detail':
        return await getTaskDetail(event)
      case 'myPublished':
        return await getMyPublishedTasks(wxContext)
      case 'myGrabbed':
        return await getMyGrabbedTasks(wxContext)
      case 'grab':
        return await grabTask(event, wxContext)
      case 'cancel':
        return await cancelTask(event, wxContext)
      case 'aiEstimate':
        return await aiEstimatePrice(event)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('云函数执行错误', error)
    return { success: false, message: error.message }
  }
}

// 创建任务
async function createTask(event, wxContext) {
  const { title, description, budgetRange, deadline, techStack, finalPrice, aiSuggestedPrice } = event
  const openId = wxContext.OPENID

  try {
    // 获取用户信息
    const userResult = await db.collection('users').where({ openId }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const user = userResult.data[0]

    // 创建任务
    const taskData = {
      customerId: user._id,
      title,
      description,
      budgetRange,
      deadline,
      techStack,
      finalPrice: Number(finalPrice),
      aiSuggestedPrice: Number(aiSuggestedPrice),
      status: 'pending',
      developerId: null,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }

    const result = await db.collection('tasks').add({
      data: taskData
    })

    return {
      success: true,
      data: {
        ...taskData,
        _id: result._id
      }
    }
  } catch (error) {
    console.error('创建任务失败', error)
    throw error
  }
}

// 获取任务列表
async function listTasks(event) {
  const { filter } = event
  
  try {
    let query = db.collection('tasks')

    // 应用筛选条件
    let whereCondition = {}
    
    if (filter) {
      if (filter.status) {
        whereCondition.status = filter.status
      }
      
      if (filter.maxPrice) {
        whereCondition.finalPrice = _.lte(filter.maxPrice)
      }
      
      if (filter.techStack && filter.techStack.length > 0) {
        whereCondition.techStack = _.in(filter.techStack)
      }
    }

    // 只显示待接单和进行中的任务
    if (!filter || !filter.status) {
      whereCondition.status = _.in(['pending', 'grabbed', 'in-progress'])
    }

    query = query.where(whereCondition)

    // 排序：最新发布的在前
    query = query.orderBy('createdAt', 'desc')

    // 限制返回数量
    query = query.limit(50)

    const result = await query.get()

    // 获取客户信息
    const tasks = await Promise.all(result.data.map(async (task) => {
      const customerInfo = await db.collection('users').doc(task.customerId).get()
      return {
        ...task,
        customerInfo: customerInfo.data
      }
    }))

    return {
      success: true,
      data: tasks
    }
  } catch (error) {
    console.error('获取任务列表失败', error)
    throw error
  }
}

// 获取任务详情
async function getTaskDetail(event) {
  const { taskId } = event

  try {
    const taskResult = await db.collection('tasks').doc(taskId).get()
    
    if (!taskResult.data) {
      return { success: false, message: '任务不存在' }
    }

    const task = taskResult.data

    // 获取客户信息
    const customerInfo = await db.collection('users').doc(task.customerId).get()
    
    // 获取程序员信息（如果有）
    let developerInfo = null
    if (task.developerId) {
      const devResult = await db.collection('users').doc(task.developerId).get()
      developerInfo = devResult.data
    }

    return {
      success: true,
      data: {
        ...task,
        customerInfo: customerInfo.data,
        developerInfo
      }
    }
  } catch (error) {
    console.error('获取任务详情失败', error)
    throw error
  }
}

// 获取我发布的任务
async function getMyPublishedTasks(wxContext) {
  const openId = wxContext.OPENID

  try {
    // 获取用户ID
    const userResult = await db.collection('users').where({ openId }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const userId = userResult.data[0]._id

    // 获取任务列表
    const tasksResult = await db.collection('tasks')
      .where({ customerId: userId })
      .orderBy('createdAt', 'desc')
      .get()

    // 获取程序员信息
    const tasks = await Promise.all(tasksResult.data.map(async (task) => {
      let otherUserInfo = null
      if (task.developerId) {
        const devResult = await db.collection('users').doc(task.developerId).get()
        otherUserInfo = devResult.data
      }
      return {
        ...task,
        otherUserInfo
      }
    }))

    return {
      success: true,
      data: tasks
    }
  } catch (error) {
    console.error('获取我发布的任务失败', error)
    throw error
  }
}

// 获取我接的任务
async function getMyGrabbedTasks(wxContext) {
  const openId = wxContext.OPENID

  try {
    // 获取用户ID
    const userResult = await db.collection('users').where({ openId }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const userId = userResult.data[0]._id

    // 获取任务列表
    const tasksResult = await db.collection('tasks')
      .where({ developerId: userId })
      .orderBy('createdAt', 'desc')
      .get()

    // 获取客户信息
    const tasks = await Promise.all(tasksResult.data.map(async (task) => {
      const customerResult = await db.collection('users').doc(task.customerId).get()
      return {
        ...task,
        otherUserInfo: customerResult.data
      }
    }))

    return {
      success: true,
      data: tasks
    }
  } catch (error) {
    console.error('获取我接的任务失败', error)
    throw error
  }
}

// 抢单
async function grabTask(event, wxContext) {
  const { taskId } = event
  const openId = wxContext.OPENID

  try {
    // 获取用户信息
    const userResult = await db.collection('users').where({ openId }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const user = userResult.data[0]

    // 检查用户是否为程序员
    if (user.userType !== 'developer') {
      return { success: false, message: '只有程序员可以接单' }
    }

    // 获取任务信息
    const taskResult = await db.collection('tasks').doc(taskId).get()
    if (!taskResult.data) {
      return { success: false, message: '任务不存在' }
    }

    const task = taskResult.data

    // 检查任务状态
    if (task.status !== 'pending') {
      return { success: false, message: '该任务已被接单' }
    }

    // 不能接自己发布的任务
    if (task.customerId === user._id) {
      return { success: false, message: '不能接自己发布的任务' }
    }

    // 更新任务状态
    await db.collection('tasks').doc(taskId).update({
      data: {
        developerId: user._id,
        status: 'grabbed',
        updatedAt: db.serverDate()
      }
    })

    return {
      success: true,
      message: '接单成功，等待客户确认'
    }
  } catch (error) {
    console.error('抢单失败', error)
    throw error
  }
}

// 取消任务
async function cancelTask(event, wxContext) {
  const { taskId } = event
  const openId = wxContext.OPENID

  try {
    // 获取用户信息
    const userResult = await db.collection('users').where({ openId }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const userId = userResult.data[0]._id

    // 获取任务信息
    const taskResult = await db.collection('tasks').doc(taskId).get()
    if (!taskResult.data) {
      return { success: false, message: '任务不存在' }
    }

    const task = taskResult.data

    // 只有任务发布者可以取消
    if (task.customerId !== userId) {
      return { success: false, message: '只有任务发布者可以取消任务' }
    }

    // 只有待接单状态可以取消
    if (task.status !== 'pending') {
      return { success: false, message: '只能取消待接单的任务' }
    }

    // 更新任务状态
    await db.collection('tasks').doc(taskId).update({
      data: {
        status: 'cancelled',
        updatedAt: db.serverDate()
      }
    })

    return {
      success: true,
      message: '任务已取消'
    }
  } catch (error) {
    console.error('取消任务失败', error)
    throw error
  }
}

// AI价格评估（简化版本）
async function aiEstimatePrice(event) {
  const { title, description, budgetRange, techStack } = event

  try {
    // 这里是简化的AI评估逻辑
    // 实际应用中可以接入第三方AI服务或使用更复杂的算法

    let basePrice = (Number(budgetRange.min) + Number(budgetRange.max)) / 2

    // 根据技术栈数量调整
    const techFactor = 1 + (techStack.length * 0.05)
    
    // 根据描述长度调整（复杂度）
    const descriptionFactor = 1 + (Math.min(description.length / 1000, 0.3))

    let suggestedPrice = Math.round(basePrice * techFactor * descriptionFactor)

    // 确保在预算范围内
    suggestedPrice = Math.max(Number(budgetRange.min), Math.min(suggestedPrice, Number(budgetRange.max)))

    return {
      success: true,
      data: {
        suggestedPrice,
        factors: {
          basePrice,
          techFactor,
          descriptionFactor
        }
      }
    }
  } catch (error) {
    console.error('AI评估失败', error)
    throw error
  }
}

