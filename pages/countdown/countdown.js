const app = getApp();

Page({
  data: {
    activeTab: 'ongoing',
    countdowns: [],
    countdownTypes: ['单次', '周循环', '月循环', '年循环', '日循环']
  },

  onShow: function() {
    this.loadCountdowns();
    wx.setNavigationBarTitle({
      title: '倒计时'
    });
  },

  loadCountdowns: function() {
    const url = this.data.activeTab === 'ongoing' ? '/countdown/list/active' : '/countdown/list/completed';
    
    wx.request({
      url: `${app.globalData.baseUrl}${url}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          // 处理倒计时数据，计算剩余时间
          const countdowns = res.data.map(item => {
            if (this.data.activeTab === 'ongoing') {
              item.remainingTime = this.calculateRemainingTime(item.endTime);
            }
            item.formattedEndTime = this.formatDateTime(item.endTime);
            if (item.completeTime) {
              item.formattedCompleteTime = this.formatDateTime(item.completeTime);
            }
            return item;
          });
          
          this.setData({
            countdowns: countdowns
          });

          // 如果是进行中的倒计时，启动定时器更新剩余时间
          if (this.data.activeTab === 'ongoing') {
            this.startTimer();
          }
        }
      }
    });
  },

  calculateRemainingTime: function(endTime) {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) {
      return '已到期';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}天${hours}小时`;
    } else if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  },

  formatDateTime: function(dateTimeStr) {
    const date = new Date(dateTimeStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  startTimer: function() {
    // 清除之前的定时器
    if (this.timer) {
      clearInterval(this.timer);
    }

    // 每分钟更新一次剩余时间
    this.timer = setInterval(() => {
      const countdowns = this.data.countdowns.map(item => {
        item.remainingTime = this.calculateRemainingTime(item.endTime);
        return item;
      });
      this.setData({
        countdowns: countdowns
      });
    }, 60000); // 每分钟更新一次
  },

  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab !== this.data.activeTab) {
      // 切换标签时清除定时器
      if (this.timer) {
        clearInterval(this.timer);
      }
      
      this.setData({
        activeTab: tab,
        countdowns: []
      });
      this.loadCountdowns();
    }
  },

  onAddCountdown: function() {
    wx.navigateTo({
      url: '/pages/countdown/createCountdown'
    });
  },

  onCompleteCountdown: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要完成这个倒计时吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${app.globalData.baseUrl}/countdown/${id}/complete`,
            method: 'POST',
            header: {
              'Authorization': `Bearer ${wx.getStorageSync('token')}`
            },
            success: (res) => {
              if (res.statusCode === 200) {
                wx.showToast({
                  title: '已完成',
                  icon: 'success'
                });
                this.loadCountdowns();
              }
            }
          });
        }
      }
    });
  },

  onDeleteCountdown: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除这个倒计时吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${app.globalData.baseUrl}/countdown/${id}`,
            method: 'DELETE',
            header: {
              'Authorization': `Bearer ${wx.getStorageSync('token')}`
            },
            success: (res) => {
              if (res.statusCode === 200) {
                wx.showToast({
                  title: '已删除',
                  icon: 'success'
                });
                this.loadCountdowns();
              }
            }
          });
        }
      }
    });
  },

  onUnload: function() {
    // 页面卸载时清除定时器
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
});
