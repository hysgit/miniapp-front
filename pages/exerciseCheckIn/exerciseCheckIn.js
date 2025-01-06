// 获取全局应用实例
const app = getApp()

Page({
  // 页面的初始数据
  data: {
    exerciseId: null,    // 运动项目ID
    exerciseName: ''     // 运动项目名称
  },

  // 页面加载时执行
  onLoad(options) {
    // 如果有传入运动项目ID
    if (options.id) {
      // 设置页面数据
      this.setData({
        exerciseId: options.id,
        exerciseName: options.name
      });

      // 设置页面标题为运动项目名称
      wx.setNavigationBarTitle({
        title: options.name
      });
    }
  },

  // 处理打卡按钮点击事件
  checkIn() {
    // 显示确认对话框
    wx.showModal({
      title: '运动打卡',
      content: '确认要打卡吗？',
      cancelText: '放弃',
      confirmText: '保存',
      success: (res) => {
        // 用户点击了确认按钮
        if (res.confirm) {
          this.saveCheckIn();  // 调用保存打卡记录的方法
        }
      }
    });
  },

  // 保存打卡记录到服务器
  saveCheckIn() {
    // 显示加载提示
    wx.showLoading({
      title: '保存中...',
    });

    // 发送请求到服务器
    wx.request({
      url: `${app.globalData.baseUrl}/exercise/record/add`,  // API接口地址
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'  // 设置请求头，使用表单格式
      },
      data: {
        exerciseId: parseInt(this.data.exerciseId),  // 确保exerciseId是整数类型
        value: 1  // 打卡记录值设为1，表示完成一次打卡
      },
      // 请求成功的回调
      success: (res) => {
        if (res.data.code === 0) {
          // 如果是id=2的打卡型运动项目，处理定时器
          if (parseInt(this.data.exerciseId) === 2) {
            // 停止id=1的定时器并创建新记录
            wx.request({
              url: `${app.globalData.baseUrl}/timer/timer-record/stop-and-create`,
              method: 'POST',
              header: {
                'content-type': 'application/json'
              },
              data: {
                timerId: 1
              },
              success: (timerRes) => {
                wx.hideLoading();
                if (timerRes.data.code === 0) {
                  wx.showToast({
                    title: '打卡成功',
                    icon: 'success'
                  });
                } else {
                  wx.showToast({
                    title: timerRes.data.message || '定时器操作失败',
                    icon: 'none'
                  });
                }
              },
              fail: () => {
                wx.hideLoading();
                wx.showToast({
                  title: '定时器操作失败',
                  icon: 'none'
                });
              }
            });
          } else {
            wx.hideLoading();
            wx.showToast({
              title: '打卡成功',
              icon: 'success'
            });
          }
        } else {
          wx.hideLoading();
          wx.showToast({
            title: res.data.message || '打卡失败',
            icon: 'none'
          });
        }
      },
      // 请求失败的回调
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 查看历史记录
  viewHistory() {
    wx.navigateTo({
      url: `/pages/exerciseCheckIn/exerciseCheckInHistory?id=${this.data.exerciseId}&name=${this.data.exerciseName}`
    });
  }
});
