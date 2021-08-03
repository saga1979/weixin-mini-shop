// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const OPNEID_FIELD = "openid"
const CART_FIELD = "cart"
// 云函数入口函数
exports.main = async (request) => {
  const db = cloud.database()
  const _ = db.command
  const wxContext = cloud.getWXContext()
  console.log(request)
  const collection = db.collection('users')
  let success = false
  let data = ''
  switch (request.cmd) {
    case "add": {
      const user = await collection.where({
        openid: wxContext.OPENID,
        cart: _.exists(true)
      }).get()
      //登陆的时候会创建空记录，此时只需要合并记录
      
      var old_items = user.data.length > 0 ? user.data[0].cart : []
      console.log("old cart:", old_items)
      var add_items = []
      request.data.ids.forEach(id => {
        var has = false
        for (var index =0; index < old_items.length; index++){
          if( id == old_items[index].id){
            old_items[index].count != null ? old_items[index].count +=1 : old_items[index].count = 1
            old_items[index].selected = true
            has = true
            console.log("seem item:", old_items[index])
          }
        }
        if (!has) {
          add_items.push({
            id: id,
            selected: true,
            count: 1
          })
        }
      })
     // var new_items = [...new Set([...old_items, ...add_items])]
      var new_items = add_items.concat(old_items)
      console.log("new items:", new_items)
      await collection.where({
        openid: wxContext.OPENID
      }).update({
        data: {
          cart: new_items
        }
      }).then(res => {
        if (res.stats.updated == 1) {

        } else {
        }

        success = true
        data = res.stats.updated
      }).catch(console.error)

      return {
        success: success,
        data: data
      }
    }
    case "get": {
      const res = await collection.aggregate()
        .unwind('$cart')
        .lookup({
          from: 'goods',
          localField: 'cart.id',
          foreignField: '_id',
          as: 'goodsInfo'
        })
        .project({
          addressBook: 0,
          info: 0,
          orders: 0,
          _id: 0
        })
        .end()
      return {
        success: true,
        data: res
      }
    }
    case "delete": {
      const user = await collection.where({
        openid: wxContext.OPENID
      }).get()
      var old_goods = user.data[0].cart
      var now_goods = old_goods.filter(item => request.items.indexOf(item.id) == -1)
      const ret = await collection.where({
        openid: wxContext.OPENID
      }).update({
        data: {
          cart: now_goods
        }
      })

      if (ret.stats.updated > 0) {
        success = true
      }

      return {
        success: success,
        data: ret.stats.updated
      }
    }
    case "save": {
      const res = await collection.where({
        openid: wxContext.OPENID
      }).update({
        data: {
          cart: request.cart
        }
      })

      return {
        success: res.stats.updated == 1,
        data: res.stats.updated
      }

    }
    default:
      break;
  }
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}