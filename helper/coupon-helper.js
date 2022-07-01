const db = require('../config/connection')
const collection = require('../config/collections')
const { use } = require('../routes/user')
const objectId = require('mongodb').ObjectId

module.exports = {


  addNewCoupon: (data) => {
    console.log(data);
    return new Promise(async (resolve, reject) => {
      let starting = new Date(data.starting);
      let expiry = new Date(data.expiry);

      let dataObject = {
        coupon: data.coupon,
        offer: parseInt(data.offer),
        starting: starting,
        expiry: expiry,
        limit: parseInt(data.limit),
        users: [],
      };
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .insertOne(dataObject)
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getCoupon: () => {
    return new Promise((resolve, reject) => {
      let coupon = db.get().collection(collection.COUPON_COLLECTION).find().toArray();
      resolve(coupon)
    })
  },
  getCouponUser: () => {
    let todayDate = new Date();
    return new Promise((resolve, reject) => {
      let coupon = db.get().collection(collection.COUPON_COLLECTION).find({ expiry: { $gte: todayDate } }).toArray();
      resolve(coupon)
    })
  },
  startCouponOffer: (date) => {
    let couponStartDate = new Date(date);
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find({ starting: { $lte: couponStartDate } })
        .toArray();

      if (data) {
        await data.map(async (singleData) => {
          db.get()
            .collection(collection.COUPON_COLLECTION)
            .updateOne(
              { _id: objectId(singleData._id) },
              {
                $set: {
                  available: true,
                },
              },
              {
                upsert: true,
              }
            )
            .then(() => {
              resolve();
            });
        });
      } else {
        resolve();
      }
    });
  },

  validateCoupon: (data, userId) => {
    console.log(data);
    return new Promise(async (resolve, reject) => {
      console.log(data.coupon);
      obj = {};
      let coupon = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ coupon: data.coupon, available: true });
      console.log(coupon);

      if (coupon) {
        if (coupon.limit > 0) {
          let users = coupon.users;
          let checkUserUsed = users.includes(userId);

          if (checkUserUsed) {
            obj.couponUsed = true;
            obj.msg = " You Already Used A Coupon";
            console.log(" You Already Used A Coupon");
            resolve(obj);
          } else {
            let nowDate = new Date();
            date = new Date(nowDate);
            console.log(date)
            if (date <= coupon.expiry) {
              let total = parseInt(data.total);
              let percentage = parseInt(coupon.offer);
              let discoAmount = ((total * percentage) / 100).toFixed()
              obj.total = total - discoAmount;
              obj.success = true;
              resolve(obj);
            } else {
              obj.couponExpired = true;
              console.log("This Coupon Is Expired");
              resolve(obj)
            }
          }
        } else {
          obj.couponMaxLimit = true;
          console.log("Used Maximum Limit");
          resolve(obj)
        }
      } else {
        obj.invalidCoupon = true;
        console.log("This Coupon Is Invalid");
        resolve(obj)
      }
    });
  },

  deleteCoupon: (couponId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.COUPON_COLLECTION).remove({ _id: objectId(couponId) }).then(() => {
        resolve()
      })
    })

  },

  getOneCoupon: (couponId) => {
    return new Promise(async (resolve, reject) => {
      let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ _id: objectId(couponId) })
      resolve(coupon)
    })
  }
}