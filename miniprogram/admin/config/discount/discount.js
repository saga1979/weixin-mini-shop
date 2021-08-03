// miniprogram/admin/discount/discount.js
Page({

  /**
   * Page initial data
   */
  data: {
    goodsInfos: [],
    viewHeight: 1000,
    _goodsIDs: []
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: async function (options) {

    console.debug("option:", options)
    if (options._id != null) {//修改
      this.setData({
        _id: options._id
      })

      let self = this
      var res = await wx.cloud.callFunction({
        name: 'discount',
        data: {
          cmd: 'get',
          where: {
            _id: options._id
          }
        }
      })
      console.debug(res)
      if (res.result.data != null && res.result.data.length > 0) {
        var discountInfo = res.result.data[0]
        var start = new Date(discountInfo.start)
        var end = new Date(discountInfo.end)
        discountInfo.start = start
        discountInfo.end = end
        self.setData({
          title: discountInfo.title,
          total: discountInfo.total,
          cut: discountInfo.cut,
          startDate: start.getFullYear() + "-" + (start.getMonth() + 1) + "-" + start.getDate(),
          startTime: start.getHours() + ":" + start.getMinutes(),
          endDate: end.getFullYear() + "-" + (end.getMonth() + 1) + "-" + end.getDate(),
          endTime: end.getHours() + ":" + end.getMinutes(),

          _oldInfo: discountInfo, //记录下原来的信息
        })
      }
    } else if (options.type != null) {
      this.data._type = options.type
    }

    wx.showLoading({
      title: "正在加载资源",
    })

    var res = await wx.cloud.callFunction({
      name: 'goods-op',
      data: {
        cmd: 'get'
      }
    })

    var goodsInfos = res.result.data
    if (options._id != null) {//修改
      let self = this
      goodsInfos.forEach(item => {
        if (self.data._oldInfo.goods.findIndex(id => id == item._id) != -1) {
          item.checked = true
        }
      })
    }

    this.setData({
      goodsInfos: goodsInfos
    })
    wx.hideLoading({
      complete: (res) => { },
    })
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: async function () {


    var new_height = wx.getSystemInfoSync().windowHeight
    if (this.data._type != null) {
      this.setData({
        viewHeight: new_height,
        startDate: (new Date()).toISOString().substring(0, 10),
        startTime: '00:00',
        endDate: (new Date()).toISOString().substring(0, 10),
        endTime: '23:59'
      })
    } else {
      this.setData({
        viewHeight: new_height
      })
    }
    console.debug(this.data.startDate)
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
  onUnload: async function () {

    var discount = {}
    discount.title = this.data.title
    discount.total = Number(this.data.total)
    discount.cut = Number(this.data.cut)
    discount.start = new Date(this.data.startDate + ' ' + this.data.startTime)
    discount.end = new Date(this.data.endDate + ' ' + this.data.endTime)
    var goods = []

    this.data.goodsInfos.forEach(item => {
      if (item.checked) {
        goods.push(item._id)
      }
    })

    discount.goods = goods

    discount.type = this.data._type != null ? this.data._type : this.data._oldInfo.type

    console.debug("discount:", discount)
    const channel = this.getOpenerEventChannel()

    if (this.data._oldInfo != null) {//查看是否有变更
      let self = this
      var old = this.data._oldInfo
      var update = {}

      var keys = Object.keys(discount)
      console.debug("keys:", keys)

      keys.forEach(key => {
        console.debug(key + ":", old[key], discount[key])
        if (old[key] != discount[key]) {
          update[key] = discount[key]
        }
      })

      if (update.start != null) {
        if (old.start.getTime() == discount.start.getTime()) {
          delete update.start
        }
      }
      if (update.end != null) {
        if (old.end.getTime() == discount.end.getTime()) {
          delete update.end
        }
      }

      if (update.goods != null && old.goods.length == discount.goods.length) {
        var diff = false
        update.goods.forEach(item => {
          if (discount.goods.findIndex(obj => obj == item) == -1) {
            diff = true
          }
        })
        if (!diff) {
          delete update.goods
        }
      }

      if (Object.keys(update).length != 0) {//更新记录

        console.debug("emit update!")
        channel.emit('update', {
          id: old._id,
          update : update
        })
      }

    } else {

      if (discount.title != null
        && discount.total != null
        && discount.cut != null) {        
        channel.emit('add', discount)
      }
    }
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
  titleChange: function (e) {

  },
  totalChange: function (e) {

  },
  cutChange: function (e) {

  },
  bindStartDateChange: function (e) {

  },
  bindStartTimeChange: function (e) {

  },
  bindEndDateChange: function (e) {

  },
  bindEndTimeChange: function (e) {

  },
  goodsOnorOff: function (e) {
    console.debug(e)
    this.data.goodsInfos[e.target.dataset.index].checked = e.detail.value
  }
})