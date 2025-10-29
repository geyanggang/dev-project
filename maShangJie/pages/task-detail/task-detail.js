// pages/task-detail/task-detail.js
const app = getApp()

Page({
  data: {
    task: null,
    userType: null,
    isMyTask: false,
    isMyGrabbedTask: false,
    statusText: {
      'pending': '待接单',
      'grabbed': '已接单',
      'in-progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    }
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.taskId = id
      this.loadTaskDetail()
    }
    
    this.setData({
      userType: app.globalData.userType
    })
  },

  // 加载任务详情
  async loadTaskDetail() {
    wx.showLoading({ title: '加载中...' })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'task',
        data: {
          action: 'detail',
          taskId: this.taskId
        }
      })

      if (res.result.success) {
        const task = res.result.data
        const userInfo = app.globalData.userInfo
        
        this.setData({
          task,
          isMyTask: task.customerId === userInfo._id,
          isMyGrabbedTask: task.developerId === userInfo._id
        })
      } else {
        wx.showToast({
          title: res.result.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载任务详情失败', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 抢单
  async grabTask() {
    wx.showModal({
      title: '确认接单',
      content: '确定要接这个任务吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'task',
              data: {
                action: 'grab',
                taskId: this.taskId
              }
            })

            if (result.result.success) {
              wx.showToast({
                title: '接单成功',
                icon: 'success'
              })
              this.loadTaskDetail()
            } else {
              wx.showToast({
                title: result.result.message || '接单失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('接单失败', error)
            wx.showToast({
              title: '接单失败',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  // 确认接单并支付
  async confirmGrab() {
    wx.showModal({
      title: '确认接单',
      content: `确认接受该程序员接单并支付¥${this.data.task.finalPrice || this.data.task.aiSuggestedPrice}押金？`,
      success: async (res) => {
        if (res.confirm) {
          await this.createOrderAndPay()
        }
      }
    })
  },

  // 创建订单并支付
  async createOrderAndPay() {
    wx.showLoading({ title: '处理中...' })
    
    try {
      // 创建订单
      const orderRes = await wx.cloud.callFunction({
        name: 'order',
        data: {
          action: 'create',
          taskId: this.taskId
        }
      })

      if (!orderRes.result.success) {
        throw new Error(orderRes.result.message || '创建订单失败')
      }

      const orderId = orderRes.result.data._id

      // 调用支付
      const payRes = await wx.cloud.callFunction({
        name: 'payment',
        data: {
          action: 'createPayment',
          orderId: orderId
        }
      })

      if (payRes.result.success) {
        const paymentParams = payRes.result.data
        
        // 调起微信支付
        await wx.requestPayment({
          ...paymentParams
        })

        wx.showToast({
          title: '支付成功',
          icon: 'success'
        })

        this.loadTaskDetail()
      } else {
        throw new Error(payRes.result.message || '发起支付失败')
      }
    } catch (error) {
      console.error('支付失败', error)
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 提交完成
  async submitComplete() {
    wx.showModal({
      title: '提交完成',
      content: '确认已完成任务并提交验收？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'order',
              data: {
                action: 'submitComplete',
                taskId: this.taskId
              }
            })

            if (result.result.success) {
              wx.showToast({
                title: '提交成功',
                icon: 'success'
              })
              this.loadTaskDetail()
            } else {
              wx.showToast({
                title: result.result.message || '提交失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('提交失败', error)
            wx.showToast({
              title: '提交失败',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  // 确认验收
  async confirmComplete() {
    wx.showModal({
      title: '确认验收',
      content: '确认任务已完成？确认后将支付款项给程序员。',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'order',
              data: {
                action: 'confirmComplete',
                taskId: this.taskId
              }
            })

            if (result.result.success) {
              wx.showToast({
                title: '验收成功',
                icon: 'success'
              })
              
              // 跳转到评价页面
              setTimeout(() => {
                wx.navigateTo({
                  url: `/pages/review/review?taskId=${this.taskId}`
                })
              }, 1500)
            } else {
              wx.showToast({
                title: result.result.message || '验收失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('验收失败', error)
            wx.showToast({
              title: '验收失败',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  // 取消任务
  async cancelTask() {
    wx.showModal({
      title: '取消任务',
      content: '确定要取消这个任务吗？',
      confirmColor: '#f44336',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'task',
              data: {
                action: 'cancel',
                taskId: this.taskId
              }
            })

            if (result.result.success) {
              wx.showToast({
                title: '已取消',
                icon: 'success'
              })
              
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
            } else {
              wx.showToast({
                title: result.result.message || '取消失败',
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
        }
      }
    })
  }
})

