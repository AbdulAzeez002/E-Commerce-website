const express = require('express');
const router = express.Router();

const adminHelper = require('../helper/admin-helper')
const productHelpers = require('../helper/product-helper');
const multer = require('multer')
const storage = require('../middleware/multer')
const flash = require('connect-flash');
const userHelper = require('../helper/user-helper');
const categoryHelpers = require('../helper/category-helper')
const orderHelpers = require('../helper/order-helper')
const couponHelpers = require('../helper/coupon-helper')
const cartHelper = require('../helper/cart-helper');

let verifyAdminLogin = (req, res, next) => {
  if (req.session.Adminloggin) {
    next();
  }
  else {
    res.redirect('/admin')
  }
}


router.get('/', function (req, res, next) {
  res.render('admin/login', { admin: true, otp: true })
});

router.get('/dashboard', verifyAdminLogin, (req, res) => {
  res.render('admin/dashboard', { admin: true, otp: true })

})

router.post('/login', (req, res) => {
  adminHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.Adminloggin = true
      res.redirect('/admin/dashboard')
    }
    else {
      res.redirect('/admin')
    }
  })
})

router.get('/logout', (req, res) => {
  res.redirect('/admin')
  req.session.Adminloggin = false

})

//user management

router.get('/viewUser', verifyAdminLogin, (req, res) => {
  adminHelper.getAllUsers().then((response) => {
    const alert = req.flash('msg')
    res.render('admin/userTable', { admin: true, otp: true, response, alert, layout: false })
  })


});
//delete user

router.get('/deleteUser/:id', (req, res) => {
  let userId = req.params.id
  userHelper.deleteUser(userId).then((response) => {
    res.redirect('/admin/viewUser')

  })


})

// block user

router.get('/blockUser/:id', (req, res) => {
  req.session.userloggedIn = false

  userHelper.blockUser(req.params.id).then((response) => {

    req.flash('msg', 'You Blocked Mr/Mrs ' + response)


    res.redirect('/admin/viewUser')
  })

})

// unblock user 

router.get('/unblockUser/:id', (req, res) => {


  userHelper.unblockUser(req.params.id).then((response) => {
    req.flash('msg', 'You Unblocked Mr/Mrs ' + response)
    res.redirect('/admin/viewUser')
  })

})

router.get('/addproduct', async (req, res) => {
  let category = await categoryHelpers.getCategory()
  let brand = await categoryHelpers.getBrand()

  res.render('admin/addProduct', { admin: true, otp: true, category, brand })

})

router.post('/addProduct', storage.fields([{ name: 'image1', maxCount: 1 },
{ name: 'image2', maxCount: 1 },
{ name: 'image3', maxCount: 1 },
{ name: 'image4', maxCount: 1 }]), function (req, res) {

  productHelpers.uploadFiles(req.body).then((ab) => {

    let proId = ab.id
    let img1 = req.files.image1[0].filename
    let img2 = req.files.image2[0].filename
    let img3 = req.files.image3[0].filename
    let img4 = req.files.image4[0].filename
    console.log(img1, img2, img3, img4);
    console.log(ab);

    productHelpers.uploadImage(proId, img1, img2, img3, img4).then((response) => {
      res.redirect('/admin/viewproducts')


    })

  })


});

router.get('/viewproducts', (req, res) => {
  productHelpers.getAllProducts().then((response) => {
    const alert = req.flash('msg')
    res.render('admin/productTable', { admin: true, response, otp: true, alert, layout: false })
  })


});

router.get('/deleteProduct/:id', (req, res) => {

  let proId = req.params.id
  console.log(proId);

  productHelpers.deleteProduct(proId).then((response) => {
    req.flash('msg', 'You Deleted successfully!')
    res.redirect('/admin/viewproducts')
  })

});

router.get('/editProduct/:id', (req, res) => {

  let proId = req.params.id
  console.log(proId);

  productHelpers.findaProduct(proId).then((response) => {
    console.log('hyyyyyyy')
    req.session.product = response
    res.redirect('/admin/edit-product')
  })

});

router.get('/edit-product', (req, res) => {
  product = req.session.product
  res.render('admin/editProduct', { product, admin: true, otp: true })

})



router.post('/editProduct/:id', storage.fields([{ name: 'image1', maxCount: 1 },
{ name: 'image2', maxCount: 1 },
{ name: 'image3', maxCount: 1 },
{ name: 'image4', maxCount: 1 }]), function (req, res) {


  let proId = req.params.id


  let img1 = req.files.image1 ? req.files.image1[0].filename : req.body.image1
  let img2 = req.files.image2 ? req.files.image2[0].filename : req.body.image2
  let img3 = req.files.image3 ? req.files.image3[0].filename : req.body.image3
  let img4 = req.files.image4 ? req.files.image4[0].filename : req.body.image4



  productHelpers.editProduct(req.body, proId, img1, img2, img3, img4).then((ab) => {
    console.log(ab);
    res.redirect('/admin/viewproducts')

  })


});

router.get('/categories', (req, res) => {
  categoryHelpers.getCategory().then((category) => {
    console.log(category);
    res.render('admin/categories', { admin: true, otp: true, category })
  })

});

router.get('/deleteCategory/:id', (req, res) => {
  let id = req.params.id
  categoryHelpers.deleteCategory(id).then((response) => {
    res.redirect('/admin/categories')
  })
})



router.post('/addCategory', (req, res) => {
  console.log(req.body);
  categoryHelpers.addCategory(req.body).then((response) => {
    res.redirect('/admin/categories')
  })

})

router.get('/brands', (req, res) => {
  categoryHelpers.getBrand().then((brand) => {
    console.log(brand);
    res.render('admin/brand', { admin: true, otp: true, brand })
  })

});

router.get('/addBrand', (req, res) => {

  res.render('admin/addBrand', { admin: true, otp: true })
})

router.post('/addBrand', storage.fields([{ name: 'logo', maxCount: 1 },]), (req, res) => {
  let img1 = req.files.logo[0].filename
  console.log(req.body);
  let data = {}
  data.brandName = req.body.brand,
    data.logo = img1


  categoryHelpers.addBrand(data).then((response) => {

    res.redirect('/admin/brands')
  })

});


router.get('/editBrand/:id', (req, res) => {

  categoryHelpers.getOneBrand(req.params.id).then((brand) => {
    res.render('admin/editBrand', { admin: true, otp: true, brand })
  })
})
router.post('/editBrand', storage.fields([{ name: 'logo', maxCount: 1 },
]), (req, res) => {
  let img1 = req.files.logo[0].filename

  let data = {}
  data.brandName = req.body.brand,
    data.logo = img1,
    data.id = req.body.id

  categoryHelpers.editBrand(data).then((response) => {

    res.redirect('/admin/brands')
  })
});


router.get('/deleteBrand/:id', (req, res) => {
  let id = req.params.id
  categoryHelpers.deleteBrand(id).then((response) => {
    res.redirect('/admin/brands')
  })
});

router.get('/allOrders', (req, res) => {
  orderHelpers.getAllOrderDetails().then((orders) => {
    console.log(orders);
    res.render('admin/allOrders', { admin: true, orders, otp: true, layout: false })
  })

});

router.get('/viewOrderProducts/:id', async (req, res) => {
  let orderId = req.params.id
  let order = await orderHelpers.getOrderDetails2(orderId) //orderProducts
  let orderDetails = await orderHelpers.getOrder2(orderId)   // order details

  let total = orderDetails.totalAmount


  let GrandTotal = parseInt(total) + 40

  res.render('admin/viewOrderProduct', { order, orderDetails, total, GrandTotal, otp: true, admin: true, orderId })
})

router.post('/changeOrderStatus', (req, res) => {

  let data = req.body
  orderHelpers.updateOrderStatus(data).then(async (response) => {
    
    let orderId = req.body.orderId
    let order = await orderHelpers.getOrderDetails2(orderId) //orderProducts
    let orderDetails = await orderHelpers.getOrder2(orderId)   // order details

    let total = orderDetails.totalAmount


    let GrandTotal = parseInt(total) + 40
    res.render('admin/viewOrderProduct', { order, orderDetails, total, GrandTotal, otp: true, admin: true, orderId })
  })

});

router.get('/coupons', (req, res) => {
  couponHelpers.getCoupon().then((coupon) => {
    console.log(coupon);
    res.render('admin/coupons', { otp: true, layout: false, coupon })
  })



})
router.get('/addCoupon', (req, res) => {
  res.render('admin/addCoupon', { admin: true, otp: true })
})

router.post('/addCoupon', (req, res) => {

  couponHelpers.addNewCoupon(req.body).then(() => {
    res.redirect('/admin/coupons')
  }).catch((err) => {
    console.log(err);
  });

  console.log(req.body);

});

router.get('/deleteCoupon/:id', (req, res) => {

  couponHelpers.deleteCoupon(req.params.id).then(() => {
    res.redirect('/admin/coupons')
  })
})

router.get('/editCoupon/:id', (req, res) => {

  couponHelpers.getOneCoupon(req.params.id).then((coupon) => {
    res.render('admin/editCoupon', { admin: true, otp: true, coupon })
  })


});

router.post('/editCoupon/:id', (req, res) => {

  couponHelpers.getOneCoupon(req.params.id).then((coupon) => {
    res.render('admin/editCoupon', { admin: true, otp: true, coupon })
  })


});

router.post('/getData', async (req, res) => {
  console.log(req.body, 'req.body');
  const date = new Date(Date.now());
  const month = date.toLocaleString("default", { month: "long" });
  cartHelper.salesReport(req.body).then((data) => {
    let salesReport = data.salesReport
    let brandReport = data.brandReport
    let orderCount = data.orderCount
    let totalAmountPaid = data.totalAmountPaid
    let totalAmountRefund = data.totalAmountRefund



    let dateArray = [];
    let totalArray = [];
    salesReport.forEach((s) => {
      dateArray.push(`${month}-${s._id} `);
      totalArray.push(s.total);
    })


    let brandArray = [];
    let sumArray = [];
    brandReport.forEach((s) => {
      brandArray.push(s._id);
      sumArray.push(s.totalAmount);


    });
    console.log("", brandArray);
    console.log("", sumArray);
    console.log("", dateArray);
    console.log("", totalArray);

    res.json({ dateArray, totalArray, brandArray, sumArray, orderCount, totalAmountPaid, totalAmountRefund })



  })


})

module.exports = router;
