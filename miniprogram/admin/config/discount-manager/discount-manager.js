// miniprogram/admin/discount-manager/discount-manager.js
Page({

  /**
   * Page initial data
   */
  data: {
    showDialog: false,
    groups: [
      { text: '满减（一次）', value: 1 },
      { text: '满减（叠加）', value: 2 },
      { text: '免单', value: 3 },

    ]

  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: async function (options) {
    let self = this
    wx.cloud.callFunction({
      name: "discount",
      data: {
        cmd: "get"
      }
    }).then(ret => {
      var discountInfos = ret.result.data
      for (var index = 0; index < discountInfos.length; index++) {
        discountInfos[index].buttons = [{
          text: '删除',
          data: discountInfos[index]._id,
          type: 'warn',
        }]
      }
      self.setData({
        discountInfos: discountInfos
      })
      console.debug(self.data.discountInfos)

    }).catch(err => {
      console.error(err)
    })

  },

  openDialog: function () {
    this.setData({
      showDialog: true
    })
  },
  closeDialog: function () {
    this.setData({
      showDialog: false
    })
  },
  btnClick(e) {
    console.log(e)
    this.closeDialog()
    let self = this
    wx.navigateTo({
      url: '../discount/discount?type=' + e.detail.value,
      events: {
        add: async (data) => {
         
          var res = await wx.cloud.callFunction({
            name: 'discount',
            data: {
              cmd: 'add',
              data: data
            }
          })

          var discount = data
          var len = self.data.discountInfos.length
          discount._id = res.result.data
          discount.buttons = [{
            text: '删除',
            data: discount._id,
            type: 'warn',
          }]
          console.debug("add:", discount)
          self.data.discountInfos.push(discount)
          self.setData({
            discountInfos: self.data.discountInfos
          })
          // self.setData({
          //   ['discountInfos[' + len + '] ']: self.data.discountInfos[len]
          // })
        }
      }
    })
  },
  toDetail: function (e) {
    console.debug(e)
    let self = this
    wx.navigateTo({
      url: '../discount/discount?_id=' + e.target.dataset.id,
      events :{        
        update: async (data) => {
          console.debug("new update:", data)
          var res = await wx.cloud.callFunction({
            name: 'discount',
            data: {
              cmd: 'update',
              data: {
                id: data.id,
                update: data.update
              }
            }
          })

         var index = self.data.discountInfos.findIndex(item => item._id == data.id)
         if(index != -1 && data.update.title != null){
           self.data.discountInfos[index].title = data.update.title
           self.setData({
             ['discountInfos[' + index + '].title'] : self.data.discountInfos[index].title
           })
         }

        }
      }
    })
  },
  discountOnorOff: function (e) {
    console.debug(e)

    this.setData({
      ['discountInfos[' + e.target.dataset.index + '].stopped']: !e.detail.value
    })

    wx.cloud.callFunction({
      name: 'discount',
      data: {
        cmd: 'update',
        data: {
          id: this.data.discountInfos[e.target.dataset.index]._id,
          update: {
            stopped: !e.detail.value
          }
        }
      }
    }).then(res => {
      console.debug("update:", res)
    }).catch(err => {
      console.debug(err)
    })

  },
  onDeleteItem: function (e) {
    console.debug("delete:", e.target.dataset)
    let self = this
    wx.cloud.callFunction({
      name: 'discount',
      data: {
        cmd: 'delete',
        ids: [e.target.dataset.id]
      }
    }).then(res => {

      self.setData({
        ['discountInfos[' + e.target.dataset.index + '].hidden']: true
      })

    }).catch(err => {
      console.error(err)
    })
  }

})