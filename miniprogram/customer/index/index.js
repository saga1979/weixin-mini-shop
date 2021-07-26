// miniprogram/customer/index/index.js
Page({

  /**
   * Page initial data
   */
  data: {
    list: [{
      "text": "商品",
      "iconPath": "/images/customer_user_home.png",
      "selectedIconPath": "/images/selected_common.png",

    },
    {
      "text": "收藏夹",
      "iconPath": "/images/customer_user_cart.png",
      "selectedIconPath": "/images/selected_common.png",

    },
    {
      "text": "订单",
      "iconPath": "/images/customer_user_history.png",
      "selectedIconPath": "/images/selected_common.png",

    },
    {
      "text": "我",
      "iconPath": "/images/customer.png",
      "selectedIconPath": "/images/selected_common.png",

    },
    ],
    pageIndex: 0,
    goods_items: [],//当前需要显示的商品
    _goods_items: [],
    total_price: 0,//单位为分，目前商品定价单位为元
    grid_items: [],
    _selected_items: [],
    submitted: true,
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
    if (this.data.goods_items == null || this.data.goods_items.length == 0) {
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
      url: "../../components/myself/goods-detail/detail?_id=" + e.target.dataset.id
    })
  },
  onTapCheckbox: function (e) {
    console.debug(e)
    var index = this.data._selected_items.findIndex(item => item == e.target.dataset.id)

    if (index == -1) {
      this.data._selected_items.push(e.target.dataset.id);
    } else {
      this.data._selected_items.splice(index, 1)
    }


    var item_index = e.target.dataset.index

    this.data.goods_items[item_index].isChecked = !this.data.goods_items[item_index].isChecked


  },
  onAddToCard: function (e) {
    let self = this
    console.debug(this.data._selected_items)
    wx.cloud.callFunction({
      name: "cart-op",
      data: {
        cmd: "add",
        data: {
          ids: this.data._selected_items
        }
      }
    }).then(res => {

      console.debug(res)
      if (res.result.success) {

        for (var index = 0; index < self.data.goods_items.length; index++) {
          if (self.data.goods_items[index].isChecked) {
            console.debug("index:" + index + " set unchecked")
            self.setData({
              ['goods_items[' + index + '].isChecked']: false
            })
          }
        }

        if (res.result.data == 0) {
          wx.showToast({
            title: '已收藏',
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
  },

  onChange(e) {
    const index = e.detail.index
    console.log('change', index)
  },

  makeShowInfos: function (goodsInfos) {

    this.data.grid_items = []
    for (var index = 0; index < goodsInfos.length; index++) {
      var grid_item = {
        imgUrl: goodsInfos[index].imgs[0],
        url: '../../components/goods-detail/detail?_id=' + goodsInfos[index]._id,
        text: goodsInfos[index].name
      }
      this.data.grid_items.push(grid_item)
    }

    this.data.goods_items = goodsInfos

    for (var index = 0; index < this.data.goods_items.length; index++) {
      this.data.goods_items[index]["isChecked"] = false
    }
    this.setData({
      //grid_items: self.data.grid_items,
      goods_items: goodsInfos
    })
  }
}

)