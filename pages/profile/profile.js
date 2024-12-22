// pages/profile/profile.js
Page({
  data: {
    todoList: [],
    showModal: false,
    editingTodo: null,
  },

  onLoad() {
    this.fetchTodoList()
  },

  onShow() {
    this.fetchTodoList()
  },

  // 获取待办事项列表
  fetchTodoList() {
    wx.request({
      url: `${getApp().globalData.baseUrl}/todo/list`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({
            todoList: res.data.data || []
          })
        }
      }
    })
  },

  // 显示添加待办事项弹窗
  showAddTodoModal() {
    console.log('showAddTodoModal called');
    this.setData({
      showModal: true,
      editingTodo: {
        title: '',
        description: '',
        dueDate: '',
        priority: 0
      }
    })
  },

  // 显示待办事项详情
  showTodoDetail(e) {
    const id = e.currentTarget.dataset.id
    const todo = this.data.todoList.find(item => item.id === id)
    if (todo) {
      this.setData({
        showModal: true,
        editingTodo: { ...todo }
      })
    }
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({
      showModal: false,
      editingTodo: null
    })
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({
      'editingTodo.title': e.detail.value
    })
  },

  // 描述输入
  onDescriptionInput(e) {
    this.setData({
      'editingTodo.description': e.detail.value
    })
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      'editingTodo.dueDate': e.detail.value
    })
  },

  // 优先级选择
  onPriorityChange(e) {
    this.setData({
      'editingTodo.priority': parseInt(e.detail.value)
    })
  },

  // 保存待办事项
  saveTodo() {
    const todo = this.data.editingTodo
    if (!todo.title) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return
    }

    const url = todo.id 
      ? `${getApp().globalData.baseUrl}/todo/update`
      : `${getApp().globalData.baseUrl}/todo/add`

    wx.request({
      url,
      method: todo.id ? 'PUT' : 'POST',
      data: todo,
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
          this.hideModal()
          this.fetchTodoList()
        } else {
          wx.showToast({
            title: res.data.message || '保存失败',
            icon: 'none'
          })
        }
      }
    })
  },

  // 切换待办事项状态
  toggleTodoStatus(e) {
    const id = e.currentTarget.dataset.id
    const todo = this.data.todoList.find(item => item.id === id)
    if (todo) {
      wx.request({
        url: `${getApp().globalData.baseUrl}/todo/toggle/${id}`,
        method: 'PUT',
        success: (res) => {
          if (res.data.code === 0) {
            this.fetchTodoList()
          }
        }
      })
    }
  },

  // 删除待办事项
  deleteTodo(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个待办事项吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${getApp().globalData.baseUrl}/todo/delete/${id}`,
            method: 'DELETE',
            success: (res) => {
              if (res.data.code === 0) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                })
                this.fetchTodoList()
              }
            }
          })
        }
      }
    })
  }
})