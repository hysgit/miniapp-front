Page({
  data: {
    timerId: null,
    timer: {},
    records: [],
    showConfirmModal: false,
    currentRecordId: null,
    timerIntervals: {}
  },

  onLoad: function(options) {
    this.setData({
      timerId: options.id
    });
    this.fetchTimerDetail();
  },

  onUnload: function() {
    // 清除所有定时器
    Object.values(this.data.timerIntervals).forEach(clearInterval);
  },

  fetchTimerDetail: function() {
    wx.request({
      url: `${getApp().globalData.baseUrl}/timer/detail/${this.data.timerId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        // 分别存储计算用的时间和显示用的时间
        const records = res.data.records.map(record => ({
          ...record,
          startTime: this.formatDateTime(record.startTime),
          stopTime: this.formatDateTime(record.stopTime),
          displayStartTime: this.formatDisplayDateTime(record.startTime),
          displayStopTime: this.formatDisplayDateTime(record.stopTime)
        }));

        this.setData({
          timer: res.data.timer,
          records: records
        }, () => {
          this.setupTimers();
        });
      }
    });
  },

  setupTimers: function() {
    // 清除现有的定时器
    Object.values(this.data.timerIntervals).forEach(clearInterval);
    const timerIntervals = {};

    this.data.records.forEach(record => {
      if (!record.stopTime) {
        // 设置定时器更新持续时间
        timerIntervals[record.id] = setInterval(() => {
          const updatedRecords = this.data.records.map(r => {
            if (r.id === record.id) {
              return {
                ...r,
                duration: this.calculateDuration(r.startTime)
              };
            }
            return r;
          });
          this.setData({ records: updatedRecords });
        }, 1000);
      }
    });

    this.setData({ timerIntervals });
  },

  calculateDuration: function(startTime, stopTime) {
    try {
      const start = new Date(startTime);
      const end = stopTime ? new Date(stopTime) : new Date();
      const diff = Math.floor((end - start) / 1000); // 转换为秒
      
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
    } catch (error) {
      console.error('Error calculating duration:', error);
      return '计算错误';
    }
  },

  formatDateTime: function(dateTimeStr) {
    if (!dateTimeStr) return '';
    // 保持 ISO 格式用于计算，但是显示时替换 T
    return dateTimeStr.split('.')[0];
  },

  formatDisplayDateTime: function(dateTimeStr) {
    if (!dateTimeStr) return '';
    // 仅用于显示的格式
    return dateTimeStr.replace('T', ' ').split('.')[0];
  },

  showStopConfirm: function(e) {
    this.setData({
      showConfirmModal: true,
      currentRecordId: e.currentTarget.dataset.id
    });
  },

  hideModal: function() {
    this.setData({
      showConfirmModal: false,
      currentRecordId: null
    });
  },

  confirmStop: function() {
    wx.request({
      url: `${getApp().globalData.baseUrl}/timer/record/stop/${this.data.currentRecordId}`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        this.hideModal();
        this.fetchTimerDetail();
        wx.showToast({
          title: '计时已结束',
          icon: 'success'
        });
      }
    });
  }
});
