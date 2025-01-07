const app = getApp()
const formatTime = require('../../utils/dateUtil.js')

Page({
  data: {
    activeTab: 'todo',
    todoList: [],
    doneList: []
  },

  onShow() {
    this.loadTodoList()
  },

  loadTodoList() {
    wx.request({
      url: `${app.globalData.baseUrl}/todoItem/list`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          const todoList = res.data.data
            .filter(item => item.status === 0)
            .map(item => {
              // 格式化时间，包含时分
              item.createdAt = formatTime.formatDate(formatTime.parseDate(item.createTime), 'yyyy-MM-dd HH:mm')
              if (item.dueDate) {
                item.dueDate = formatTime.formatDate(formatTime.parseDate(item.dueDate), 'yyyy-MM-dd HH:mm')
                item.dueTimeColor = this.calculateTimeColor(item.createTime, item.dueDate)
              }
              return item
            })

          const doneList = res.data.data
            .filter(item => item.status === 1)
            .map(item => {
              // 格式化时间，包含时分
              item.createdAt = formatTime.formatDate(formatTime.parseDate(item.createTime), 'yyyy-MM-dd HH:mm')
              if (item.dueDate) {
                item.dueDate = formatTime.formatDate(formatTime.parseDate(item.dueDate), 'yyyy-MM-dd HH:mm')
              }
              if (item.completedTime) {
                item.completedTime = formatTime.formatDate(formatTime.parseDate(item.completedTime), 'yyyy-MM-dd HH:mm')
              }
              return item
            })

          this.setData({
            todoList,
            doneList
          })
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    })
  },

  calculateTimeColor(createTime, dueDate) {
    if (!createTime || !dueDate) return '';
    
    // 使用dateUtil来解析日期
    const now = new Date('2025-01-07T15:37:17+08:00');
    const startTime = formatTime.parseDate(createTime);
    const endTime = formatTime.parseDate(dueDate);
    
    if (!startTime || !endTime) return '';
    
    // If current time is before start time or after end time, return edge colors
    if (now < startTime) return 'rgb(0, 255, 0)';
    if (now > endTime) return 'rgb(255, 0, 0)';
    
    // Calculate progress between start and end time
    const totalDuration = endTime - startTime;
    const currentProgress = now - startTime;
    const ratio = currentProgress / totalDuration;
    
    // Calculate RGB values for gradient from green to red
    const red = Math.round(255 * ratio);
    const green = Math.round(255 * (1 - ratio));
    
    return `rgb(${red}, ${green}, 0)`;
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      activeTab: tab
    })
  },

  toggleTodoStatus(e) {
    const id = e.currentTarget.dataset.id
    wx.request({
      url: `${app.globalData.baseUrl}/todoItem/${id}/toggle`,
      method: 'POST',
      success: (res) => {
        if (res.data.code === 0) {
          this.loadTodoList()
        } else {
          wx.showToast({
            title: res.data.message || '操作失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      }
    })
  },

  editTodoItem(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/todoItem/todoItem?id=${id}`
    })
  },

  showAddTodoModal() {
    wx.navigateTo({
      url: '/pages/todoItem/todoItem'
    })
  }
})