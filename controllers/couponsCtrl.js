import asyncHandler from "express-async-handler";
import Coupon from "./../model/Coupon.js";

// @desk Create new coupon
// @route POST /api/v1/coupons
// @access Private/Admin

export const createCouponCtrl = asyncHandler(async (req, res) => {
  const { code, startDate, endDate, discount } = req.body;
  //check if admin
  //check if coupon already exists
  const couponExists = await Coupon.findOne({
    code: code,
  });
  if (couponExists) {
    throw new Error("Coupon already exists");
  }
  //check if discount is a number
  if (isNaN(discount)) {
    throw new Error("discount must be a number");
  }
  const coupon = await Coupon.create({
    code: code?.toUpperCase(),
    startDate,
    endDate,
    discount,
    user: req.userAuthId,
  });
  res.status(201).json({
    success: true,
    message: "coupon created",
    coupon,
  });
});

// @desk Get all couons
// @route GET /api/v1/coupons
// @access Private/Admin

export const getAllCouponsCtrl = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find();
});

// @desc    Get single coupon
// @route   GET /api/v1/coupons/:id
// @access  Private/Admin

export const getCouponCtrl = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.query.code });
  //check if is not found
  if (coupon === null) {
    throw new Error("Coupon not found");
  }
  //check if expired
  if (coupon.isExpired) {
    throw new Error("Coupon Expired");
  }
  res.json({
    status: "success",
    message: "Coupon fetched",
    coupon,
  });
});

export const updateCouponCtrl = asyncHandler(async (req, res) => {
  const { code, startDate, endDate, discount } = req.body;
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    {
      code: code?.toUpperCase(),
      discount,
      startDate,
      endDate,
    },
    {
      new: true,
    }
  );
  res.json({
    status: "success",
    message: "Coupon updated successfully",
    coupon,
  });
});

export const deleteCouponCtrl = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  res.json({
    status: "success",
    message: "Coupon deleted successfully",
    coupon,
  });
});
