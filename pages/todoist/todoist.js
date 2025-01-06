// pages/todoist/todoist.js
Page({
  data: {
    activeTab: 'todo', // 当前激活的标签：'todo' 或 'done'
    todoList: [], // 待办事项列表
    doneList: [], // 已完成事项列表
    searchValue: '', // 搜索值
    filteredTodoList: [], // 过滤后的待办事项列表
    filteredDoneList: [], // 过滤后的已完成事项列表
    showModal: false, // 是否显示新建/编辑弹窗
    editingTodo: null, // 当前编辑的待办事项
    slideButtons: [{
      type: 'warn',
      text: '删除'
    }]
  },

  onLoad() {
    this.loadTodoList()
    wx.setNavigationBarTitle({
      title: '待办事项'
    });
  },

  onShow() {
    this.loadTodoList()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadTodoList().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 搜索输入
  onSearchInput(e) {
    const searchValue = e.detail.value.toLowerCase()
    this.setData({ searchValue }, () => {
      this.filterTodoList()
    })
  },

  // 清空搜索
  clearSearch() {
    this.setData({ 
      searchValue: '',
      filteredTodoList: this.data.todoList,
      filteredDoneList: this.data.doneList
    })
  },

  // 过滤待办事项列表
  filterTodoList() {
    const { todoList, doneList, searchValue } = this.data
    if (!searchValue) {
      this.setData({
        filteredTodoList: todoList,
        filteredDoneList: doneList
      })
      return
    }

    const filteredTodoList = todoList.filter(item => 
      item.title.toLowerCase().includes(searchValue) || 
      (item.description && item.description.toLowerCase().includes(searchValue))
    )
    const filteredDoneList = doneList.filter(item => 
      item.title.toLowerCase().includes(searchValue) || 
      (item.description && item.description.toLowerCase().includes(searchValue))
    )

    this.setData({
      filteredTodoList,
      filteredDoneList
    })
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  // 跳转到新建待办事项页面
  showAddTodoModal() {
    wx.navigateTo({
      url: '/pages/todoItem/todoItem'
    })
  },

  // 跳转到编辑待办事项页面
  editTodoItem(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/todoItem/todoItem?id=${id}`
    })
  },

  // 加载待办事项列表
  async loadTodoList() {
    wx.showNavigationBarLoading()
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${getApp().globalData.baseUrl}/todoItem/list`,
          method: 'GET',
          success: resolve,
          fail: reject
        })
      })

      if (res.data.code === 0) {
        const list = res.data.data || []
        // 添加 x 属性用于滑动
        const todoList = list
          .filter(item => item.status === 0)
          .map(item => ({ ...item, x: 0 }))
        const doneList = list
          .filter(item => item.status === 1)
          .map(item => ({ ...item, x: 0 }))
        
        this.setData({
          todoList,
          doneList,
          filteredTodoList: todoList,
          filteredDoneList: doneList
        })
      } else {
        wx.showToast({
          title: res.data.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideNavigationBarLoading()
    }
  },

  // 切换待办事项状态
  toggleTodoStatus(e) {
    const id = e.currentTarget.dataset.id
    wx.showLoading({ title: '更新中...' })
    wx.request({
      url: `${getApp().globalData.baseUrl}/todoItem/toggle/${id}`,
      method: 'POST',
      success: (res) => {
        if (res.data.code === 0) {
          this.loadTodoList()
        } else {
          wx.showToast({
            title: res.data.message || '操作失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  // 滑动删除
  onSlideButtonTap(e) {
    const { id } = e.currentTarget.dataset
    this.deleteTodoItem(id)
  },

  // 删除待办事项
  deleteTodoItem(id) {
    wx.showModal({
      title: '提示',
      content: '确定要删除这个待办事项吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          wx.request({
            url: `${getApp().globalData.baseUrl}/todoItem/delete/${id}`,
            method: 'DELETE',
            success: (res) => {
              if (res.data.code === 0) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                })
                this.loadTodoList()
              } else {
                wx.showToast({
                  title: res.data.message || '删除失败',
                  icon: 'none'
                })
              }
            },
            fail: () => {
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              })
            },
            complete: () => {
              wx.hideLoading()
            }
          })
        }
      }
    })
  },

  handleMovableChange(e) {
    const { source } = e.detail
    if (source === 'touch') {
      const x = e.detail.x
      const { id } = e.currentTarget.dataset
      const list = this.data.activeTab === 'todo' ? 'todoList' : 'doneList'
      const items = this.data[list]
      const index = items.findIndex(item => item.id === id)
      
      if (index > -1) {
        items[index].x = x
        this.setData({
          [list]: items
        })
      }
    }
  },

  handleTouchEnd(e) {
    const { id } = e.currentTarget.dataset
    const list = this.data.activeTab === 'todo' ? 'todoList' : 'doneList'
    const items = this.data[list]
    const index = items.findIndex(item => item.id === id)
    
    if (index > -1) {
      const x = items[index].x
      if (x < -70) {
        // 显示删除按钮
        items[index].x = -150
      } else {
        // 回到原位
        items[index].x = 0
      }
      this.setData({
        [list]: items
      })
    }
  },

  // 显示待办事项详情
  showTodoDetail(e) {
    const id = e.currentTarget.dataset.id
    const todo = this.data.todoList.find(item => item.id === id) || this.data.doneList.find(item => item.id === id)
    if (todo) {
      this.setData({
        showModal: true,
        editingTodo: { ...todo }
      }, () => {
        console.log('showModal after setData:', this.data.showModal);
        if (this.data.showModal) {
          console.log('Modal should be visible now.');
        }
      });
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
      ? `${getApp().globalData.baseUrl}/todoItem/update`
      : `${getApp().globalData.baseUrl}/todoItem/add`

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
          this.loadTodoList()
        } else {
          wx.showToast({
            title: res.data.message || '保存失败',
            icon: 'none'
          })
        }
      }
    })
  }
})