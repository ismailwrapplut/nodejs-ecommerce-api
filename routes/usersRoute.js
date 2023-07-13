import express from "express";
import {
  getUserProfileCtrl,
  loginUserCtrl,
  registerUserCtrl,
  updateShippingAddressctrl,
} from "../controllers/usersCtrl.js";
import { isLoggedin } from "../middlewares/isLoggedin.js";

const userRoutes = express.Router();
userRoutes.post("/update/shipping", isLoggedin, updateShippingAddressctrl);
userRoutes.post("/register", registerUserCtrl);
userRoutes.post("/login", loginUserCtrl);
userRoutes.get("/profile", isLoggedin, getUserProfileCtrl);

export default userRoutes;
