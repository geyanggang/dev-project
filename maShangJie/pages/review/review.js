// pages/review/review.js
const app = getApp()

Page({
  data: {
    taskId: '',
    taskInfo: {},
    otherUserInfo: {},
    rating: 5,
    comment: '',
    selectedTags: [],
    quickTags: ['服务态度好', '响应及时', '技术过硬', '沟通顺畅', '按时交付', '超出预期', '值得推荐'],
    ratingText: {
      1: '非常不满意',
      2: '不满意',
      3: '一般',
      4: '满意',
      5: '非常满意'
    },
    submitting: false
  },

  onLoad(options) {
    if (options.taskId) {
      this.setData({
        taskId: options.taskId
      })
      this.loadTaskInfo()
    }
  },

  // 加载任务信息
  async loadTaskInfo() {
    wx.showLoading({ title: '加载中...' })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'task',
        data: {
          action: 'detail',
          taskId: this.data.taskId
        }
      })

      if (res.result.success) {
        const task = res.result.data
        const userInfo = app.globalData.userInfo
        
        // 判断要评价的是客户还是程序员
        const isCustomer = task.customerId === userInfo._id
        const otherUserInfo = isCustomer ? {
          ...task.developerInfo,
          role: '程序员'
        } : {
          ...task.customerInfo,
          role: '客户'
        }

        this.setData({
          taskInfo: {
            title: task.title,
            amount: task.finalPrice || task.aiSuggestedPrice
          },
          otherUserInfo
        })
      }
    } catch (error) {
      console.error('加载任务信息失败', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 设置评分
  setRating(e) {
    const rating = e.currentTarget.dataset.rating
    this.setData({ rating })
  },

  // 评价输入
  onCommentInput(e) {
    this.setData({
      comment: e.detail.value
    })
  },

  // 切换标签
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag
    let selectedTags = [...this.data.selectedTags]
    
    const index = selectedTags.indexOf(tag)
    if (index > -1) {
      selectedTags.splice(index, 1)
    } else {
      selectedTags.push(tag)
    }
    
    this.setData({ selectedTags })
  },

  // 提交评价
  async submitReview() {
    if (!this.data.comment.trim()) {
      wx.showToast({
        title: '请输入评价内容',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'review',
        data: {
          action: 'create',
          taskId: this.data.taskId,
          rating: this.data.rating,
          comment: this.data.comment,
          tags: this.data.selectedTags
        }
      })

      if (res.result.success) {
        wx.showToast({
          title: '评价成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: res.result.message || '评价失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('提交评价失败', error)
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  }
})

