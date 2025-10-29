// pages/user-setup/user-setup.js
const app = getApp()

Page({
  data: {
    selectedRole: '',
    selectedSkills: [],
    skillOptions: ['JavaScript', 'Python', 'Java', 'Go', 'React', 'Vue', 'Node.js', 'PHP', 'C++', 'Swift', 'iOS', 'Android', 'WeChat', 'Flutter', 'TypeScript', 'Rust']
  },

  // 选择角色
  selectRole(e) {
    const role = e.currentTarget.dataset.role
    this.setData({
      selectedRole: role,
      selectedSkills: role === 'customer' ? [] : this.data.selectedSkills
    })
  },

  // 切换技能
  toggleSkill(e) {
    const skill = e.currentTarget.dataset.skill
    let selectedSkills = [...this.data.selectedSkills]
    
    const index = selectedSkills.indexOf(skill)
    if (index > -1) {
      selectedSkills.splice(index, 1)
    } else {
      selectedSkills.push(skill)
    }
    
    this.setData({ selectedSkills })
  },

  // 获取用户信息
  async onGetUserInfo(e) {
    if (e.detail.errMsg !== 'getUserInfo:ok') {
      wx.showToast({
        title: '需要授权才能继续',
        icon: 'none'
      })
      return
    }

    const { selectedRole, selectedSkills } = this.data
    
    // 验证程序员必须选择技能
    if (selectedRole === 'developer' && selectedSkills.length === 0) {
      wx.showToast({
        title: '请至少选择一个技能',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '注册中...' })

    try {
      // 调用云函数注册用户
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'register',
          userInfo: e.detail.userInfo,
          userType: selectedRole,
          skills: selectedRole === 'developer' ? selectedSkills : []
        }
      })

      if (res.result.success) {
        // 更新全局用户信息
        app.globalData.userInfo = res.result.data
        app.globalData.userType = selectedRole
        
        wx.setStorageSync('userInfo', res.result.data)
        wx.setStorageSync('userType', selectedRole)

        wx.showToast({
          title: '注册成功',
          icon: 'success'
        })

        // 跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        wx.showToast({
          title: res.result.message || '注册失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('注册失败', error)
      wx.showToast({
        title: '注册失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 显示用户协议
  showAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '这里是用户协议内容...',
      showCancel: false
    })
  },

  // 显示隐私政策
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '这里是隐私政策内容...',
      showCancel: false
    })
  }
})

