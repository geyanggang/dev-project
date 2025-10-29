// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'your-env-id',
        traceUser: true,
      })
    }

    // 检查登录状态
    this.checkLoginStatus()
  },

  globalData: {
    userInfo: null,
    userType: null, // 'customer' 或 'developer'
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    const userType = wx.getStorageSync('userType')
    
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.userType = userType
    }
  },

  // 登录
  async login() {
    try {
      // 获取微信登录凭证
      const { code } = await wx.cloud.callFunction({
        name: 'login',
        data: {}
      })

      return code
    } catch (error) {
      console.error('登录失败', error)
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
      throw error
    }
  },

  // 获取用户信息
  async getUserInfo() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getProfile'
        }
      })
      
      if (result.result.success) {
        this.globalData.userInfo = result.result.data
        this.globalData.userType = result.result.data.userType
        
        wx.setStorageSync('userInfo', result.result.data)
        wx.setStorageSync('userType', result.result.data.userType)
        
        return result.result.data
      }
      return null
    } catch (error) {
      console.error('获取用户信息失败', error)
      return null
    }
  },

  // 更新用户信息
  updateUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },

  // 退出登录
  logout() {
    this.globalData.userInfo = null
    this.globalData.userType = null
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('userType')
  }
})

