// pages/publish-task/publish-task.js
const app = getApp()

Page({
  data: {
    formData: {
      title: '',
      description: '',
      budgetRange: {
        min: '',
        max: ''
      },
      deadline: '',
      techStack: [],
      finalPrice: ''
    },
    techOptions: ['JavaScript', 'Python', 'Java', 'Go', 'React', 'Vue', 'Node.js', 'PHP', 'C++', 'Swift', 'iOS', 'Android', 'WeChat', 'Flutter'],
    aiPrice: null,
    today: '',
    submitting: false,
    canEstimate: false
  },

  onLoad() {
    // 设置今天的日期
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    this.setData({ today: dateStr })
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    })
    this.checkCanEstimate()
  },

  // 描述输入
  onDescInput(e) {
    this.setData({
      'formData.description': e.detail.value
    })
    this.checkCanEstimate()
  },

  // 最低预算输入
  onMinBudgetInput(e) {
    this.setData({
      'formData.budgetRange.min': e.detail.value
    })
    this.checkCanEstimate()
  },

  // 最高预算输入
  onMaxBudgetInput(e) {
    this.setData({
      'formData.budgetRange.max': e.detail.value
    })
    this.checkCanEstimate()
  },

  // 截止日期选择
  onDeadlineChange(e) {
    this.setData({
      'formData.deadline': e.detail.value
    })
    this.checkCanEstimate()
  },

  // 切换技术栈
  toggleTech(e) {
    const tech = e.currentTarget.dataset.tech
    let techStack = [...this.data.formData.techStack]
    
    const index = techStack.indexOf(tech)
    if (index > -1) {
      techStack.splice(index, 1)
    } else {
      techStack.push(tech)
    }
    
    this.setData({
      'formData.techStack': techStack
    })
    this.checkCanEstimate()
  },

  // 最终价格输入
  onFinalPriceInput(e) {
    this.setData({
      'formData.finalPrice': e.detail.value
    })
  },

  // 检查是否可以进行AI评估
  checkCanEstimate() {
    const { title, description, budgetRange, techStack } = this.data.formData
    const canEstimate = title && description && budgetRange.min && budgetRange.max && techStack.length > 0
    this.setData({ canEstimate })
  },

  // 获取AI评估
  async getAIEstimate() {
    const { title, description, budgetRange, techStack } = this.data.formData
    
    wx.showLoading({ title: 'AI评估中...' })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'task',
        data: {
          action: 'aiEstimate',
          title,
          description,
          budgetRange,
          techStack
        }
      })

      if (res.result.success) {
        this.setData({
          aiPrice: res.result.data.suggestedPrice,
          'formData.finalPrice': String(res.result.data.suggestedPrice)
        })
        
        wx.showToast({
          title: 'AI评估完成',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.result.message || '评估失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('AI评估失败', error)
      wx.showToast({
        title: 'AI评估失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 验证表单
  validateForm() {
    const { title, description, budgetRange, deadline, techStack, finalPrice } = this.data.formData
    
    if (!title.trim()) {
      wx.showToast({
        title: '请输入任务标题',
        icon: 'none'
      })
      return false
    }
    
    if (!description.trim()) {
      wx.showToast({
        title: '请输入任务描述',
        icon: 'none'
      })
      return false
    }
    
    if (!budgetRange.min || !budgetRange.max) {
      wx.showToast({
        title: '请输入预算范围',
        icon: 'none'
      })
      return false
    }
    
    if (Number(budgetRange.min) >= Number(budgetRange.max)) {
      wx.showToast({
        title: '最低预算应小于最高预算',
        icon: 'none'
      })
      return false
    }
    
    if (!deadline) {
      wx.showToast({
        title: '请选择截止日期',
        icon: 'none'
      })
      return false
    }
    
    if (techStack.length === 0) {
      wx.showToast({
        title: '请至少选择一个技术栈',
        icon: 'none'
      })
      return false
    }
    
    if (!finalPrice) {
      wx.showToast({
        title: '请先进行AI评估或手动输入价格',
        icon: 'none'
      })
      return false
    }
    
    return true
  },

  // 提交任务
  async submitTask() {
    if (!this.validateForm()) {
      return
    }
    
    this.setData({ submitting: true })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'task',
        data: {
          action: 'create',
          ...this.data.formData,
          aiSuggestedPrice: this.data.aiPrice
        }
      })

      if (res.result.success) {
        wx.showToast({
          title: '发布成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: res.result.message || '发布失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('发布失败', error)
      wx.showToast({
        title: '发布失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  }
})

