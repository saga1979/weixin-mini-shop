// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({

  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (request) => {
  console.log("requst:", request)
  const wxContext = cloud.getWXContext()

  const collection = db.collection('goods')
  let success = false
  switch (request.cmd) {
    case "set":

      var data = request.data
      data.openid = wxContext.OPENID
      if (data.date != null) {
        data.date = new Date(data.date)
      }
      await collection.add({
        data: data
      }).then(result => {
        success = true
        data = result._id
      }).catch(err => {
        console.error(err)
        data = { err }
      })

      return {
        success: success ? true : false,
        data: data
      }

    case "update":
      try {
        collection.where({
          _id: request._id
        }).update({
          data: request.data
        })
      } catch (e) {
        console.error(e)
        return {
          success: false
        }
      }
      return {
        success: true,
        data: request._id
      }

    case "delete":
      await collection.where({
        _id: request.data.id
      }).remove().then(result => {
        success = true
        return result.stats.removed
      }).catch(err => {
        console.log(err)
      })
      return {
        success: success,
        msg: success ? "成功" : "去看云函数记录吧"
      }

    case "get": {

      var res = null
      if (request.data != null && request.data.where != null) {
        res = await collection.where(request.data.where).get()
      } else {
        res = await collection.get()
      }

      if (res.data.length > 0) {
        success = true
      }
      return {
        success: success,
        data: res.data
      }
    }

    case 'update-recommend': {
      var onres = await collection.where({
        _id: _.in(request.onList)
      }).update({
        data: {
          recommend: true
        }
      })

      var offres = await collection.where({
        _id: _.in(request.offList)
      }).update({
        data: {
          recommend: false
        }
      })

      return {
        success: true,
        data: {
          on: onres.stats.updated,
          off: offres.stats.updated
        }
      }
    }
    case 'get-recommend':{
      var res = await collection.where({
        recommend : true,
        isSelling : _.neq(false),
        deleted : _.neq(true)
      }).get()

      return {
        success : true,
        data : res.data
      }
    }
    case "get-notTypes":{
      var types = request.data.types
      var fetched = request.data.fetched
      var res = await collection.skip(fetched).where({ type: _.not(_.in(types) )}).get()
      return {
        success: res.data.length > 0 ? true : false,
        data: res.data
      }
    }

    case "get-byTypes": {
      var types = request.data.types
      var fetched = request.data.fetched
      var res = await collection.skip(fetched).where({ type: _.in(types) }).get()
      return {
        success: res.data.length > 0 ? true : false,
        data: res.data
      }
    } 

    default:
      return {
        success: false,
        msg: "不支持的操作"
      };

  }


}