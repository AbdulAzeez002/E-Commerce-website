const db=require('../config/connection')
const collection=require('../config/collections')
const { use } = require('../routes/user')
const objectId=require('mongodb').ObjectId


module.exports={

    addCategory:(data)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(data).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },

    getCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let category=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
           
            resolve(category)
        })
    },
    deleteCategory:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).remove({_id:objectId(id)}).then((response)=>{
                resolve(response)
            })
        })
    },

    addBrand:(data)=>{
        
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BRAND_COLLECTION).insertOne(data).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },
    editBrand:(data)=>{
        
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BRAND_COLLECTION).updateOne({_id:objectId(data.id)},
            {
                $set:{brandName:data.brandName,
                logo:data.logo}
            }).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },



    getBrand:()=>{
        return new Promise(async(resolve,reject)=>{
            let brand=await db.get().collection(collection.BRAND_COLLECTION).find().toArray()
            // console.log(category);
            resolve(brand)
        })
    },

    getOneBrand:(id)=>{

        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BRAND_COLLECTION).findOne({_id:objectId(id)}).then((response)=>{
                resolve(response)
            })
        })

    },
    deleteBrand:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BRAND_COLLECTION).remove({_id:objectId(id)}).then((response)=>{
                resolve(response)
            })
        })
    },

    searchFilter :(brandFilter,categoryFilter,price) => {
        console.log('yyy is',brandFilter);
        console.log(categoryFilter);
        console.log(price);

       console.log('uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu');
       
        return new Promise(async (resolve, reject) => {
            

            if(brandFilter.length>0 && categoryFilter.length>0  ){
                console.log('9999999999999999999877777ggggggggggggggggggggggggggggg');
                let result = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                    {
                        $match:{$or:brandFilter}
                        
                    },

                    {
                        $match:{$or:categoryFilter}
                        
                    },
                    {
                        $match:{price:{$lt:price}}
                    }
                ]).toArray()
                console.log('0707077777777777777777777777777777777777777777707');
                console.log(result,'result is');
                resolve(result)
            } 

            else if(brandFilter.length>0 && categoryFilter.length==0  ){
                console.log('0000000000000000000000000000000000000000000000000000000');
 
              let  result = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                    {
                        $match:{$or:brandFilter}
                        
                    },
                    {
                        $match:{price:{$lt:price}}
                    }
                ]).toArray()
                console.log(result,'result is');
                resolve(result)
              

            }
            else if(brandFilter.length==0 && categoryFilter.length>0 ){
           console.log('96666674747474747474747477474747');
           let brand=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
           console.log('brand is',brand);
           let result = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
               
                
                {
                    $match:{$or:categoryFilter}
                    
                },
                {
                    $match:{price:{$lt:price}}
                }
            ]).toArray()
            console.log(result,'is result');
            resolve(result)
              }
            else{
                log('85555343434343434343434343434343434343434343434343434')
               let result= await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                    
                    {
                        $match:{price:{$lt:price}}
                    }
                ]).toArray()
                console.log(result,'result is');
                resolve(result)
            }
            // console.log("result is",result);
          
        })
        
      },

    //   getCategoryProducts:()=>{
        

        

    //     return new Promise(async(resolve,reject)=>{
    //       let products=await  db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
    //         {
    //             $match:{category:'Gaming'}
    //         }
    //       ]).toArray()

    //        console.log("",products);     
    //       resolve(products)
            
    //     })
    //   }

    
    






}