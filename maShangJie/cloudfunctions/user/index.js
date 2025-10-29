// cloudfunctions/user/index.js
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
      case 'register':
        return await register(event, wxContext)
      case 'getProfile':
        return await getProfile(wxContext)
      case 'updateProfile':
        return await updateProfile(event, wxContext)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('云函数执行错误', error)
    return { success: false, message: error.message }
  }
}

// 用户注册/登录
async function register(event, wxContext) {
  const { userInfo, userType, skills } = event
  const openId = wxContext.OPENID

  try {
    // 检查用户是否已存在
    const existUser = await db.collection('users').where({
      openId
    }).get()

    let userData = {
      openId,
      avatar: userInfo.avatarUrl,
      nickname: userInfo.nickName,
      userType,
      skills: userType === 'developer' ? skills : [],
      rating: 5.0,
      completedOrders: 0,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }

    if (existUser.data.length > 0) {
      // 用户已存在，更新信息
      await db.collection('users').doc(existUser.data[0]._id).update({
        data: {
          ...userData,
          createdAt: _.remove()
        }
      })
      
      return {
        success: true,
        data: {
          ...userData,
          _id: existUser.data[0]._id
        }
      }
    } else {
      // 新用户，创建记录
      const result = await db.collection('users').add({
        data: userData
      })

      return {
        success: true,
        data: {
          ...userData,
          _id: result._id
        }
      }
    }
  } catch (error) {
    console.error('注册失败', error)
    throw error
  }
}

// 获取用户信息
async function getProfile(wxContext) {
  const openId = wxContext.OPENID

  try {
    const result = await db.collection('users').where({
      openId
    }).get()

    if (result.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    return {
      success: true,
      data: result.data[0]
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    throw error
  }
}

// 更新用户信息
async function updateProfile(event, wxContext) {
  const { userType, skills, avatar, nickname } = event
  const openId = wxContext.OPENID

  try {
    // 获取用户ID
    const userResult = await db.collection('users').where({
      openId
    }).get()

    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const userId = userResult.data[0]._id

    // 构建更新数据
    let updateData = {
      updatedAt: db.serverDate()
    }

    if (userType !== undefined) {
      updateData.userType = userType
    }
    if (skills !== undefined) {
      updateData.skills = skills
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar
    }
    if (nickname !== undefined) {
      updateData.nickname = nickname
    }

    // 更新用户信息
    await db.collection('users').doc(userId).update({
      data: updateData
    })

    // 获取更新后的用户信息
    const updatedUser = await db.collection('users').doc(userId).get()

    return {
      success: true,
      data: updatedUser.data
    }
  } catch (error) {
    console.error('更新用户信息失败', error)
    throw error
  }
}

