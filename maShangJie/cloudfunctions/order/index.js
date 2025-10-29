// cloudfunctions/order/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 平台费用比例
const PLATFORM_FEE_RATE = 0.10 // 10%

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action } = event

  try {
    switch (action) {
      case 'create':
        return await createOrder(event, wxContext)
      case 'myOrders':
        return await getMyOrders(wxContext)
      case 'submitComplete':
        return await submitComplete(event, wxContext)
      case 'confirmComplete':
        return await confirmComplete(event, wxContext)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('云函数执行错误', error)
    return { success: false, message: error.message }
  }
}

// 创建订单
async function createOrder(event, wxContext) {
  const { taskId } = event
  const openId = wxContext.OPENID

  try {
    // 获取用户信息
    const userResult = await db.collection('users').where({ openId }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const user = userResult.data[0]

    // 获取任务信息
    const taskResult = await db.collection('tasks').doc(taskId).get()
    if (!taskResult.data) {
      return { success: false, message: '任务不存在' }
    }

    const task = taskResult.data

    // 检查是否为任务发布者
    if (task.customerId !== user._id) {
      return { success: false, message: '只有任务发布者可以创建订单' }
    }

    // 检查任务状态
    if (task.status !== 'grabbed') {
      return { success: false, message: '任务状态不正确' }
    }

    // 检查是否已存在订单
    const existingOrder = await db.collection('orders').where({
      taskId
    }).get()

    if (existingOrder.data.length > 0) {
      return { success: false, message: '订单已存在' }
    }

    // 计算金额
    const amount = task.finalPrice || task.aiSuggestedPrice
    const platformFee = Math.round(amount * PLATFORM_FEE_RATE)
    const developerAmount = amount - platformFee

    // 创建订单
    const orderData = {
      taskId,
      customerId: task.customerId,
      developerId: task.developerId,
      amount,
      platformFee,
      developerAmount,
      depositStatus: 'pending',
      paymentStatus: 'pending',
      createdAt: db.serverDate(),
      completedAt: null
    }

    const result = await db.collection('orders').add({
      data: orderData
    })

    return {
      success: true,
      data: {
        ...orderData,
        _id: result._id
      }
    }
  } catch (error) {
    console.error('创建订单失败', error)
    throw error
  }
}

// 获取我的订单
async function getMyOrders(wxContext) {
  const openId = wxContext.OPENID

  try {
    // 获取用户ID
    const userResult = await db.collection('users').where({ openId }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const userId = userResult.data[0]._id

    // 获取订单列表（作为客户或程序员）
    const ordersResult = await db.collection('orders')
      .where(_.or([
        { customerId: userId },
        { developerId: userId }
      ]))
      .orderBy('createdAt', 'desc')
      .get()

    // 获取相关任务和用户信息
    const orders = await Promise.all(ordersResult.data.map(async (order) => {
      const taskResult = await db.collection('tasks').doc(order.taskId).get()
      
      // 获取对方用户信息
      const otherUserId = order.customerId === userId ? order.developerId : order.customerId
      const otherUserResult = await db.collection('users').doc(otherUserId).get()

      return {
        ...order,
        taskInfo: taskResult.data,
        otherUserInfo: otherUserResult.data
      }
    }))

    return {
      success: true,
      data: orders
    }
  } catch (error) {
    console.error('获取订单列表失败', error)
    throw error
  }
}

// 程序员提交完成
async function submitComplete(event, wxContext) {
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

    // 检查是否为接单程序员
    if (task.developerId !== userId) {
      return { success: false, message: '只有接单程序员可以提交完成' }
    }

    // 更新任务状态为待验收
    await db.collection('tasks').doc(taskId).update({
      data: {
        status: 'in-progress',
        updatedAt: db.serverDate()
      }
    })

    // TODO: 发送通知给客户

    return {
      success: true,
      message: '已提交完成，等待客户验收'
    }
  } catch (error) {
    console.error('提交完成失败', error)
    throw error
  }
}

// 客户确认验收
async function confirmComplete(event, wxContext) {
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

    // 检查是否为任务发布者
    if (task.customerId !== userId) {
      return { success: false, message: '只有任务发布者可以确认验收' }
    }

    // 更新任务状态
    await db.collection('tasks').doc(taskId).update({
      data: {
        status: 'completed',
        updatedAt: db.serverDate()
      }
    })

    // 更新订单状态
    await db.collection('orders').where({
      taskId
    }).update({
      data: {
        paymentStatus: 'paid',
        completedAt: db.serverDate()
      }
    })

    // 更新程序员完成订单数
    await db.collection('users').doc(task.developerId).update({
      data: {
        completedOrders: _.inc(1)
      }
    })

    // TODO: 实际支付给程序员（需要对接微信支付企业付款到零钱）

    return {
      success: true,
      message: '验收成功，款项已支付给程序员'
    }
  } catch (error) {
    console.error('确认验收失败', error)
    throw error
  }
}

