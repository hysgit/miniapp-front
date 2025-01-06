Page({
  data: {
    timers: [],
    showModal: false,
    timerName: '',
    timerIntervals: {} // 存储每个计时器的定时器ID
  },

  onLoad: function() {
    this.fetchTimerList();
    wx.setNavigationBarTitle({
      title: '计时器'
    });
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    this.fetchTimerList();
  },

  onUnload: function() {
    // 页面卸载时清除所有定时器
    Object.values(this.data.timerIntervals).forEach(clearInterval);
  },

  onHide: function() {
    // 页面隐藏时也清除定时器
    Object.values(this.data.timerIntervals).forEach(clearInterval);
  },

  fetchTimerList() {
    wx.request({
      url: `${getApp().globalData.baseUrl}/timer/list`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        this.setData({ timers: res.data }, () => {
          // 设置计时器
          this.setupTimers();
        });
      },
      fail: (err) => {
        console.error('请求失败', err);
      }
    });
  },

  setupTimers() {
    // 清除现有的所有定时器
    Object.values(this.data.timerIntervals).forEach(clearInterval);
    const timerIntervals = {};

    this.data.timers.forEach(timer => {
      if (timer.startTime) {
        // 计算初始持续时间
        const duration = this.calculateDuration(timer.startTime);
        timer.duration = duration;

        // 设置定时器，每秒更新一次
        timerIntervals[timer.id] = setInterval(() => {
          const updatedTimers = this.data.timers.map(t => {
            if (t.id === timer.id) {
              return {
                ...t,
                duration: this.calculateDuration(t.startTime)
              };
            }
            return t;
          });
          this.setData({ timers: updatedTimers });
        }, 1000);
      }
    });

    this.setData({ timerIntervals });
  },

  calculateDuration: function(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000); // 转换为秒
    
    const days = Math.floor(diff / (24 * 3600));
    const hours = Math.floor((diff % (24 * 3600)) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    let duration = '';
    if (days > 0) {
      duration += `${days}天 `;  
    }
    if (hours > 0 || days > 0) {
      duration += `${hours}小时`;
    }
    if (minutes > 0 || hours > 0 || days > 0) {
      duration += `${String(minutes).padStart(2, '0')}分`;  
    }
    duration += `${String(seconds).padStart(2, '0')}秒`;  
    
    return duration;
  },

  showCreateModal() {
    this.setData({
      showModal: true
    });
  },

  hideModal() {
    this.setData({
      showModal: false,
      timerName: ''
    });
  },

  onNameInput(e) {
    this.setData({
      timerName: e.detail.value
    });
  },

  createTimer() {
    if (!this.data.timerName) {
      wx.showToast({
        title: '请输入定时器名称',
        icon: 'none'
      });
      return;
    }

    wx.request({
      url: `${getApp().globalData.baseUrl}/timer/create`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: this.data.timerName
      },
      success: (res) => {
        this.hideModal();
        this.fetchTimerList();
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('创建失败', err);
        wx.showToast({
          title: '创建失败',
          icon: 'none'
        });
      }
    });
  },

  goToDetail: function(e) {
    const timerId = e.currentTarget.dataset.id;
    console.log('Navigate to timer detail, id:', timerId);
    wx.navigateTo({
      url: `/pages/timerDetail/timerDetail?id=${timerId}`,
      fail: function(err) {
        console.error('Navigation failed:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },
});
