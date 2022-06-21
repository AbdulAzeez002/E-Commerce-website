var db = require('../config/connection')
var collection = require('../config/collections')
const { promises } = require('nodemailer/lib/xoauth2')
const { LogContext } = require('twilio/lib/rest/serverless/v1/service/environment/log')
var objectId = require('mongodb').ObjectId


module.exports = {

    uploadFiles: (data) => {
        let stock = parseInt(data.stock)
        let price = ((parseInt(data.MRP)) - (parseInt(data.price)) * 0.01 * (parseInt(data.discount))).toFixed(0);

        data.price = price;
        data.stock = stock;
        let response = {}
        return new Promise(async (resolve, reject) => {

            data.date = new Date();
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(data).then((datas) => {

                console.log(datas)

                response.id = datas.insertedId
                // response.status=true

                resolve(response)






            })

        })
    },

    uploadImage: (proId, img1, img2, img3, img4) => {

        let response = {}

        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) },
                {
                    $set: {
                        image: [
                            { image1: img1 },
                            { image2: img2 },
                            { image3: img3 },
                            { image4: img4 }

                        ]
                    }
                }
            ).then((result) => {
                console.log(result)

                resolve(result)
            })
        })
    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products);
        })
    },

    deleteProduct: (proId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).remove({ _id: objectId(proId) }).then((response) => {
                console.log(response)
                resolve(response)
            })
        })
    },
    findaProduct: (proId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((response) => {
                console.log(response)
                resolve(response)
            })
        })
    },




    editProduct: (data, proId, img1, img2, img3, img4) => {

        console.log(data.MRP);
        console.log(data.price);


        let price = ((parseInt(data.MRP)) - (parseInt(data.price)) * 0.01 * (parseInt(data.discount))).toFixed(0)

        console.log(price);
        let newPrice = parseInt(price)

        let stock = parseInt(data.stock)


        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) },
                {
                    $set: {
                        productName: data.productName,
                        brand: data.brand,
                        processorType: data.processorType,
                        processorName: data.processorName,
                        category: data.category,
                        screenSize: data.screenSize,
                        storageType: data.storageType,
                        storageCapacity: data.storageCapacity,
                        ram: data.ram,
                        weight: data.weight,
                        MRP: data.MRP,
                        price: newPrice,
                        operatingSystem: data.operatingSystem,
                        operatingSystemName: data.operatingSystemName,
                        warranty: data.warranty,
                        stock: stock,
                        inBox: data.inBox,
                        color: data.color,
                        shippingCost: data.shippingCost,
                        fingerPrintSesnsor: data.fingerPrintSesnsor,
                        battery: data.battery,
                        discount: data.discount,
                        description1: data.description1,
                        description2: data.description2,
                        additionalFeatures: data.additionalFeatures,

                        image: [{ image1: img1 },
                        { image2: img2 },
                        { image3: img3 },
                        { image4: img4 }]

                    }
                }
            ).then((response) => {
                resolve(response)
            })

        })
    },

    findProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                resolve(product)
            })

        })
    },
    findProducts: (data) => {
        let response = {}
        return new Promise(async (resolve, reject) => {

            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(data) })
            if (product) {

                resolve(product)
            }

            else {
                response.status = false
                resolve(response)
            }




            // console.log(product)
            // resolve(product)
        })


    },




    productDetail: (id) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(id) }).then((prod) => {
                resolve(prod)
            })
        })
    },

    UpdateProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(proId) },
                    {
                        $set: {
                            wishlist: true
                        }
                    }, { upsert: true }).then((response) => {
                        resolve(response)
                    })
        })
    },

    // UpdateProductDetail:(proId)=>{
    //     return new Promise((resolve,reject)=>{
    //         db.get().collection(collection.PRODUCT_COLLECTION)
    //         .updateOne({_id:objectId(proId)},
    //         {
    //             $set:{
    //                 wishlist:false
    //             }
    //         }).then((response)=>{
    //             resolve(response)
    //         })
    //     })
    // },

    getOneProduct: (data) => {
        return new Promise(async (resolve, reject) => {

            let product = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(data.orderId) }

                },
                {
                    $unwind: '$products'
                },
                {
                    $match: { 'products.item': objectId(data.proId) }
                },
                {

                    $project: {
                        quantity: '$products.quantity',
                        item: '$products.item',

                        status: '$products.orderStatus',
                        subtotal: '$products.subtotal',

                        couponPercent: '$couponPercent',
                        couponDiscount: '$couponDiscount',




                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }

                },
                {
                    $project: {
                        couponPercent: 1, couponDiscount: 1, item: 1, quantity: 1, status: 1, subtotal: 1, product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }


            ]).toArray()
            resolve(product)

        })
    },

    getSearchProducts: (key) => {
        return new Promise(async (resolve, reject) => {
            let products = await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .find({
                    $or: [
                        { productName: { $regex: new RegExp("^" + key + ".*", "i") } },
                        { brand: { $regex: new RegExp("^" + key + ".*", "i") } },
                        { category: { $regex: new RegExp("^" + key + ".*", "i") } },
                    ],
                })
                .toArray();
            resolve(products);
        });
    },

    getBrand: (brand) => {
        console.log(brand);
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match: {
                        brand: brand
                    }
                }
            ]).toArray()
            console.log('', products);
            resolve(products)
        })
    },

    latestProducts: () => {

        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({})
                .sort({ date: -1 })
                .limit(8)
                .toArray()

            resolve(products)
        })
    },

    addReview: (data) => {

        return new Promise(async(resolve, reject) => {

            let product = await db.get().collection(collection.PRODUCT_COLLECTION)
                .findOne({ _id: objectId(data.proId) })

                
                console.log('333333333333333333333333333333333333333333333333333');

            if (product.reviews) {
console.log('9999999999999999999999999999999999999999');
                db.get().collection(collection.PRODUCT_COLLECTION)
                    .updateOne({ _id: objectId(data.proId) },
                        {
                            $push: { reviews:data }
                        }).then((response) => {
                            console.log(response);
                            resolve(response)
                        })

            }
            else {
                db.get().collection(collection.PRODUCT_COLLECTION)
                    .updateOne({  _id: objectId(data.proId) },
                        {
                            $push: { reviews:data }
                        }).then((response) => {
                            console.log('0000000000000000000000000000000000000');
                            console.log(response);
                            resolve(response)
                        })
            }


        })

    }




}