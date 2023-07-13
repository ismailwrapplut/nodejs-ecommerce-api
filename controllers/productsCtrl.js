import asyncHandler from "express-async-handler";
import Product from "./../model/Product.js";
import Category from "./../model/Category.js";
import Brand from "../model/Brand.js";

//@desc create product
//@route POST /api/v1/products
//@access Private/Admin
export const createProductCtrl = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { name, description, category, sizes, colors, price, totalQty, brand } =
    req.body;
  console.log(req.files);
  const convertedImgs = req.files.map((file) => file?.path);
  //Product exists
  const productExists = await Product.findOne({ name });
  if (productExists) {
    throw new Error("Product Already Exists");
  }
  console.log(brand);
  //find the brand
  const brandFound = await Brand.findOne({
    name: brand,
  });

  if (!brandFound) {
    throw new Error(
      "Brand not found, please create brand first or check brand name"
    );
  }
  //find the category
  const categoryFound = await Category.findOne({
    name: category,
  });
  if (!categoryFound) {
    throw new Error(
      "Category not found, please create category first or check category name"
    );
  }
  //create the product
  const product = await Product.create({
    name,
    description,
    category,
    sizes,
    colors,
    user: req.userAuthId,
    price,
    totalQty,
    brand,
    images: convertedImgs,
  });

  console.log(product);
  //push the product into category
  categoryFound.products.push(product._id);
  //resave
  await categoryFound.save();
  //push the product into brand
  brandFound.products.push(product._id);
  //resave
  await brandFound.save();
  //send response
  res.json({
    status: "success",
    message: "Product created successfully",
    product,
  });
});
//@desc get all product
//@route get /api/v1/products
//@access Public

export const getProductsCtrl = asyncHandler(async (req, res) => {
  //query
  let productQuery = Product.find();

  //search by name
  if (req.query.name) {
    productQuery = productQuery.find({
      name: { $regex: req.query.name, $options: "i" },
    });
  }
  //filter by brand
  if (req.query.brand) {
    productQuery = productQuery.find({
      name: { $regex: req.query.brand, $options: "i" },
    });
  }
  //filter by category
  if (req.query.category) {
    productQuery = productQuery.find({
      name: { $regex: req.query.category, $options: "i" },
    });
  }
  //filter by color
  if (req.query.colors) {
    productQuery = productQuery.find({
      name: { $regex: req.query.colors, $options: "i" },
    });
  }
  //filter by sizes
  if (req.query.sizes) {
    productQuery = productQuery.find({
      sizes: { $regex: req.query.sizes, $options: "i" },
    });
  }
  //filter by price range
  if (req.query.price) {
    const priceRange = req.query.price.split("-");
    productQuery = productQuery.find({
      price: { $gte: priceRange[0], $lte: priceRange[1] },
    });
  }
  //pagination
  //page
  const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
  const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Product.countDocuments();
  productQuery = productQuery.skip(startIndex).limit(limit);
  //pagination results
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  //await the query
  const products = await productQuery.populate("reviews");
  res.json({
    status: "success",
    total,
    results: products.length,
    message: "products fetched successfully",
    products,
  });
});
//@desc get a product
//@route get /api/v1/products/:id
//@access Public

export const getProductCtrl = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("reviews");
  if (!product) {
    throw new Error("Product not found");
  }
  res.json({
    status: "success",
    message: "Product fetched successfully",
    product,
  });
});

//@desc update a product
//@route put /api/v1/products/:id/update
//@access Private/admin
export const updateProductCtrl = asyncHandler(async (req, res) => {
  const { name, description, brand, category, sizes, colors, price, totalQty } =
    req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      brand,
      category,
      sizes,
      colors,
      price,
      totalQty,
    },
    { new: true }
  );
  res.json({
    status: "success",
    message: "Product updates successfully",
    product,
  });
});
//@desc update a product
//@route put /api/v1/products/:id/update
//@access Private/admin
export const deleteProductCtrl = asyncHandler(async (req, res) => {
  const product = await Product.findByIdDelete(req.params.id);
  res.json({
    status: "success",
    message: "Product del successfully",
  });
});
