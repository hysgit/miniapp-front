// 获取全局应用实例
const app = getApp()

Page({
  // 页面的初始数据
  data: {
    exerciseId: null,        // 运动项目ID
    exerciseName: '',        // 运动项目名称
    isRunning: false,        // 计时器是否正在运行
    isPaused: false,         // 计时器是否暂停
    startTime: 0,            // 开始时间戳
    elapsedTime: 0,         // 已经过的时间（毫秒）
    timer: null,             // 计时器
    minutes: '00',           // 分钟
    seconds: '00',           // 秒
    milliseconds: '000'      // 毫秒
  },

  // 页面加载时执行
  onLoad(options) {
    // 如果有传入运动项目ID和名称
    if (options.id) {
      this.setData({
        exerciseId: options.id,
        exerciseName: options.name
      });

      // 设置页面标题
      wx.setNavigationBarTitle({
        title: options.name
      });
    }
  },

  // 页面卸载时执行
  onUnload() {
    // 如果计时器正在运行，清除计时器
    this.clearTimer();
  },

  // 开始计时
  startTimer() {
    if (!this.data.isRunning) {
      const now = Date.now();
      // 确保在启动计时器时记录开始时间
      if (this.data.elapsedTime === 0) {
        this.setData({
          startTime: now
        });
      }
      
      // 启动计时器，每1毫秒更新一次
      this.setData({
        timer: setInterval(() => {
          const currentTime = Date.now();
          // 使用开始时间计算经过时间
          const elapsedTime = currentTime - this.data.startTime;
          
          // 更新显示时间
          this.updateTimerDisplay(elapsedTime);
          
          this.setData({
            elapsedTime: elapsedTime
          });
        }, 1)
      });

      // 更新计时器状态为运行中
      this.setData({
        isRunning: true,
        isPaused: false
      });
    }
  },

  // 停止计时
  stopTimer() {
    // 清除计时器
    this.clearTimer();
    // 更新状态为已暂停
    this.setData({
      isRunning: false,
      isPaused: true
    });
  },

  // 显示结束确认对话框
  showEndConfirm() {
    // 先停止计时器
    this.clearTimer();
    const currentTime = this.data.elapsedTime;
    
    // 显示确认对话框
    wx.showModal({
      title: '运动结束',
      content: '是否保存本次运动记录？',
      confirmText: '保存',
      cancelText: '不保存',
      success: (res) => {
        if (res.confirm) {
          // 用户点击保存
          this.saveRecord(currentTime);
        } else {
          // 用户点击不保存
          this.cancelRecord();
        }
      }
    });
  },

  // 更新计时器显示
  updateTimerDisplay(elapsedTime) {
    // 计算分钟、秒和毫秒
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    const milliseconds = elapsedTime % 1000;

    // 格式化时间字符串
    this.setData({
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      milliseconds: String(milliseconds).padStart(3, '0'),
      elapsedTime: elapsedTime
    });
  },

  // 清除计时器
  clearTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
  },

  // 保存运动记录到服务器
  saveRecord(elapsedTime) {
    // 将毫秒转换为秒
    const value = Math.floor(elapsedTime / 1000);
    
    // 显示加载提示
    wx.showLoading({
      title: '保存中...',
    });

    // 发送请求到服务器
    wx.request({
      url: `${app.globalData.baseUrl}/exercise/record/add`,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        exerciseId: parseInt(this.data.exerciseId),
        value: value
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 0) {
          // 保存成功
          wx.showToast({
            title: '记录已保存',
            icon: 'success'
          });
          // 返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          // 保存失败
          wx.showToast({
            title: res.data.message || '保存失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        // 网络错误
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 取消保存记录
  cancelRecord() {
    this.setData({
      isRunning: false,
      isPaused: false,
      minutes: '00',
      seconds: '00',
      milliseconds: '000',
      elapsedTime: 0
    });
    wx.navigateBack();
  }
});
