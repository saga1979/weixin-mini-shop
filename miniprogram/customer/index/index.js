// miniprogram/customer/index/index.js
Page({

  /**
   * Page initial data
   */
  data: {
    list: [{
      "text": "商品",
      "iconPath": "/customer/images/customer_user_home.png",
      "selectedIconPath": "/customer/images/selected_common.png",

    },
    {
      "text": "购物车",
      "iconPath": "/customer/images/customer_user_cart.png",
      "selectedIconPath": "/customer/images/selected_common.png",

    },
    {
      "text": "订单",
      "iconPath": "/customer/images/customer_user_history.png",
      "selectedIconPath": "/customer/images/selected_common.png",

    },
    {
      "text": "我",
      "iconPath": "/customer/images/customer.png",
      "selectedIconPath": "/customer/images/selected_common.png",

    },
    ],
    pageIndex: 0,
    goodsItems: [],//当前需要显示的商品
    _goodsItems: [],  
    gridItems: [],
    _selectedItems: [],  
    nickName: '',
    avatarUrl: '',
    activeTab: 0,
    _goodsTypes: [],
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: async function (options) {

    console.debug(options)
    let self = this;
    this.setData({
      nickName: options.nickName,
      avatarUrl: options.avatarUrl

    })
    this.data._goodsTypes.push({ title: "推荐" })
    console.debug(this.data)
    wx.showLoading({
      title: "正在加载资源",
    })
    //获取商品分类
    var ret = await wx.cloud.callFunction({
      name: 'config',
      data: {
        cmd: 'goodsTypes-get'
      }
    })
    wx.hideLoading({
      success: (res) => { },
    })
    console.debug(ret.result.data)

    var items = ret.result.data
    if (items != null) {
      self.data._goodsTypes = self.data._goodsTypes.concat(ret.result.data)

    }
    self.data._goodsTypes.push({ title: "未分类" })
    self.setData({
      goodsTypesForVtabs: self.data._goodsTypes.map(item => ({ title: item.title }))
    })
    this.data.total_price = 0
    wx.cloud.callFunction({
      name: 'goods-op',
      data: {
        cmd: 'get-recommend'
      }
    }).then(res => {

      console.debug(res)
      if (res.result.success) {
        this.makeShowInfos(res.result.data)
      }
    })
    //todo...如果没有有效商品该怎么办？
    if (this.data.goodsItems == null || this.data.goodsItems.length == 0) {
      //todo...
    }
    wx.hideLoading({
      complete: (res) => { },
    })

  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function () {
    var query = wx.createSelectorQuery();
    query.select('#mytabber').boundingClientRect();
    let self = this
    query.exec(function (res) {
      var new_height = wx.getSystemInfoSync().windowHeight - res[0].height
      if (self.data.viewHight != new_height) {
        self.setData({
          viewHight: new_height
        })
      }
    })

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

  onTabChanged: function (e) {
    console.log(e)

    this.setData({
      pageIndex: e.detail.index

    })

    if (e.detail.index == 1) {
      this.setData({
        [`list[${e.detail.index}].dot`]: false
      })
    }
  },


  onShowDetail: function (e) {
    console.debug(e)
    wx.navigateTo({
      url: "../../components/goods-detail/detail?_id=" + e.target.dataset.id
    })
  },

  onTapCheckbox: function (e) {
    console.debug(e)
    var index = this.data._selectedItems.findIndex(item => item == e.target.dataset.id)

    if (index == -1) {
      this.data._selectedItems.push(e.target.dataset.id);
    } else {
      this.data._selectedItems.splice(index, 1)
    }
    var index = e.target.dataset.index

    this.setData({
      ['goodsItems[' + index + '].isChecked']: !this.data.goodsItems[index].isChecked
    })

  },
  onAddToCard: function (e) {
    let self = this
    console.debug(this.data._selectedItems)
    wx.cloud.callFunction({
      name: "cart-op",
      data: {
        cmd: "add",
        data: {
          ids: this.data._selectedItems
        }
      }
    }).then(res => {

      console.debug(res)
      if (res.result.success) {
        this.data._selectedItems = []

        for (var index = 0; index < self.data.goodsItems.length; index++) {
          if (self.data.goodsItems[index].isChecked) {
            console.debug("index:" + index + " set unchecked")
            self.setData({
              ['goodsItems[' + index + '].isChecked']: false
            })
          }
        }

        if (res.result.data == 0) {
          wx.showToast({
            title: '已加入',
          })
        } else {
          self.data.list[1].dot = true
          self.setData({
            ['list[1]']: self.data.list[1]
          })
        }
      }

    }).catch(err => {
      console.error(err)
    })
  },


  onSwitchType: async function (e) {
    const index = e.detail.index
    if (index == this.data.activeTab) {
      return;
    }
    this.data.activeTab = index
    this.data._selectedItems = []

    wx.showLoading({
      title: '正在加载数据',
    })
    var res = null
    if (index == 0) {//推荐
      res = await wx.cloud.callFunction({
        name: 'goods-op',
        data: {
          cmd: 'get',
          data: {
            where: {
              recommend: true
            },
            fetched: 0
          }
        }
      })

    }else if(index == this.data._goodsTypes.length -1){//未分类

      var types = []
      this.data._goodsTypes.forEach(item=>{
        types.push(item.title)
      })
      res = await wx.cloud.callFunction({
        name: 'goods-op',
        data: {
          cmd: 'get-notTypes',
          data: {
            types: types,
            fetched: 0
          }
        }
      })

    } else {

      res = await wx.cloud.callFunction({
        name: 'goods-op',
        data: {
          cmd: 'get-byTypes',
          data: {
            types: [this.data._goodsTypes[index].title],
            fetched: 0
          }
        }
      })
    }
    console.debug(res)
    this.makeShowInfos(res.result.data)
    //获取特定种类的商品
    console.log('tabClick', index)
    wx.hideLoading({
      success: (res) => {},
    })
  },


  makeShowInfos: function (goodsInfos) {

    this.data.gridItems = []
    for (var index = 0; index < goodsInfos.length; index++) {
      var grid_item = {
        imgUrl: goodsInfos[index].imgs[0],
        url: '../../components/goods-detail/detail?_id=' + goodsInfos[index]._id,
        text: goodsInfos[index].name
      }
      this.data.gridItems.push(grid_item)
    }

    this.data.goodsItems = goodsInfos

    for (var index = 0; index < this.data.goodsItems.length; index++) {
      this.data.goodsItems[index]["isChecked"] = false
    }
    this.setData({
      goodsItems: goodsInfos
    })
  }
}

)