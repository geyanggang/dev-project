// pages/profile/profile.js
const app = getApp()

Page({
  data: {
    userInfo: {},
    showSkillsPopup: false,
    editingSkills: [],
    skillOptions: ['JavaScript', 'Python', 'Java', 'Go', 'React', 'Vue', 'Node.js', 'PHP', 'C++', 'Swift', 'iOS', 'Android', 'WeChat', 'Flutter', 'TypeScript', 'Rust']
  },

  onShow() {
    this.loadUserInfo()
  },

  // 加载用户信息
  async loadUserInfo() {
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      this.setData({ userInfo })
    } else {
      // 从服务器获取最新信息
      await app.getUserInfo()
      this.setData({
        userInfo: app.globalData.userInfo || {}
      })
    }
  },

  // 跳转到我的任务
  goToMyTasks() {
    wx.switchTab({
      url: '/pages/my-tasks/my-tasks'
    })
  },

  // 跳转到我的订单
  goToMyOrders() {
    wx.switchTab({
      url: '/pages/my-orders/my-orders'
    })
  },

  // 跳转到评价列表
  goToReviews() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 切换身份
  async switchRole() {
    const currentRole = this.data.userInfo.userType
    const newRole = currentRole === 'customer' ? 'developer' : 'customer'
    const roleText = newRole === 'customer' ? '客户' : '程序员'

    wx.showModal({
      title: '切换身份',
      content: `确定要切换到${roleText}身份吗？`,
      success: async (res) => {
        if (res.confirm) {
          // 如果切换到程序员且没有技能，先选择技能
          if (newRole === 'developer' && (!this.data.userInfo.skills || this.data.userInfo.skills.length === 0)) {
            this.setData({
              editingSkills: [],
              showSkillsPopup: true
            })
            return
          }

          await this.updateUserRole(newRole)
        }
      }
    })
  },

  // 更新用户身份
  async updateUserRole(newRole) {
    wx.showLoading({ title: '切换中...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'updateProfile',
          userType: newRole
        }
      })

      if (res.result.success) {
        app.globalData.userType = newRole
        wx.setStorageSync('userType', newRole)
        
        wx.showToast({
          title: '切换成功',
          icon: 'success'
        })
        
        this.loadUserInfo()
      } else {
        wx.showToast({
          title: res.result.message || '切换失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('切换失败', error)
      wx.showToast({
        title: '切换失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 编辑技能
  editSkills() {
    this.setData({
      editingSkills: [...(this.data.userInfo.skills || [])],
      showSkillsPopup: true
    })
  },

  // 隐藏技能弹窗
  hideSkillsPopup() {
    this.setData({
      showSkillsPopup: false
    })
  },

  // 阻止冒泡
  stopPropagation() {},

  // 切换编辑的技能
  toggleEditSkill(e) {
    const skill = e.currentTarget.dataset.skill
    let editingSkills = [...this.data.editingSkills]
    
    const index = editingSkills.indexOf(skill)
    if (index > -1) {
      editingSkills.splice(index, 1)
    } else {
      editingSkills.push(skill)
    }
    
    this.setData({ editingSkills })
  },

  // 保存技能
  async saveSkills() {
    if (this.data.editingSkills.length === 0) {
      wx.showToast({
        title: '请至少选择一个技能',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'updateProfile',
          skills: this.data.editingSkills,
          userType: 'developer'
        }
      })

      if (res.result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        
        this.hideSkillsPopup()
        this.loadUserInfo()
      } else {
        wx.showToast({
          title: res.result.message || '保存失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('保存失败', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '程序员接单平台 v1.0.0\n\n极简风格的接单平台，连接客户和程序员。',
      showCancel: false
    })
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服微信: your-wechat-id',
      showCancel: false
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          wx.reLaunch({
            url: '/pages/user-setup/user-setup'
          })
        }
      }
    })
  }
})

