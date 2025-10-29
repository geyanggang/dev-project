// pages/index/index.js
const app = getApp()

Page({
  data: {
    tasks: [],
    loading: false,
    searchText: '',
    activeFilter: 'all',
    showFilter: false,
    maxPrice: 10000,
    selectedTechs: [],
    techOptions: ['JavaScript', 'Python', 'Java', 'Go', 'React', 'Vue', 'Node.js', 'PHP', 'C++', 'Swift'],
    userType: null,
    statusText: {
      'pending': '待接单',
      'grabbed': '已接单',
      'in-progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    }
  },

  onLoad() {
    this.checkUserSetup()
  },

  onShow() {
    this.setData({
      userType: app.globalData.userType
    })
    this.loadTasks()
  },

  // 检查用户是否已设置身份
  async checkUserSetup() {
    const userInfo = app.globalData.userInfo
    if (!userInfo || !userInfo.userType) {
      wx.redirectTo({
        url: '/pages/user-setup/user-setup'
      })
    }
  },

  // 加载任务列表
  async loadTasks() {
    this.setData({ loading: true })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'task',
        data: {
          action: 'list',
          filter: {
            status: this.data.activeFilter === 'all' ? null : this.data.activeFilter,
            maxPrice: this.data.maxPrice,
            techStack: this.data.selectedTechs.length > 0 ? this.data.selectedTechs : null,
            searchText: this.data.searchText
          }
        }
      })

      if (res.result.success) {
        this.setData({
          tasks: res.result.data.map(task => ({
            ...task,
            createdAt: this.formatTime(task.createdAt)
          }))
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

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchText: e.detail.value
    })
    // 防抖搜索
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.loadTasks()
    }, 500)
  },

  // 筛选切换
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({
      activeFilter: filter
    })
    this.loadTasks()
  },

  // 显示筛选弹窗
  showFilterPopup() {
    this.setData({ showFilter: true })
  },

  // 隐藏筛选弹窗
  hideFilterPopup() {
    this.setData({ showFilter: false })
  },

  // 阻止冒泡
  stopPropagation() {},

  // 价格变化
  onPriceChange(e) {
    this.setData({
      maxPrice: e.detail.value
    })
  },

  // 切换技术栈
  toggleTech(e) {
    const tech = e.currentTarget.dataset.tech
    let selectedTechs = [...this.data.selectedTechs]
    
    const index = selectedTechs.indexOf(tech)
    if (index > -1) {
      selectedTechs.splice(index, 1)
    } else {
      selectedTechs.push(tech)
    }
    
    this.setData({ selectedTechs })
  },

  // 重置筛选
  resetFilter() {
    this.setData({
      maxPrice: 10000,
      selectedTechs: []
    })
  },

  // 应用筛选
  applyFilter() {
    this.hideFilterPopup()
    this.loadTasks()
  },

  // 跳转到任务详情
  goToTaskDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/task-detail/task-detail?id=${id}`
    })
  },

  // 跳转到发布页面
  goToPublish() {
    wx.navigateTo({
      url: '/pages/publish-task/publish-task'
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    // 1分钟内
    if (diff < 60000) {
      return '刚刚'
    }
    // 1小时内
    if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前'
    }
    // 1天内
    if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前'
    }
    // 7天内
    if (diff < 604800000) {
      return Math.floor(diff / 86400000) + '天前'
    }
    
    // 超过7天显示具体日期
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    
    if (year === now.getFullYear()) {
      return `${month}-${day}`
    }
    return `${year}-${month}-${day}`
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadTasks().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})

