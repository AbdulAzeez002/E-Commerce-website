const db=require('../config/connection')
const collection=require('../config/collections')
const { use } = require('../routes/user')
const { response } = require('express')
const { promises } = require('nodemailer/lib/xoauth2')
const objectId=require('mongodb').ObjectId

const Razorpay = require('razorpay');
const { resolve } = require('path')

const keyId = process.env.key_id
const keySecret = process.env.key_secret


var instance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

module.exports={

    placeOder:(order,products,userId)=>{


let couponOff=0
        return new Promise(async(resolve,reject)=>{

          let coupon=await db.get().collection(collection.COUPON_COLLECTION).findOne({coupon:order.coupon})

          if(coupon){
             couponOff=coupon.offer
          }

          let totalAmount=parseInt(order.mainTotal)
          let subTotal=parseInt(order.subTotal)
          let grandTotal=parseInt(order.amountToBePaid)


  let status=order['paymentMethod']==='cod'?'placed':'pending'

   let orderObj={
       deliveryDetails:{

        FirstName:order.fname,
        lastName:order.lname,
        mobile:order.number,
        email:order.email,
        house:order.house,
        localPlace:order.localplace,
        town:order.town,
        pincode:order.pincode,
        district:order.district,
        state:order.state

       },
       userId:objectId(order.userId),
       paymentMethod:order['paymentMethod'],
       products:products,
       subtotal:subTotal,
       totalAmountWithoutShipping:totalAmount,
       totalAmountPaid:grandTotal,
       totalAmountToBePaid:grandTotal,

       couponPercent:couponOff,
       couponDiscount:order.discountedPrice,
       status:status,
       amountToBeRefunded:0,
       date:new Date()
   }

  
   db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{

    products.forEach(async (result) => {

      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(result.item)},
      { $inc: { stock: -result.quantity } })


    })

    db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})

       let userId = order.userId;
       userId = userId.toString();
       db.get()
         .collection(collection.COUPON_COLLECTION)
         .updateOne(
           { coupon: order.coupon },
           {
             $push: { users: userId },
             $inc: { limit: -1 },
           }
         )

       resolve(response.insertedId)
   })
})

    },

    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{

            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})

          
            console.log(cart.products)

            resolve(cart.products)

        })
    },

    getOrderDetails:(orderId,userId)=>{
        
        return new Promise(async(resolve,reject)=>{
            let orderItems= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
              {
                $match:{$and:[{userId:objectId(userId)},{_id:objectId(orderId)}]}

                
                
              },
              {
                  $unwind:'$products',

              },
              {
                  $project:{
                      item:'$products.item',
                      quantity:'$products.quantity',
                      orderStatus:'$products.orderStatus',
                      subtotal:'$products.subtotal'
                    
                  }
              },
              {
                  $lookup:{
                      from:collection.PRODUCT_COLLECTION,
                      localField:'item',
                      foreignField:'_id',
                      as:'products'
                  }

              },
              {
                $project:{
                    subtotal:1,item:1,orderStatus:1,quantity:1,products:{$arrayElemAt:['$products',0]
                        
                    }
                    
                    
                } 
              }


             
            ]).toArray()
            // console.log(orderItems)
            resolve(orderItems)
        })
        
    },



    getOrderDetailsdd:(userId)=>{
      return new Promise(async(resolve,reject)=>{
       let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray();
       
       resolve(orders)

      })
         
      
  },

  getAllOrderDetails:()=>{
    return new Promise(async(resolve,reject)=>{
     let orders=await db.get().collection(collection.ORDER_COLLECTION).find().toArray();
     console.log(orders);
     resolve(orders)

    })
       
    
},

getOneOrder:(orderId)=>{
  return new Promise(async(resolve,reject)=>{
  let order=await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(orderId)})
  resolve(order)
 
  })
},



    
    getOrder:(userId,orderId)=>{
        return new Promise(async(resolve,reject)=>{
        let order=await db.get().collection(collection.ORDER_COLLECTION).findOne({$and:[{userId:objectId(userId)},{_id:objectId(orderId)}]})
       
        resolve(order)
       
        })
    },

    generateRazorpay: (orderId, totalPrice) => {
        return new Promise((resolve, reject) => {
          var options = {
            amount: totalPrice*100,
            currency: "INR",
            receipt: orderId.toString(),
          };
          instance.orders.create(options, (err, order) => {
            if (err) {
              console.log(err);
            } else {
              console.log("new order",order);
              resolve(order);
            }
          });
        });
      },

      verifyPayment:(details)=>{
          console.log(details)
          return new Promise((resolve,reject)=>{
              const crypto=require('crypto')
              let hmac=crypto.createHmac('sha256','MIIpo4aDZA5BABgw5C3VOmG6')

              hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
              hmac=hmac.digest('hex')

              if(hmac==details['payment[razorpay_signature]']){
                  console.log('same')
                  resolve()
              }
              else{
                  console.log('no match')
                  reject()
              }
          })
      },

      changePaymentStatus:(orderId)=>{
          return new Promise((resolve,reject)=>{
              db.get().collection(collection.ORDER_COLLECTION)
              .updateOne({_id:objectId(orderId)},
              {
                  $set:{
                      status:'placed'
                  }
              }).then(()=>{
                  resolve()
              })
          })
      },

      getOrderDetails2:(orderId)=>{
        // console.log(orderId+'yyyyyyyyyyyyyyyyyyyyyy')
        return new Promise(async(resolve,reject)=>{
            let orderItems= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
              {
                $match:{_id:objectId(orderId)}

               
              },
              {
                  $unwind:'$products',

              },
              {
                  $project:{
                      item:'$products.item',
                      quantity:'$products.quantity',
                      orderStatus:'$products.orderStatus',
                    
                  }
              },
              {
                  $lookup:{
                      from:collection.PRODUCT_COLLECTION,
                      localField:'item',
                      foreignField:'_id',
                      as:'products'
                  }

              },
              {
                $project:{
                    item:1,orderStatus:1,quantity:1,products:{$arrayElemAt:['$products',0]
                        
                    }
                    
                    
                } 
              }


             
            ]).toArray()
            resolve(orderItems)
        })
        
    },

    getOrder2:(orderId)=>{
      return new Promise(async(resolve,reject)=>{
      let order=await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(orderId)})
      
      resolve(order)
     
      })
  },

  updateOrderStatus:(data)=>{
    console.log(data);
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION)
        .updateOne({_id:objectId(data.orderId),'products.item':objectId(data.proId)},
            {
                $set: {
                   "products.$.orderStatus":data.orderStatus
                  }  
            }).then((response)=>{
              console.log(response);
                resolve(response)
            })
    })
},


cancelSingleProductOrder:(data)=>{
  let quantity=parseInt(data.quantity)
  discountPrice=(parseInt(data.price)*quantity)-(parseInt(data.discountPercent)*parseInt(data.price)*quantity/100).toFixed(0);
  price=parseInt(data.price)*quantity
  
  console.log(price);
  return new Promise((resolve,reject)=>{
    db.get().collection(collection.ORDER_COLLECTION).updateMany({_id:objectId(data.orderId)},
    
    { $inc: { 
      totalAmountWithoutShipping:-(discountPrice) ,subtotal:-(price),totalAmountToBePaid:-(discountPrice),amountToBeRefunded:discountPrice
    }}
    
    ).then(async()=>{

     await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(data.orderId),'products.item':objectId(data.proId)},
      {
        $set:{
          'products.$.orderStatus':'cancelled',
          'products.$.orderCancel':true,

        }
      });


      let product=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match:{_id:objectId(data.orderId)}
        },
       
       
        {
          $project:{
            _id:0,
            products:1
          }
        },
        {
          $unwind:'$products',

      },
      {
        $project:{
            item:'$products.item',
            quantity:'$products.quantity',
            orderStatus:'$products.orderStatus'
         
        }
    },
    {
      $match:{'products.orderCancel':false}
    }

      ]).toArray()

     
      console.log(product);
      console.log(product.length);
      
       
        if(product.length==0){
          
          await db.get().collection(collection.ORDER_COLLECTION).updateMany({_id:objectId(data.orderId)},
          {
            $inc:{amountToBeRefunded:40,totalAmountToBePaid:-40

            }
          })
          resolve({status:false})
        
      }
      else{
        resolve({status:true})
      }
      
  })

  })
},

}