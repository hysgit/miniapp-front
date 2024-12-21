const app = getApp()

Page({
  data: {
    exercise: null,
    timer: null,
    seconds: 0,
    isTimerRunning: false,
    count: 0
  },

  onLoad(options) {
    if (options.id) {
      // 直接使用传入的参数构建 exercise 对象
      const exercise = {
        id: parseInt(options.id),
        name: options.name
      };
      
      this.setData({ exercise });
      
      // 设置页面标题为运动项目名称
      wx.setNavigationBarTitle({
        title: exercise.name
      });
    } else {
      wx.showToast({
        title: '数据错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
  },

  // 开始记录
  startRecord() {
    if (!this.data.exercise) {
      wx.showToast({
        title: '数据错误',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: `/pages/exerciseTimer/exerciseTimer?id=${this.data.exercise.id}&name=${this.data.exercise.name}`
    })
  },

  // 查看历史记录
  viewHistory() {
    if (!this.data.exercise) {
      wx.showToast({
        title: '数据错误',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: `/pages/exerciseHistory/exerciseHistory?id=${this.data.exercise.id}&name=${this.data.exercise.name}`
    })
  },

  // 打卡
  checkIn() {
    this.saveRecord({
      type: 'checkin',
      value: 1
    })
  },

  // 开始计时
  startTimer() {
    const timer = setInterval(() => {
      this.setData({
        seconds: this.data.seconds + 1
      })
    }, 1000)

    this.setData({
      timer,
      isTimerRunning: true
    })
  },

  // 结束计时
  stopTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
      this.saveRecord({
        type: 'timer',
        value: this.data.seconds
      })
      this.setData({
        timer: null,
        seconds: 0,
        isTimerRunning: false
      })
    }
  },

  // 输入计数
  onCountInput(e) {
    this.setData({
      count: parseInt(e.detail.value) || 0
    })
  },

  // 保存计数
  saveCount() {
    if (this.data.count <= 0) {
      wx.showToast({
        title: '请输入有效数值',
        icon: 'none'
      })
      return
    }

    this.saveRecord({
      type: 'counter',
      value: this.data.count
    })
  },

  // 保存记录到服务器
  saveRecord(record) {
    wx.request({
      url: `${app.globalData.baseUrl}/exercises/${this.data.exercise.id}/records`,
      method: 'POST',
      data: record,
      success: () => {
        wx.showToast({
          title: '记录成功',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '记录失败',
          icon: 'none'
        })
      }
    })
  }
})
