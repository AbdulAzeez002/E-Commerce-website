const express = require('express');
const router = express.Router();
let filterResult;
require('dotenv').config();
const ServiceSID = process.env.ServiceSID;
const AccountSID = process.env.AccountSID;
const authToken = process.env.authToken
const client = require('twilio')(AccountSID, authToken)
const productHelpers = require('../helper/product-helper');
const userHelpers = require('../helper/user-helper');
const cartHelpers = require('../helper/cart-helper');
const orderHelpers = require('../helper/order-helper');
const { resolveContent } = require('nodemailer/lib/shared');
const couponHelpers = require('../helper/coupon-helper');
const categoryHelper = require('../helper/category-helper');



let verifyUserLogin = (req, res, next) => {

  if (!req.session.userLoggedIn) {
    productHelpers.latestProducts().then(async (products) => {
      let brand = await categoryHelper.getBrand()
      res.render('user/home', { products, brand })
    })

  }
  else {
    let id = req.session.user._id
    userHelpers.findUser(id).then((user) => {
      if (user.block != true) {
        next();
      }
      else {
        req.session.userLoggedIn = false
        res.redirect('/login')
      }

    })

  }

}


/* GET home page. */
router.get('/', verifyUserLogin, async (req, res, next) => {
  try {
    const [cartCount, wishlistCount] = await Promise.all([
      cartHelpers.getCartCount(req.session.user._id), cartHelpers.getWishlistCount(req.session.user._id)
    ])
    let user = req.session.user
    if (!user) {
      throw new Error('user not found')
    }
    productHelpers.latestProducts().then(async (products) => {
      let brand = await categoryHelper.getBrand()
      res.render('user/home', { user, products, cartCount, wishlistCount, brand })
    })
  }
  catch (err) {
    alert(err.message)
    console.log(err.message);
  }

}

);



router.get('/login', function (req, res) {

  const alert = req.flash('msg')
  if (req.session.userLoggedIn) {
    res.redirect('/')
  }
  else {

    let logError = req.session.userlogginError
    res.render('user/login', { logError, alert });
    req.session.userlogginError = false
  }

});

router.get('/signup', function (req, res) {
  res.render('user/signup')
})

router.post('/signup', (req, res) => {
  console.log(req.body)
  userHelpers.doSignup(req.body).then((response) => {
    req.session.userMobile = req.body.mobile

    client.verify
      .services(ServiceSID)
      .verifications.create({
        to: `+91${req.body.mobile}`,
        channel: "sms"

      })

    res.redirect('/otp')

  }).catch((err) => {
    req.session.logErr = err.msg
    res.render('user/signup', { 'err': req.session.logErr })
  })


})


// otp verification starts:

router.post('/login', (req, res) => {
  console.log(req.body)
  userHelpers.doLogin(req.body).then((response) => {

    if (response.status) {

      if (response.user.block) {
        req.flash('msg', 'You are blocked by Admin!')
        res.redirect('/login')
      }
      else {
        req.session.userLoggedIn = true
        req.session.user = response.user

        res.redirect('/')

      }

    }
    else {
      req.session.userlogginError = 'invalid username or password'
      res.redirect('/login')
    }

  })
});

router.get('/user-logout', (req, res) => {
  req.session.userLoggedIn = null
  req.session.user = null
  res.redirect('/')
})

router.get('/otp', (req, res) => {
  let otpErr = req.session.otpErr

  res.render('user/otpp', { otp: true, mobile: req.session.userMobile, otpErr })
  req.session.otpErr = false
})

router.post('/otp', (req, res) => {
  let mob = req.session.userMobile

  client.verify
    .services(ServiceSID)
    .verificationChecks.create({
      to: `+91${mob}`,
      code: req.body.otp,
    }).then((response) => {
      console.log(response)
      if (response.valid) {

        res.redirect("/login");
      } else {

        req.session.otpErr = 'invalid otp'
        res.redirect("/otp");
      }
    })

})

//otp verification ends

//forgot password satarts

router.get('/forgot', (req, res) => {
  res.render('user/forgotpassword')
})

router.post('/forgot', (req, res) => {
  userHelpers.doMobileCheck(req.body.mobile).then((response) => {
    req.session.userMob2 = req.body.mobile
    if (response.status) {

      client.verify
        .services(ServiceSID)
        .verifications.create({
          to: `+91${req.body.mobile}`,
          channel: "sms"

        }).then((response) => {

          if (response.status) {

            res.redirect('/otp2')
          }
          else {
            res.redirect('/forgot')
          }
        })

    }
    else {
      res.redirect('/forgot')
    }
  })

})

router.get('/otp2', (req, res) => {
  let otpErr2 = req.session.otpErr2
  let mobile = req.session.userMob2
  res.render('user/otp2', { otp: true, otpErr2, mobile })
  req.session.otpErr2 = false

})

router.post('/passOtp', (req, res) => {
  let mob2 = req.session.userMob2

  client.verify
    .services(ServiceSID)
    .verificationChecks.create({
      to: `+91${mob2}`,
      code: req.body.otp,
    }).then((response) => {
      console.log(response)
      if (response.valid) {

        res.redirect("/new");
      } else {

        req.session.otpErr2 = 'invalid otp'
        res.redirect("/otp2");
      }
    })

})

router.get('/new', (req, res) => {
  res.render('user/newpassword')
})

router.post('/set-pass', (req, res) => {
  console.log(req.body)
  userHelpers.updatePass(req.body).then((response) => {
    console.log(response)
    if (response.status) {
      res.redirect('/login')
    }
    else {
      res.redirect('/new')
    }
  })
})

// forgot password ends



//cart

router.get('/cart', verifyUserLogin, async (req, res) => {
  let products = await cartHelpers.getCartProducts(req.session.user._id)
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  let user = req.session.user

  let subTotal = 0

  if (products.length > 0) {
    subTotal = await cartHelpers.getSubTotal(req.session.user._id)
    res.render('user/cart', { products, subTotal, user, cartCount })
  }
  else {
    res.render('user/cartEmpty', { user, otp: true })
  }

})

router.get('/AddToCart/:id', async (req, res) => {

  user = req.session.user

  let product = await productHelpers.findProduct(req.params.id)

  let brand = product.brand

  cartHelpers.AddToCart(req.params.id, req.session.user._id, brand).then(async (response) => {
    let total = await cartHelpers.getTotalAmountForOneProduct(req.params.id, req.session.user._id)
    console.log(total)
    res.json(response)
  })

});

router.post('/changeCartQuantity', async (req, res) => {


  let total = 0;
  cartHelpers.changeCartQuantity(req.body).then(async (response) => {

    if(response.error){
      res.json(response)
    }
    else{
      cartHelpers.changeCartSubtotal(req.body).then(() => {
        console.log('abc');
      })
      let products = await cartHelpers.getCartProducts(req.session.user._id)
      if (products.length > 0) {
        total = await cartHelpers.getSubTotal(req.body.user)
      }
      response.total = total
  
      res.json(response)
    }
    
  })
});

router.post('/removeProduct', (req, res) => {
  cartHelpers.removeCartProduct(req.body).then((response) => {

    res.json(response)
  })
});

router.get('/checkout/:id', async (req, res) => {
  let user = req.session.user
  let products = await cartHelpers.getCartProducts(req.session.user._id)
  if (products.length > 0) {
    let total = req.params.id
    let sum = parseInt(total)
    let grandTotal = sum + 40
    let Addresses = await userHelpers.getAddress(user._id)
    let coupon = await couponHelpers.getCouponUser()
    res.render('user/checkout', { user, Addresses, products, total, grandTotal, coupon })
  }
  else {
    res.render('user/cartEmpty', { user })
  }

})


router.post('/proceedToPay', async (req, res) => {
  let totalAmount = 0
  let products = await orderHelpers.getCartProductList(req.body.userId)
  if (products.length > 0) {
    totalAmount = await cartHelpers.getSubTotal(req.body.userId)
  }

  let userId = req.session.userId

  orderHelpers.placeOder(req.body, products, userId).then((orderId) => {


    req.session.order = orderId

    if (req.body['paymentMethod'] == 'cod') {


      res.json({ codStatus: true })
    }

    else {
      orderHelpers.generateRazorpay(orderId, totalAmount).then((response) => {

        res.json(response)


      })
    }

  })
});

router.get('/viewOrderDetails', async (req, res) => {
  let ids = req.session.order

  user = req.session.user

  let order = await orderHelpers.getOrderDetails(ids, user._id)  // products in order
  let orderDetails = await orderHelpers.getOrder(user._id, ids)   // order details

  let total = orderDetails.totalAmount


  let GrandTotal = parseInt(total) + 40

  user = req.session.user
  req.session.details = order

  let details = req.session.details

  res.render('user/paymentReciept', { order, user, orderDetails })
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body)
  orderHelpers.verifyPayment(req.body).then(() => {
    orderHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })

  }).catch((err) => {
    res.json({ status: false })

  })
});

router.get('/allProducts', async (req, res, next) => {

  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  let user = req.session.user
  productHelpers.getAllProducts().then((products) => {
    res.render('user/allProducts', { user, products, cartCount })
  })

}

);
router.get('/allProductsunlogg', async (req, res, next) => {

  productHelpers.getAllProducts().then((products) => {
    res.render('user/allProducts', { products })
  })

}

);

router.get('/AddToWishlist/:id', async (req, res) => {
  let user = req.session.user

  cartHelpers.AddToWishlist(req.params.id, req.session.user._id).then(async (response) => {

    UpdateProductDetail = await productHelpers.UpdateProductDetails(req.params.id)


    res.json(response)
  })






});

router.get('/wishlist', async (req, res) => {
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  let wishlistCount = await cartHelpers.getWishlistCount(req.session.user._id)
  let products = await cartHelpers.getWishlistProducts(req.session.user._id)
  let user = req.session.user

  if (products.length > 0) {
    res.render('user/wishlist', { products, user, wishlistCount, cartCount })
  }
  else {
    res.render('user/wishlistEmpty', { user })
  }

});

router.post('/delete-wishlist-product', (req, res) => {

  cartHelpers.removeWishlistProduct(req.body).then(async (response) => {


    res.json(response)
  })
});



router.post('/addToCart2', async (req, res) => {

  let product = await productHelpers.findProduct(req.body.product)

  let brand = product.brand

  cartHelpers.AddToCart(req.body.product, req.body.user, brand).then((response) => {

    cartHelpers.removeWishlistProduct(req.body).then(async (response) => {

      res.json(response)
    })

  })
})

router.get('/viewProduct/:id', async (req, res) => {

  if (req.session.userLoggedIn) {
    let cartCount = await cartHelpers.getCartCount(req.session.user._id)
    let wishlistCount = await cartHelpers.getWishlistCount(req.session.user._id)

    let product = await productHelpers.findProduct(req.params.id)
    let user = req.session.user

    res.render('user/viewProduct', { product, user, wishlistCount, cartCount })
  }
  else {
    let product = await productHelpers.findProduct(req.params.id)


    res.render('user/viewProduct', { product })
  }

})

router.get('/profile', (req, res) => {
  let user = req.session.user
  res.render('user/profile', { user })
})

router.get('/editProfile', (req, res) => {
  let user = req.session.user
  res.render('user/editProfile', { user, otp: true })
})

router.post('/editProfile-details', (req, res) => {

  userHelpers.updateUser(req.body).then((response) => {
    console.log(response);
    res.redirect('/profile')
  })

})

router.post('/AddToCarts', async (req, res) => {
  let product = await productHelpers.findProduct(req.body.product)

  let brand = product.brand

  cartHelpers.AddToCart(req.body.product, req.body.userId, brand).then((response) => {

    res.json(response)

  })
});

router.get('/address', async (req, res) => {
  let user = req.session.user
  let Addresses = await userHelpers.getAddress(user._id)

  res.render('user/Address', { user, Addresses })
})

router.get('/addAddress', (req, res) => {
  let user = req.session.user
  res.render('user/addAddress', { user })
})

router.post('/addAddress/:id', (req, res) => {
  let user = req.session.user
  userHelpers.updateUserDetails(req.params.id, req.body).then(async (response) => {
    let Addresses = await userHelpers.getAddress(req.params.id)
    res.redirect('/address')

  })
})

router.get('/deleteAddress/:id', (req, res) => {
  console.log('jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj');
  user = req.session.user
  userHelpers.deleteUserAddress(req.params.id, user._id).then((response) => {
    res.redirect('/address')
  })
})

router.get('/editAddress/:id', async (req, res) => {
  let user = req.session.user
  let id = req.params.id
  let address = await userHelpers.findOneAddress(id, user._id)
  res.render('user/editAddress', { user, id, address })
})

router.post('/editAddress', (req, res) => {
  user = req.session.user
  id = req.body.id

  userHelpers.editUserAddress(id, user._id, req.body).then((response) => {

    res.redirect('/address')


  })
});

router.get('/allOrders', (req, res) => {
  let user = req.session.user
  orderHelpers.getOrderDetailsdd(req.session.user._id).then((orders) => {

    res.render('user/allOrdersNew', { orders, layout: false, user })
  })

});

router.get('/viewOrderProducts/:id', async (req, res) => {

  
  let orderId = req.params.id
  let user = req.session.user
  let order = await orderHelpers.getOrderDetails(orderId, user._id) //orderProducts
  let orderDetails = await orderHelpers.getOrder(user._id, orderId)   // order details
  let total = orderDetails.totalAmount

  let GrandTotal = parseInt(total) + 40

  if(orderDetails.status=='placed'){
  res.render('user/viewOrderProducts', { order, orderDetails, total, GrandTotal, user, otp: true })

  }
  else{
    res.render('user/pendingOrderProduct', { order, orderDetails, total, GrandTotal, user, otp: true })

  }

  


})

router.get('/viewOrderProducts2/:id', async (req, res) => {

  let orderId = req.params.id
  let user = req.session.user

  let orderDetails = await orderHelpers.getOrder(user._id, orderId)   // order details

  res.render('user/viewOrderTwoPro', { orderDetails, user, otp: true })

})

//coupon Apply


router.post("/couponApply", async (req, res) => {
  let todayDate = new Date().toISOString().slice(0, 10);
  let startCoupon = await couponHelpers.startCouponOffer(todayDate);
  let userId = req.session.user._id;
  couponHelpers.validateCoupon(req.body, userId).then((response) => {

    req.session.couponTotal = response.total;

    if (response.success) {
      res.json({ couponSuccess: true, total: response.total });
    } else if (response.couponUsed) {
      res.json({ couponUsed: true });
    } else if (response.couponExpired) {
      res.json({ couponExpired: true });
    } else if (response.couponMaxLimit) {
      res.json({ couponMaxLimit: true });
    } else {
      res.json({ invalidCoupon: true });
    }
  });
});

router.post('/viewOrderSingle', (req, res) => {

  let status = false
  productHelpers.getOneProduct(req.body).then((product) => {
    console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    if (product[0].status == 'Delivered') {
      product[0].delivered = true
    }
    else if (product[0].status == 'cancelled') {
      product[0].cancelled = true
    }

    res.render('user/viewOrderSingle', { otp: true, product, status })
  })

});


router.post('/cancelSingleProductOrder', (req, res) => {


  orderHelpers.cancelSingleProductOrder(req.body).then((response) => {

    res.json(response)

  })
})



router.post('/search', async (req, res) => {

  let cartCount = ''
  let wishlistCount = ''

  user = req.session.user
  if (user) {
    [cartCount, wishlistCount] = await Promise.all([
      cartHelpers.getCartCount(req.session.user._id), cartHelpers.getWishlistCount(req.session.user._id)
    ])

  }
  const products = await productHelpers.getSearchProducts(req.body.key);
  user = req.session.user
  res.render('user/allProducts', { products, user, cartCount, wishlistCount })


});

router.get('/invoice/:id', async (req, res) => {
  user = req.session.user
  let orderProduct = await orderHelpers.getOrderDetails(req.params.id, user._id)
  let order = await orderHelpers.getOneOrder(req.params.id)

  let oldDate = order.date
  let result = oldDate.toString().slice(0, 16)

  var noTime = new Date(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate());
  //  date= new Date(oldDate.toDateString());
  console.log('wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww');
  console.log(result);
  order.dateNew = result
  res.render('user/invoice', { order, orderProduct, otp: true })

})

router.get('/brand/:id', (req, res) => {
  let brand = req.params.id

  productHelpers.getBrand(brand).then((products) => {
    console.log(products);
    res.render('user/allProducts', { products })
  })

})


router.post('/search-filter', (req, res) => {
  console.log('88888888888888888888888888888888888888888888888888888888888888888');
  console.log(req.body);
 
  let a = req.body
  let price = parseInt(a.Prize)
  let brandFilter = []
  let categoryFilter = []

  console.log('9999999999999999999999999999988888888888888888888888888888888888888888888888888888888888888888');
  for (let i of a.brand) {
    brandFilter.push({ 'brand': i })
  }
  console.log('pppppppppppppppppppppppppppppppppppppppppppppppppppppppppp');
  for (let i of a.category) {
    categoryFilter.push({ 'category': i })
  }
  console.log('777777777777777777777777777777777777777777777777777777777777777777777');
  categoryHelper.searchFilter(brandFilter, categoryFilter, price).then((result) => {
    console.log('jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj');
    filterResult = result

    console.log(result);
    console.log(filterResult);
    res.json({ status: true })
  })

})

router.get('/shop', (req, res) => {
  productHelpers.getAllProducts().then(async (products) => {
    filterResult = products

    res.redirect('/filterPage')
  })

})

router.get('/filterPage', async (req, res) => {

  let cartCount = ''
  let wishlistCount = ''

  user = req.session.user
  if (user) {
    [cartCount, wishlistCount] = await Promise.all([
      cartHelpers.getCartCount(req.session.user._id), cartHelpers.getWishlistCount(req.session.user._id)
    ])

  }

  let category = await categoryHelper.getCategory()
  let brand = await categoryHelper.getBrand()
  res.render('user/filterPage', { filterResult, category, brand, cartCount, wishlistCount, user })

})

// category starts

router.get('/category/:id',(req,res)=>{

  category=req.params.id
  console.log(category);

  categoryHelper.getCategoryProducts(category).then((products)=>{

    res.render('user/allProducts',{products})
    
  })
})

router.get('/review/:id',(req,res)=>{
  let id=req.params.id
  res.render('user/review',{id})
})

router.post('/review',(req,res)=>{
  console.log(req.body);
  productHelpers.addReview(req.body).then((response)=>{
    res.redirect('/allOrders')
  })
});

router.get('/about',(req,res)=>{
  res.render('user/about')
})


module.exports = router;
