const app = getApp()

Page({
  data: {
    userInfo: null,
    hasUserInfo: false
  },

  onLoad() {
    if (app.globalData.hasUserInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    }
  },

  // 处理登录按钮点击
  handleLogin() {
    app.getUserProfile().then(userInfo => {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
      // 登录成功后返回上一页
      wx.navigateBack()
    }).catch(err => {
      console.error('获取用户信息失败', err)
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
    })
  }
})
