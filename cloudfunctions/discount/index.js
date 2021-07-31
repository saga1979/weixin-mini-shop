// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (request) => {
  console.log("request:", request)
  const wxContext = cloud.getWXContext()

  const col = db.collection('discount')
  switch (request.cmd) {
    case 'add': {

      request.data.start = new Date(request.data.start)
      request.data.end = new Date(request.data.end)
      request.data.openid = wxContext.OPENID
      var ret = await col.add({
        data: request.data
      })

      return {
        success: ret._id != null ? true : false,
        data: ret._id
      }
    }
    case 'update': {
      if (request.data.start != null) {
        request.data.start = new Date(request.data.start)
      }
      if (request.data.end != null) {
        request.data.end = new Date(request.data.end)
      }

      var id = request.data.id

      var ret = await col.where({
        _id: id
      }).update({
        data: request.data.update
      })

      return {
        success: ret.stats.updated == 1 ? true : false
      }
    }
    case "get": {
      var ret = {}
      if (request.where != null) {
        ret = await col.where(request.where).get()
      } else {
        ret = await col.where({
          openid: wxContext.OPENID
        }).get()
      }


      return {        
        data: ret.data
      }
    }
    case 'get-valid':{
      var now = new Date()
      var ret = await col.where({
        openid : wxContext.OPENID,
        start : _.lte(now),
        end : _.gt(now),
        stopped : _.not(_.eq(true))
      }).get()

      return {    
        data: ret.data
      }
    }
    case 'delete':{
      var ret = await col.where({
        _id : _.in(request.ids)
      }).remove()

      return {
        success : ret.stats.removed > 0 ? true : false,
        data : ret.stats.removed
      }
    }
    default: {
      return {
        success: false,
        data: "不支持的操作命令"
      }
    }
  }

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}