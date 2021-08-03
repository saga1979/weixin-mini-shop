// customer/cart/cart.js
Component({

  options: {
    styleIsolation: 'apply-shared'
  },
  /**
   * Component properties
   */
  properties: {
    nickName: {
      type: String,
      value: ''
    },
    avatarUrl: String

  },

  /**
   * Component initial data
   */
  data: {
    _removedList: [], //物品可以通过删除按钮、加入订单删除,此处的数据为商品ID
    goodsList: [], //商品列表
    totalPrice: 0,//商品总价
    _dirty: false,
    _originalCart: [], //校验购物车是否有变更
    _discounts: [] //有效的折扣规则
  },

  lifetimes: {
    created: function () {
      console.debug("created")
    },
    attached: async function () {
      console.debug("attached")
      this.data._dirty = false
      wx.showLoading({
        title: '正在请求数据',
      })

      //获取活动信息

      var res = await wx.cloud.callFunction({
        name: 'discount',
        data: {
          cmd: 'get-valid'
        }
      })
      this.data._discounts = res.result.data
      console.debug("discounts:", this.data._discounts)
      let self = this
      res = await wx.cloud.callFunction({
        name: 'cart-op',
        data: {
          cmd: "get"
        }
      })
      console.debug(res.result.data.list)

      var goodsList = []
      res.result.data.list.forEach(item => {
        self.data._originalCart.push(item.cart)
        item.goodsInfo[0].buttons = [{
          text: '删除',
          type: "warn",
          //src: '../../../images/trash.png', // icon的路径相对组件的路径，而不是使用者的路径 
          data: item.goodsInfo[0]._id,//通过ID删除该条数据
        }]

        if (item.goodsInfo[0].isSelling == null){//兼容没有设置该属性前就录入得商品
          item.goodsInfo[0].isSelling = true
        }

        if (!item.goodsInfo[0].isSelling) {//如果不售卖，取消选中状态
          self.data._dirty = true
        }
       // if (item.cart.selected && item.goodsInfo[0].isSelling) {
          item.goodsInfo[0].selected = item.cart.selected
          item.goodsInfo[0].count = item.cart.count
          item.goodsInfo[0].order_price = Number((item.goodsInfo[0].price * item.cart.count).toFixed(2)) //单位为元
       // }
        item.goodsInfo[0].discounts = []
        self.data._discounts.forEach(discount => {
          if (discount.goods.indexOf(item.goodsInfo[0]._id) != -1) {
            item.goodsInfo[0].discounts.push({
              title: discount.title
            })
          }
        })
        goodsList.push(item.goodsInfo[0])
      })

      var total = self.calculate(goodsList, self.data._discounts)
      self.setData({
        goodsList: goodsList,
        totalPrice: total
      })
      console.debug("goods:", this.data.goodsList)
      wx.hideLoading({
        success: (res) => { },
      })

    },
    moved: function () {
      console.debug("moved")
    },
    detached: async function () {
      console.debug("cart detached")

      //保存状态
      var cart = []
      this.data.goodsList.forEach(item => {
        var cartItem = {
          id: item._id,
          count: item.count,
          selected: item.selected
        }
        cart.push(cartItem)
      })


      let self = this
      cart.forEach(cartItem => {
        var index = self.data._originalCart.findIndex(item => {
          return item.id == cartItem.id
        })

        if (index != -1) {
          if (cartItem.id != self.data._originalCart[index].id
            || cartItem.selected != self.data._originalCart[index].selected
            || cartItem.count != self.data._originalCart[index].count) {
            self.data._dirty = true
          }
        }
        else {
          self.data._dirty == true
        }

      })

      if (cart.length != this.data._originalCart.length) {
        this.data._dirty = true
      }

      console.debug("dirty:", this.data._dirty)
      if (!this.data._dirty) {
        return;
      }

      wx.showLoading({
        title: '更新购物车状态'
      })

      var res = await wx.cloud.callFunction({
        name: 'cart-op',
        data: {
          cmd: 'save',
          cart: cart
        }
      })

      console.debug(res)
      wx.hideLoading({
        success: (res) => { },
      })

    },
    ready: function () {
      console.debug("ready")
    }

  },
  pageLifetimes: {
    show: function () { },
    hide: function () {
      console.debug("hide")
    },
    resize: function () { },

  },

  /**
   * Component methods
   */
  methods: {

    onNumChanged: function (e) {
      console.log(e)
      var index = e.target.dataset.index
      //先找出来原来的商品订购价购
      if (this.data.goodsList[index].order_price == null) {
        this.data.goodsList[index].order_price = 0
      }
      var old_order = Number(this.data.goodsList[index].order_price.toFixed(2))
      var new_order = Number((this.data.goodsList[index].price * e.detail).toFixed(2))
      this.data.goodsList[index].order_price = new_order//更新单个商品订单总价
      this.data.goodsList[index].count = e.detail

      console.log("new order:" + new_order)
      console.log("old order:" + old_order)
      if (this.data.goodsList[index].selected) {
        this.setData({
          ['goodsList[' + index + '].order_price']: new_order
        })

        var totalPrice = this.calculate(this.data.goodsList, this.data._discounts)
        this.setData({
          totalPrice: totalPrice //更新总价
        })

      } else {
        this.setData({
          ['goodsList[' + index + '].order_price']: new_order
        })
      }
    },
    onDeleteItem: function (e) {
      console.log(e)
      this.data._removedList.push(e.detail.data)//Button的Data为商品ID，会作为参数传进来
      var index = this.data.goodsList.findIndex(item => item._id == e.detail.data)
      console.debug("delete index:", index)
      var recalc = false
      if (this.data.goodsList[index].selected) {
        recalc = true
      }
      this.data.goodsList.splice(index, 1)
      this.setData({
        goodsList: this.data.goodsList
      })

      if (recalc) {
        var totalPrice = this.calculate(this.data.goodsList, this.data._discounts)
        this.setData({
          totalPrice: totalPrice,  //取消选中，如果数量大于0更新总价
        })
      }

    },

    onItemClicked: function (e) {
      console.debug(e)
      var index = e.target.dataset.index
      var selected = !this.data.goodsList[index].selected
      if (selected && (this.data.goodsList[index].count == 0
        || this.data.goodsList[index].count == null)
      ) {
        var new_order = Number((this.data.goodsList[index].price * 1).toFixed(2))
        this.setData({
          [`goodsList[${index}].order_price`]: new_order,
          [`goodsList[${index}].count`]: 1
        })
      }
      this.setData({
        ['goodsList[' + index + '].selected']: selected
      })

      var totalPrice = this.calculate(this.data.goodsList, this.data._discounts)
      this.setData({
        totalPrice: totalPrice
      })

    },
    onSubmitOrder: async function (e) {
      wx.showModal({
        title : '下一节实现',
        content : '微信小程序云开发实战：网上商城（六）',
        showCancel : false

      })
    },
    calculate: function (goodsList, discounts = []) {

      var totalPrice = 0
      var selectedGoods = []
      goodsList.forEach(item => {
        if (item.selected) {
          item.order_price = Number((item.price * item.count).toFixed(2)) //单位为元
          totalPrice += item.order_price * 100 //单位为分
          selectedGoods.push(item)
        }
      })

      var sorted = selectedGoods.sort(function (a, b) {
        return a.price - b.price
      })

      console.debug("sorted selected goods:", sorted)
      var cutPriceList = []
      for (var index = 0; index < discounts.length; index++) {
        var discountGoods = []
        var totalCount = 0
        var total_Price = 0
        sorted.forEach(item => {
          if (discounts[index].goods.indexOf(item._id) != -1) {
            discountGoods.push(item)
            totalCount += item.count
            total_Price += item.order_price
          }
        })

        var cutPrice = 0;

        switch (discounts[index].type) {
          case "1": {//1 满N减M
            if (total_Price >= discounts[index].total) {
              cutPriceList.push({
                title: discounts[index].title,
                cut: discounts[index].cut*100 //分
              })
            }
          }
            break;
          case "2": {//2 每满N减M

            var number = Number.parseInt(total_Price / discounts[index].total)
            if(number > 0){
              cutPriceList.push({
                title : discounts[index].title,
                cut : discounts[index].title.cut*number*100 //分
              })
            }

          }
            break;
          case "3": {//3 N免M
            if (totalCount < discounts[index].total) {
              break
            }

            var cutCount = discounts[index].cut
            var start = 0
            while (cutCount > 0) {
              var count = 1
              if (cutCount - discountGoods[start].count > 0) {
                cutCount -= discountGoods[start].count
                count = discountGoods[start].count
              } else {
                count = cutCount
                cutCount = 0
              }
              cutPrice += Number((discountGoods[start].price * count).toFixed(2)) * 100
              start++
            }

            cutPriceList.push({
              title : discounts[index].title,
              cut : cutPrice
            })
            
          }
            break;
        }
      }
      var sortedCutPriceList = cutPriceList.sort(function (a, b) {
        return a.cut - b.cut
      })

      console.debug("totalPrice:", totalPrice)
      console.debug("sortedCutPriceList:", sortedCutPriceList)

      sortedCutPriceList.forEach(item =>{
        totalPrice -= item.cut
      })
      return totalPrice 

    }
  }
})
