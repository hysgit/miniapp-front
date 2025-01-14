const app = getApp();
const dateUtil = require('../../utils/dateUtil.js');

Page({
  data: {
    activeTab: 'ongoing',
    countdowns: [],
    countdownTypes: ['单次', '周循环', '月循环', '年循环', '日循环'],
    showEditModal: false,
    editingCountdown: null,
    editForm: {
      name: '',
      countdownType: 1
    }
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
      success: (res) => {
        if (res.statusCode === 200) {
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

          if (this.data.activeTab === 'ongoing') {
            this.startTimer();
          }
        }
      }
    });
  },

  // 打开编辑弹窗
  onEditCountdown: function(e) {
    const countdown = this.data.countdowns.find(item => item.id === e.currentTarget.dataset.id);
    this.setData({
      showEditModal: true,
      editingCountdown: countdown,
      editForm: {
        name: countdown.name,
        countdownType: countdown.countdownType
      }
    });
  },

  // 关闭编辑弹窗
  onCloseEditModal: function() {
    this.setData({
      showEditModal: false,
      editingCountdown: null
    });
  },

  // 处理表单输入
  onEditFormChange: function(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`editForm.${field}`]: e.detail.value
    });
  },

  // 提交编辑表单
  onSubmitEdit: function() {
    const { editingCountdown, editForm } = this.data;
    wx.request({
      url: `${app.globalData.baseUrl}/countdown/${editingCountdown.id}/update`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        name: editForm.name,
        countdownType: editForm.countdownType
      },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({
            title: '更新成功',
            icon: 'success'
          });
          this.loadCountdowns();
          this.onCloseEditModal();
        }
      }
    });
  },

  calculateRemainingTime: function(endTime) {
    const end = dateUtil.parseDate(endTime).getTime();
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
    const date = dateUtil.parseDate(dateTimeStr);
    return dateUtil.formatDate(date, 'yyyy年MM月dd日 HH:mm');
  },

  startTimer: function() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      const countdowns = this.data.countdowns.map(item => {
        item.remainingTime = this.calculateRemainingTime(item.endTime);
        return item;
      });
      this.setData({
        countdowns: countdowns
      });
    }, 60000);
  },

  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab !== this.data.activeTab) {
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
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
});
