import express from "express";

import { isLoggedin } from "./../middlewares/isLoggedin.js";
import {
  createOrderCtrl,
  getAllOrdersCtrl,
  getOrderStatsCtrl,
  getSingleOrderCtrl,
  updateOrderCtrl,
} from "../controllers/orderCtrl.js";
import isAdmin from "./../middlewares/isAdmin.js";

const orderRouter = express.Router();

orderRouter.post("/", isLoggedin, isAdmin, createOrderCtrl);
orderRouter.get("/", isLoggedin, getAllOrdersCtrl);
orderRouter.get("/:id", isLoggedin, getSingleOrderCtrl);
orderRouter.put("/update/:id", isLoggedin, isAdmin, updateOrderCtrl);
orderRouter.get("/sales/stats", isLoggedin, isAdmin, getOrderStatsCtrl);

export default orderRouter;
