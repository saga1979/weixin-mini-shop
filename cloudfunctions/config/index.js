// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (request) => {
  console.log(request)
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const _ = db.command
  const col = db.collection('configs')

  switch (request.cmd) {

    case 'goodsTypes-get':{
      const configs = db.collection('configs')
      var result = await configs.field({
        goodsTypes : true
      }).where({
        openid : wxContext.OPENID
      }).get()

      return {
        success : true,
        data :  result.data.length > 0 ? result.data[0].goodsTypes : []
      }
    }
    case 'goodsTypes-add':{
      var data = request.data
      data.openid = wxContext.OPENID
      var ret = await col.where({
        openid : data.openid
      }).count()

      if(ret.total == 0){
        //新增配置
        ret = col.add({
          data:data
        })

        return {
          success :true,
          data : ret._id
        }
      }else{
        //更新类型列表
        ret = await col.where({
          openid : data.openid
        }).update({
          data:{
            goodsTypes : _.push(request.data)
          }
        }) 

        return {
          success : ret.stats.updated == 1
        }
      }
     
    }
    case 'goodsTypes-delete':{
       
      break
    }
    case 'goodsTypes-set' :{
      var data = {
        openid : wxContext.OPENID,
        modified: request.data.modified,
        added : request.data.added,
        deleted : request.data.deleted
      }
      console.log("data:", data)
  
      var ret = await col.where({
        openid : data.openid
      }).count()

      console.log("total:",ret.total)
      if(ret.total == 0){
        //新增配置
        console.log("data:", data)
        ret = await col.add({
          data:  {
            openid : data.openid,
            goodsTypes:  data.added
          }
        })
        console.log(ret)
        return {
          success :true,
          data : ret._id
        }
      }else{
        //更新类型列表
        ret = await col.field({
          goodsTypes : true
        }).where({
          openid : data.openid
        }).get()

        console.log(ret)
        var goodsTypes = ret.data[0].goodsTypes

        var finalTypes = []
        
        if(data.modified.length !=0){
          for(var index = 0; index < data.modified.length; index++){
            goodsTypes[data.modified[index].index] = data.modified[index]
            delete goodsTypes[data.modified[index].index].index
          }
        }

        for(var index =0; index < goodsTypes.length; index++){
          if(data.deleted.findIndex(o => o == index) != -1){
            console.log("deleted:", index)
            continue
          }
          finalTypes.push(goodsTypes[index])
        }

        finalTypes = finalTypes.concat(data.added)
        console.log("finale types:", finalTypes)

        ret = await col.where({
          openid : data.openid
        }).update({
          data:{
            goodsTypes : finalTypes
          }
        }) 

        return {
          success : ret.stats.updated == 1
        }
      }

      break;
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