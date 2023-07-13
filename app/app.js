import express from "express";
import dbConnect from "../config/dbConnect.js";
import dotenv from "dotenv";
import userRoutes from "../routes/usersRoute.js";
import Stripe from "stripe";

import { globalErrhandler, notFound } from "../middlewares/globalErrHandler.js";
import productsRouter from "../routes/productsRoute.js";
import categoriesRouter from "../routes/categoriesRouter.js";
import brandsRouter from "./../routes/brandsRouter.js";
import colorRouter from "../routes/colorRouter.js";
import reviewRouter from "../routes/reviewRouter.js";
import orderRouter from "../routes/ordersRouter.js";
import Order from "../model/Order.js";
import couponsRouter from "../routes/couponsRouter.js";
dotenv.config();

dbConnect();
const app = express();
const stripe = new Stripe(process.env.STRIPE_KEY);

const endpointSecret =
  "whsec_1721e79a8b1ade747ece78b4fa3f06744dd8f45936e97d6ff878d8310eba0bdd";

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
      console.log(event);
    } catch (err) {
      console.log("err", err.message);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === "checkout.session.completed") {
      //update the order
      const session = event.data.object;
      const { orderId } = session.metadata;
      const { payment_status } = session;
      const payment_method_types = session.payment_method_types[0];
      const { amount_total } = session;
      const { currency } = session;
      const order = await Order.findByIdAndUpdate(
        JSON.parse(orderId),
        {
          totalPrice: amount_total / 100,
          currency: currency,
          paymentMethod: payment_method_types,
          paymentStatus: payment_status,
        },
        {
          new: true,
        }
      );
      console.log(order);
    } else {
      return;
    }
    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);
//pass incoming data
app.use(express.json());
//routes
app.use("/api/v1/users/", userRoutes);
app.use("/api/v1/products/", productsRouter);
app.use("/api/v1/categories/", categoriesRouter);
app.use("/api/v1/brands/", brandsRouter);
app.use("/api/v1/colors/", colorRouter);
app.use("/api/v1/reviews/", reviewRouter);
app.use("/api/v1/orders/", orderRouter);
app.use("/api/v1/coupons/", couponsRouter);

//404 handler
app.use(notFound);
//err middleware
app.use(globalErrhandler);
export default app;
