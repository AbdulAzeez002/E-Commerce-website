var db=require('../config/connection')
var collection=require('../config/collections')


module.exports={
    doLogin:(data)=>{

        return new Promise(async(resolve,reject)=>{

            let response={}

            let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({$and:[{email:data.email},{password:data.password}]})

            if(admin){
                response.status=true
                resolve(response)
            }
            else{
                resolve({status:false})
            }


        })

    },
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let userdata=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(userdata);
            console.log(userdata)

        })
    }
}