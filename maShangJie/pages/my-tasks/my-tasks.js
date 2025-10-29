// pages/my-tasks/my-tasks.js
const app = getApp()

Page({
  data: {
    activeTab: 'published',
    tasks: [],
    loading: false,
    statusText: {
      'pending': '待接单',
      'grabbed': '已接单',
      'in-progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    }
  },

  onShow() {
    this.loadTasks()
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      activeTab: tab
    })
    this.loadTasks()
  },

  // 加载任务列表
  async loadTasks() {
    this.setData({ loading: true })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'task',
        data: {
          action: this.data.activeTab === 'published' ? 'myPublished' : 'myGrabbed'
        }
      })

      if (res.result.success) {
        this.setData({
          tasks: res.result.data
        })
      }
    } catch (error) {
      console.error('加载任务失败', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 跳转到任务详情
  goToTaskDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/task-detail/task-detail?id=${id}`
    })
  },

  // 取消任务
  cancelTask(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消任务',
      content: '确定要取消这个任务吗？',
      confirmColor: '#f44336',
      success: async (res) => {
        if (res.confirm) {
          await this.performCancelTask(id)
        }
      }
    })
  },

  async performCancelTask(taskId) {
    wx.showLoading({ title: '处理中...' })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'task',
        data: {
          action: 'cancel',
          taskId
        }
      })

      if (res.result.success) {
        wx.showToast({
          title: '已取消',
          icon: 'success'
        })
        this.loadTasks()
      } else {
        wx.showToast({
          title: res.result.message || '取消失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('取消失败', error)
      wx.showToast({
        title: '取消失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 确认接单并支付
  confirmGrab(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/task-detail/task-detail?id=${id}`
    })
  },

  // 确认验收
  confirmComplete(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/task-detail/task-detail?id=${id}`
    })
  },

  // 提交完成
  submitComplete(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/task-detail/task-detail?id=${id}`
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadTasks().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})

