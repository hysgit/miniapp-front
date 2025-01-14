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
      // 登录成功后执行回调并返回上一页
      if (app.globalData.loginCallback) {
        app.globalData.loginCallback()
        // 清空回调避免重复调用
        app.globalData.loginCallback = null
      }
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
