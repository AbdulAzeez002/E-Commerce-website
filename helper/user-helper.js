var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const { ObjectId } = require('mongodb')
const { promises } = require('nodemailer/lib/xoauth2')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId

require('dotenv').config();
const email = process.env.email;
const password = process.env.password;
module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10) // 10 is salt round
            userData.newpassword = await bcrypt.hash(userData.newpassword, 10)

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })

            if (user) {
                reject({ status: false, msg: 'Email already taken' })
            }
            else {


                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((response) => {
                    var toEmail = userData.email;

                    var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: email,
                            pass: password,
                        }
                    });
                    transporter.sendMail({
                        from: email,
                        to: toEmail,
                        subject: 'Welcome Mail',
                        text: 'welcome to e store',
                        html: '<p>Welcome <b>to EStore</b></p>'
                    }, function (error, response) {
                        if (error) {
                            console.log('Failed in sending mail');
                        } else {
                            console.log('Successful in sending email');
                        }
                    });


                    resolve({ status: true })

                })
            }


        })


    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            console.log(user)
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    console.log(status);
                    if (status) {
                        console.log('login success')
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else {
                        console.log('login failed')
                        resolve({ status: false })
                    }
                })
            }
            else {
                console.log('login failed')
                resolve({ status: false })
            }
        })
    },

    doMobileCheck: (mobiles) => {

        return new Promise(async (resolve, reject) => {
            let response = {}

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: mobiles })
            console.log(user)

            if (user) {
                response.user = user
                response.status = true
                resolve(response)
            }

            else {
                resolve({ stauts: false })
            }

        })

    },
    updatePass: (data) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            data.pass1 = await bcrypt.hash(data.pass1, 10) // 10 is salt round
            data.pass2 = await bcrypt.hash(data.pass2, 10)
            let user1 = await db.get().collection(collection.USER_COLLECTION).findOne({ email: data.email })
            if (user1) {
                db.get()
                    .collection(collection.USER_COLLECTION)
                    .updateOne(
                        { email: data.email },
                        {
                            $set: {
                                password: data.pass1,
                                newpassword: data.pass2
                            }
                        }
                    ).then((details) => {
                        response.user = details
                        response.status = true
                        resolve(response)
                    })
            }

            else {
                resolve({ status: false })
            }
        })



    },
    deleteUser: (userId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).remove({ _id: objectId(userId) }).then((response) => {
                resolve(response)
            })
        })

    },
    blockUser: (userId) => {
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })

            if (user) {

                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $set: { block: true } }, { upsert: true }).then((response) => {
                    resolve(user.name)
                })

            }
        })
    },

    unblockUser: (userId) => {
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })

            if (user) {
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $set: { block: false } }, { upsert: true }).then((response) => {
                    resolve(user.name)
                })

            }
        })
    },
    findUser: (id) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(id) })

            resolve(user)


        })
    },
    updateUser: (details) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(details.userId) },
                    {
                        $set: { name: details.name, email: details.email, mobile: details.mobile }
                    }).then((response) => {
                        resolve(response)
                    })
        })


    },

    updateUserDetails: (userId, details) => {
        let address = {
            fname: details.fname,
            lname: details.lname,
            house: details.house,
            localplace: details.localplace,
            town: details.towncity,
            district: details.district,
            state: details.state,
            pincode: details.pin,
            email: details.email,
            mobile: details.mobile,
            id: details.fname + new Date()
        }

        return new Promise((resolve, reject) => {

            let user = db.get().collection(collection.USER_COLLECTION)
                .findOne({ _id: objectId(userId) })

            if (user.addresses) {

                db.get().collection(collection.USER_COLLECTION)
                    .updateOne({ _id: objectId(userId) },
                        {
                            $push: { addresses: address }
                        }).then((response) => {
                            resolve(response)
                        })

            }
            else {
                db.get().collection(collection.USER_COLLECTION)
                    .updateOne({ _id: objectId(userId) },
                        {
                            $push: { addresses: address }
                        }).then((response) => {
                            resolve(response)
                        })
            }


        })


    },
    getAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            resolve(user.addresses)
        })
    },

    editUserAddress: (id, userId, data) => {
        console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
        console.log(id);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(userId), 'addresses.id': id },
                    {
                        $set: {
                            "addresses.$.fname": data.fname,
                            "addresses.$.lname": data.lname,
                            "addresses.$.house": data.house,
                            "addresses.$.localplace": data.localplace,
                            "addresses.$.town": data.towncity,
                            "addresses.$.district": data.district,
                            "addresses.$.state": data.state,
                            "addresses.$.pincode": data.pin,
                            "addresses.$.mobile": data.mobile,
                            "addresses.$.email": data.email,
                        }
                    }).then((response) => {
                        resolve(response)
                    })
        })
    },
    findOneAddress: (id, userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(userId) }
                },
                {
                    $unwind: '$addresses'
                },
                {
                    $match: { 'addresses.id': id }
                },
                {
                    $project: {
                        addresses: 1,
                        _id: 0
                    }
                }
            ]).toArray()


            resolve(address[0].addresses)
            console.log(address[0].addresses);
        })
    },

    deleteUserAddress: (id, userId) => {
        console.log(id);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(userId) },
                    {
                        $pull: {
                            'addresses': { id: id }
                        }
                    }).then((response) => {
                        resolve(response)
                    })
        })
    }
}