const db = require('../config/connection')
const collection = require('../config/collections')
const { use } = require('../routes/user')
const objectId = require('mongodb').ObjectId


module.exports = {

    addCategory: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(data).then((response) => {
                console.log(response);
                resolve(response)
            })
        })
    },

    getCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()

            resolve(category)
        })
    },
    deleteCategory: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).remove({ _id: objectId(id) }).then((response) => {
                resolve(response)
            })
        })
    },

    addBrand: (data) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).insertOne(data).then((response) => {
                console.log(response);
                resolve(response)
            })
        })
    },
    editBrand: (data) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).updateOne({ _id: objectId(data.id) },
                {
                    $set: {
                        brandName: data.brandName,
                        logo: data.logo
                    }
                }).then((response) => {
                    console.log(response);
                    resolve(response)
                })
        })
    },

    getBrand: () => {
        return new Promise(async (resolve, reject) => {
            let brand = await db.get().collection(collection.BRAND_COLLECTION).find().toArray()

            resolve(brand)
        })
    },

    getOneBrand: (id) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).findOne({ _id: objectId(id) }).then((response) => {
                resolve(response)
            })
        })

    },
    deleteBrand: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).remove({ _id: objectId(id) }).then((response) => {
                resolve(response)
            })
        })
    },

    
    searchFilter :(brandFilter,categoryFilter,price) => {
       
        return new Promise(async (resolve, reject) => {
            let result

            if(brandFilter.length>0 && categoryFilter.length>0  ){
                 result = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
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
            } 

            else if(brandFilter.length>0 && categoryFilter.length==0  ){
 
                result = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                    {
                        $match:{$or:brandFilter}
                        
                    },
                    {
                        $match:{price:{$lt:price}}
                    }
                ]).toArray()


            }
            else if(brandFilter.length==0 && categoryFilter.length>0 )
            result = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
               
                {
                    $match:{$or:categoryFilter}
                    
                },
                {
                    $match:{price:{$lt:price}}
                }
            ]).toArray()

        
            else{
                 result = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                    
                    {
                        $match:{price:{$lt:price}}
                    }
                ]).toArray()
            }
            
            resolve(result)
        })
      }

}