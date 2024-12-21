const app = getApp()

Page({
  data: {
    types: [
      { id: 'checkin', name: '打卡型' },
      { id: 'timer', name: '计时型' },
      { id: 'counter', name: '计数型' }
    ],
    name: '',
    selectedType: 'checkin'
  },

  // 输入名称
  onNameInput(e) {
    this.setData({
      name: e.detail.value
    })
  },

  // 选择类型
  onTypeChange(e) {
    this.setData({
      selectedType: e.detail.value
    })
  },

  // 创建运动项目
  createExercise() {
    const name = this.data.name.trim()
    if (!name) {
      wx.showToast({
        title: '请输入运动名称',
        icon: 'none'
      })
      return
    }

    wx.request({
      url: `${app.globalData.baseUrl}/exercise/add`,
      method: 'POST',
      data: {
        name: name,
        excetype: this.data.selectedType
      },
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({
            title: '创建成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.data.message || '创建失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '创建失败',
          icon: 'none'
        })
      }
    })
  }
})
