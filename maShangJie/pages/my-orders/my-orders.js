// pages/my-orders/my-orders.js
const app = getApp()

Page({
  data: {
    orders: [],
    loading: false,
    statusText: {
      'pending': '待接单',
      'grabbed': '已接单',
      'in-progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    },
    depositStatusText: {
      'pending': '待支付',
      'paid': '已支付',
      'refunded': '已退款'
    },
    depositStatusClass: {
      'pending': 'text-pending',
      'paid': 'text-paid',
      'refunded': 'text-refunded'
    },
    paymentStatusText: {
      'pending': '待支付',
      'paid': '已支付'
    },
    paymentStatusClass: {
      'pending': 'text-pending',
      'paid': 'text-paid'
    }
  },

  onShow() {
    this.loadOrders()
  },

  // 加载订单列表
  async loadOrders() {
    this.setData({ loading: true })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'order',
        data: {
          action: 'myOrders'
        }
      })

      if (res.result.success) {
        this.setData({
          orders: res.result.data.map(order => ({
            ...order,
            createdAt: this.formatTime(order.createdAt),
            completedAt: order.completedAt ? this.formatTime(order.completedAt) : null,
            otherUserRole: order.customerId === app.globalData.userInfo._id ? '程序员' : '客户'
          }))
        })
      }
    } catch (error) {
      console.error('加载订单失败', error)
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

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadOrders().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})

