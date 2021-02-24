// miniprogram/admin/index/index.js
Page({

  /**
   * Page initial data
   */
  data: {
    functions: [{
      "text": "我",
      "iconPath": "/admin/images/home.png",
      "selectedIconPath": "/admin/images/selected.png",

    },
    {
      "text": "订单",
      "iconPath": "/admin/images/order.png",
      "selectedIconPath": "/admin/images/selected.png",

    },
    {
      "text": "商品",
      "iconPath": "/admin/images/goods.png",
      "selectedIconPath": "/admin/images/selected.png",

    },
    {
      "text": "管理",
      "iconPath": "/admin/images/settings.png",
      "selectedIconPath": "/admin/images/selected.png",

    },
    ],
    pageIndex: 0,
    goods_items: [],


  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    console.debug("option:", options)
    this.setData({
      _openid: options.openid,
    })

    var query = wx.createSelectorQuery();
    query.select('#admin-index-tabber').boundingClientRect();
    let self = this
    query.exec(function (res) {
      var new_height = wx.getSystemInfoSync().windowHeight - res[0].height
      console.debug("new height:", new_height)
      if (self.data.viewHight != new_height) {
        self.setData({
          viewHight: new_height
        })
      }
    })
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function () {


  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function () {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function () {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function () {



  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: function () {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function () {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function () {

  },
  onTabChanged: function (e) {
    if (e.detail.index == 2) {
      this.onGetGoods()
    }
    this.setData({
      pageIndex: e.detail.index
    })
  },
  onGetGoods: async function () {
    // 调用云函数

    wx.showLoading({
      title: "正在加载资源",
    })

    var res = await wx.cloud.callFunction({
      name: 'goods-op',
      data: {
        cmd: 'get'
      }
    })

    let items = res.result.data;
    for (var index = 0; index < items.length; index++) {
      items[index].buttons = [{
        text: '删除',
        type: 'warn',
        data: items[index]._id,//通过ID删除该条数据
      }]
    }

    this.setData({
      goods_items: items
    })
    wx.hideLoading({
      complete: (res) => { },
    })
  },
  onAddGoods: function (e) {
    let self = this
    wx.navigateTo({
      url: '../add-item/add-item',
      events: {
        goodsAdded: function (result) {

          if (result.num == 0) {
            console.debug("没有添加商品")
            return
          }
          var len = self.data.goods_items.length
          //self.data.goods_items.push(result.items)

          for (var index = 0; index < result.num; index++) {
            result.items[index].buttons = [{
              text: '删除',
              type: 'warn',
              data: result.items[index]._id,//通过ID删除该条数据
            }]
            console.debug(result.items[index])

            var curIndex = len + index
            self.setData({
              ['goods_items[' + curIndex + ']']: result.items[index]
            })
          }
        }
      }
    })
  },
  onDeleteItem: async function (e) {
    console.log(e)
    try {
      let self = this
      await wx.cloud.callFunction({
        name: 'goods-op', //删除数据库记录
        data: {
          cmd: "delete",
          data: {
            id: e.detail.data
          }
        }
      }).then(res => {
        if (!res.result.success) {
          console.error(res)
        }
      }).catch(err => {
        console.log(err)
      })

      for (var index = 0; index < self.data.goods_items.length; index++) {
        if (self.data.goods_items[index]._id == e.detail.data) {
          wx.cloud.deleteFile({ //删除文件存储中的图片
            fileList: self.data.goods_items[index].imgs,
            success: res => {
              console.log("delete:" + fileList)
            },
            fail: err => {
              console.log(err)
            },
            complete: ret => {
              console.log(ret)
            }
          })
          self.data.goods_items.splice(index, 1)
          break;
        }
      }
      this.setData({
        goods_items: self.data.goods_items,
      })
    }
    catch (e) {
      console.log(e)
    }
  },
  onShowDetail: function (e) {
    console.debug(e)

    let self = this
    var item_index = e.currentTarget.dataset.index
    wx.navigateTo({
      url: '../add-item/add-item?op=edit',
      events: {
        updated: async function (data) {
          console.debug("item:", data.items)
         
          if (data.items.length > 0) {
            var item_index = self.data.goods_items.findIndex(item => item._id == data.items[0]._id)
            //只刷新必要的部分视图
            self.setData({
              ['goods_items[' + item_index + ']']: data.items[0]
            })
          }

        }
      },
      success: function (res) {
        res.eventChannel.emit("showItem", self.data.goods_items[e.currentTarget.dataset.index])
      }
    })
  },

})