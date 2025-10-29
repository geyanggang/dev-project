// cloudfunctions/review/index.js
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
        return await createReview(event, wxContext)
      case 'getUserReviews':
        return await getUserReviews(event)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('云函数执行错误', error)
    return { success: false, message: error.message }
  }
}

// 创建评价
async function createReview(event, wxContext) {
  const { taskId, rating, comment, tags } = event
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

    // 检查任务是否已完成
    if (task.status !== 'completed') {
      return { success: false, message: '只能评价已完成的任务' }
    }

    // 确定评价对象
    let toUserId
    if (task.customerId === user._id) {
      // 客户评价程序员
      toUserId = task.developerId
    } else if (task.developerId === user._id) {
      // 程序员评价客户
      toUserId = task.customerId
    } else {
      return { success: false, message: '您不是该任务的参与者' }
    }

    // 检查是否已评价
    const existingReview = await db.collection('reviews').where({
      taskId,
      fromUserId: user._id
    }).get()

    if (existingReview.data.length > 0) {
      return { success: false, message: '您已经评价过了' }
    }

    // 获取订单信息
    const orderResult = await db.collection('orders').where({
      taskId
    }).get()

    const orderId = orderResult.data.length > 0 ? orderResult.data[0]._id : null

    // 创建评价
    const reviewData = {
      orderId,
      taskId,
      fromUserId: user._id,
      toUserId,
      rating: Number(rating),
      comment,
      tags: tags || [],
      createdAt: db.serverDate()
    }

    const result = await db.collection('reviews').add({
      data: reviewData
    })

    // 更新被评价用户的评分
    await updateUserRating(toUserId)

    return {
      success: true,
      data: {
        ...reviewData,
        _id: result._id
      }
    }
  } catch (error) {
    console.error('创建评价失败', error)
    throw error
  }
}

// 获取用户评价列表
async function getUserReviews(event) {
  const { userId } = event

  try {
    const reviewsResult = await db.collection('reviews')
      .where({
        toUserId: userId
      })
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    // 获取评价者信息
    const reviews = await Promise.all(reviewsResult.data.map(async (review) => {
      const fromUserResult = await db.collection('users').doc(review.fromUserId).get()
      const taskResult = await db.collection('tasks').doc(review.taskId).get()
      
      return {
        ...review,
        fromUserInfo: fromUserResult.data,
        taskInfo: taskResult.data
      }
    }))

    return {
      success: true,
      data: reviews
    }
  } catch (error) {
    console.error('获取评价列表失败', error)
    throw error
  }
}

// 更新用户评分
async function updateUserRating(userId) {
  try {
    // 获取该用户的所有评价
    const reviewsResult = await db.collection('reviews')
      .where({
        toUserId: userId
      })
      .get()

    if (reviewsResult.data.length === 0) {
      return
    }

    // 计算平均评分
    const totalRating = reviewsResult.data.reduce((sum, review) => sum + review.rating, 0)
    const avgRating = (totalRating / reviewsResult.data.length).toFixed(1)

    // 更新用户评分
    await db.collection('users').doc(userId).update({
      data: {
        rating: Number(avgRating)
      }
    })
  } catch (error) {
    console.error('更新用户评分失败', error)
    throw error
  }
}

