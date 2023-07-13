import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
import User from "./../model/User.js";
import Order from "./../model/Order.js";
import Product from "./../model/Product.js";
import Stripe from "stripe";
import Coupon from "../model/Coupon.js";

//@desk create orders
//@route POST /api/v1/orders
//@access private

//stripe instance
dotenv.config();
const stripe = new Stripe(process.env.STRIPE_KEY);

export const createOrderCtrl = asyncHandler(async (req, res) => {
  //get the coupon
  const { coupon } = req?.query;

  const couponFound = await Coupon.findOne({ code: coupon?.toUpperCase() });
  if (couponFound?.isExpired) {
    throw new Error("Coupon has expired");
  }
  if (!couponFound) {
    throw new Error("Coupon does not exist");
  }

  //get the sicoun
  const discount = couponFound?.discount / 100;
  //Find the user
  const user = await User.findById(req.userAuthId);
  //check if user has shipppin address
  if (!user?.hasShippingAddress) {
    throw new Error("Please provede shpping address");
  }
  //Get the payload(customer,orderitems,shippingAddress,totalPrice);
  const { orderItems, shippingAddress, totalPrice } = req.body;
  //Check if order is not empty
  if (orderItems?.length <= 0) {
    throw new Error("No order items");
  }
  //Place/create order --save into DB
  const order = await Order.create({
    user: user?.id,
    orderItems,
    shippingAddress,
    totalPrice: couponFound ? totalPrice - totalPrice * discount : totalPrice,
  });
  //push order into user
  user.orders.push(order?._id);
  await user.save();
  const products = await Product.find({ _id: { $in: orderItems } });

  orderItems?.map(async (order) => {
    const product = products?.find((product) => {
      return product?._id?.toString() === order?._id?.toString();
    });
    if (product) {
      product.totalSold += order.qty;
    }
    await product.save();
  });
  //push order into user
  user.orders.push(order?._id);
  await user.save();
  //make payment(stipe)
  //convert order items to have same structure that stripe need
  const convertedOrders = orderItems.map((item) => {
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item?.name,
          description: item?.description,
        },
        unit_amount: item?.price * 100,
      },
      quantity: item?.qty,
    };
  });
  const session = await stripe.checkout.sessions.create({
    line_items: convertedOrders,
    metadata: {
      orderId: JSON.stringify(order?._id),
    },
    mode: "payment",
    success_url: "http://localhost:3000/success",
    cancel_url: "http://localhost:3000/success",
  });
  res.send({ url: session.url });
});

//@desk get  all orders
//@route GET /api/v1/orders
//@access private

export const getAllOrdersCtrl = asyncHandler(async (req, res) => {
  const orders = await Order.find();
  res.json({
    success: true,
    message: "All orders",
    orders,
  });
});
//@desk get  single orders
//@route GET /api/v1/orders/:id
//@access private

export const getSingleOrderCtrl = asyncHandler(async (req, res) => {
  //get the id from param
  const { id } = req.params;
  const order = await Order.findById(id);
  res.status(200).send({
    success: true,
    message: "get single order",
    order,
  });
});

//@desk get  single orders
//@route PUT /api/v1/orders/update/:id
//@access private

export const updateOrderCtrl = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params,
    {
      status: req.body.status,
    },
    { new: true }
  );
  res.status(200).send({
    success: true,
    message: "order updated",
    order,
  });
});

//@desk get sales sum of order
//@route GET /api/v1/orders/sales/sum
//@access private/admin

export const getOrderStatsCtrl = asyncHandler(async (req, res) => {
  const orders = await Order.aggregate([
    {
      $group: {
        _id: null,
        minimumSale: {
          $min: "$totalPrice",
        },
        maximumSale: {
          $max: "$totalPrice",
        },
        totalSales: {
          $sum: "$totalPrice",
        },
        avgSale: {
          $avg: "totalPrice",
        },
      },
    },
  ]);
  //get the date
  const date = new Date();
  const today = newDate(date.getFullYear(), date.getMonth(), date.getDate());
  const saleToday = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: today,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: {
          $sum: "$totalPrice",
        },
      },
    },
  ]);
  res.status(200).json({
    success: "true",
    message: "Sum of orders",
    orders,
    saleToday,
  });
});
