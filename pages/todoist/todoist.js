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
              // 格式化时间
              item.createdAt = formatTime.formatDate(new Date(item.createTime))
              if (item.dueDate) {
                item.dueDate = formatTime.formatDate(new Date(item.dueDate))
              }
              return item
            })

          const doneList = res.data.data
            .filter(item => item.status === 1)
            .map(item => {
              // 格式化时间
              item.createdAt = formatTime.formatDate(new Date(item.createTime))
              if (item.dueDate) {
                item.dueDate = formatTime.formatDate(new Date(item.dueDate))
              }
              if (item.completedTime) {
                item.completedTime = formatTime.formatDate(new Date(item.completedTime))
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