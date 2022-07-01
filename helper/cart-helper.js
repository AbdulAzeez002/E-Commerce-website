const db = require('../config/connection')
const collection = require('../config/collections')
const { use } = require('../routes/user')
const { get } = require('../app')
const objectId = require('mongodb').ObjectId


module.exports = {

  AddToCart: (proId, userId, brand) => {

    let proObj = {
      item: objectId(proId),
      quantity: 1,
      orderStatus: "Ordered",
      orderCancel: false,
      brand: brand
    }
    return new Promise(async (resolve, reject) => {

      let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })


      if (userCart) {
        let proExist = userCart.products.findIndex(product => product.item == proId)
        console.log(proExist)
        if (proExist != -1) {
          db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
            { $inc: { 'products.$.quantity': 1 } }
          ).then(() => {
            resolve()
          })
        }
        else {

          db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
            {
              $push: { products: proObj }

            }).then((response) => {
              resolve(response)
            })

        }

      }

      else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj]
        }

        db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
          resolve(response)
        })
      }

    })
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
        {
          $match: { user: objectId(userId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            subtotal: '$products.subtotal',
            item: '$products.item',
            quantity: '$products.quantity',

          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'products'
          }

        },

        {
          $project: {
            item: 1, quantity: 1, subtotal: 1, products: {
              $arrayElemAt: ['$products', 0]

            }

          }
        },

      ]).toArray()

      resolve(cartItems)
    })

  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0
      let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

      if (cart) {
        count = cart.products.length

      }

      resolve(count)
    })
  },

  changeCartQuantity: (details) => {

    count = parseInt(details.count)
    return new Promise(async (resolve, reject) => {

      const cart = await db.get().collection(collection.CART_COLLECTION).findOne({ _id: objectId(details.cart) })

      const product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(details.product) })

      if (cart) {
        if (details.quantity >= product.stock && details.count == 1) {
          resolve({ error: true })
        } else {

          if (details.count == -1 && details.quantity == 1) {

            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
              {
                $pull: { products: { item: objectId(details.product) } }
              }).then((response) => {
                resolve({ removeProduct: true })
              })

          }
          else {

            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
              {
                $inc: { 'products.$.quantity': count }
              }).then((response) => {

                resolve({ status: true })
              })

          }

        }
      }



    })
  },

  changeCartSubtotal: (details) => {
    console.log(details);

    count = parseInt(details.count)
    quantity = parseInt(details.quantity)
    price = parseInt(details.price)

    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {

        db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
          {
            $pull: { products: { item: objectId(details.product) } }
          }).then((response) => {
            resolve({ removeProduct: true })
          })

      }
      else {

        let subtotal = price * (quantity + count)

        db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
          {
            $set: { 'products.$.subtotal': subtotal }
          }).then((response) => {
            console.log(response);
            resolve()
          })
      }

    })
  },
  removeCartProduct: (details) => {

    return new Promise((resolve, reject) => {

      db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
        {
          $pull: { products: { item: objectId(details.product) } }
        }).then((response) => {
          resolve({ removeProduct: true })
        })

    })
  },

  getSubTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
        {
          $match: { user: objectId(userId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity',


          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'products'
          }

        },
        {
          $project: {
            item: 1, quantity: 1, products: {
              $arrayElemAt: ['$products', 0]

            }


          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: [
                  { $toInt: '$quantity' }, { $toInt: '$products.price' }]
              }
            }


          }

        }

      ]).toArray()

      resolve(total[0].total)
    })

  },


  AddToWishlist: (proId, userId) => {

    let proObj = {
      item: objectId(proId),
      quantity: 1
    }
    return new Promise(async (resolve, reject) => {

      let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })

      if (userWishlist) {
        let proExist = userWishlist.products.findIndex(product => product.item == proId)
        console.log(proExist)
        if (proExist != -1) {
          db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
            { $inc: { 'products.$.quantity': 1 } }
          ).then(() => {
            resolve()
          })
        }
        else {

          db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) },
            {
              $push: { products: proObj }

            }).then((response) => {
              resolve(response)
            })

        }
      }

      else {
        let wishlistObj = {
          user: objectId(userId),
          products: [proObj]
        }

        db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishlistObj).then((response) => {
          resolve(response)
        })
      }

    })
  },

  getWishlistProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let WishlistItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
        {
          $match: { user: objectId(userId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity',


          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'products'
          }

        },
        {
          $project: {
            item: 1, quantity: 1, products: {
              $arrayElemAt: ['$products', 0]

            }

          }
        }


      ]).toArray()
      resolve(WishlistItems)
    })

  },

  getWishlistCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0
      let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })

      if (wishlist) {
        count = wishlist.products.length

      }

      resolve(count)
    })
  },

  removeWishlistProduct: (details) => {

    return new Promise((resolve, reject) => {

      db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ _id: objectId(details.wishlist) },
        {
          $pull: { products: { item: objectId(details.product) } }
        }).then((response) => {
          resolve({ removeProduct: true })
        })

    })
  },

  getTotalAmountForOneProduct: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      let subtotal = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: {
              user: objectId(userId),
            },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $match: {
              item: objectId(proId),
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $project: {
              unitPrice: { $toInt: "$product.price" },
              quantity: { $toInt: "$quantity" },
            },
          },
          {
            $project: {
              _id: null,
              subtotal: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
            },
          },
        ])
        .toArray();
      if (subtotal.length > 0) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { user: objectId(userId), "products.item": objectId(proId) },
            {
              $set: {
                "products.$.subtotal": subtotal[0].subtotal,
              },
            }
          )
          .then((response) => {

            resolve(subtotal[0].subtotal);
          });
      } else {
        subtotal = 0;
        resolve(subtotal);
      }
    });
  },

  salesReport: (data) => {
    let response = {}
    let { startDate, endDate } = data

    let d1, d2, text;
    if (!startDate || !endDate) {
      d1 = new Date();
      d1.setDate(d1.getDate() - 7);
      d2 = new Date();
      text = "For the Last 7 days";
    } else {
      d1 = new Date(startDate);
      d2 = new Date(endDate);
      text = `Between ${startDate} and ${endDate}`;
    }
    // Date wise sales report
    const date = new Date(Date.now());
    const month = date.toLocaleString("default", { month: "long" });

    return new Promise(async (resolve, reject) => {

      let salesReport = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

        {
          $match: {
            date: {
              $lt: d2,
              $gte: d1,
            },
          },
        },
        {
          $match: { status: 'placed' }
        },
        {
          $group: {
            _id: { $dayOfMonth: "$date" },
            total: { $sum: "$totalAmountToBePaid" },
          },
        },
      ]).toArray();


      let brandReport = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            date: {
              $lt: d2,
              $gte: d1,
            },
          },
        },
        {
          $match: { status: 'placed' }
        },
        {
          $unwind: "$products",
        }, {
          $project: {
            brand: "$products.brand",
            quantity: "$products.quantity"
          }
        }, {
          $group: {
            _id: '$brand',
            totalAmount: { $sum: "$quantity" },

          }
        }

      ]).toArray()
      let orderCount = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gt: d1, $lt: d2 } }).count()


      let totalAmounts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: { date: { $gt: d1, $lt: d2 } }
        },
        {
          $match: { status: 'placed' }
        },
        {
          $group:
          {
            _id: null,
            totalAmount: { $sum: "$totalAmountPaid" }

          }
        }
      ]).toArray()

      let totalAmountRefund = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: { date: { $gt: d1, $lt: d2 } }
        },
        {
          $match: { status: 'placed' }
        },
        {
          $group:
          {
            _id: null,
            totalAmount: {
              $sum: '$amountToBeRefunded'
            }

          }
        }
      ]).toArray()

      console.log(totalAmountRefund);
      response.salesReport = salesReport
      response.brandReport = brandReport
      response.orderCount = orderCount
      response.totalAmountPaid = totalAmounts[0].totalAmount
      response.totalAmountRefund = totalAmountRefund[0].totalAmount

      resolve(response)
    })

  }




}