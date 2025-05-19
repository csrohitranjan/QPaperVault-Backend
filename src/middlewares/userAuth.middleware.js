import Jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config()
import { User } from "../models/user.model.js";





export const userAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || (req.headers?.authorization && req.headers.authorization.replace("Bearer ", ""));

        if (!token) {
            return res.status(401)
                .json({
                    status: 401,
                    message: "Unauthorised Request "
                })
        }

        const decodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password")

        if (!user) {
            return res.status(401)
                .json({
                    status: 401,
                    message: "Invalid Access Token"
                })
        }

        req.user = user;
        next()

    } catch (error) {
        return res.status(401).json({
            status: 401,
            message: "Internal Server Error on: userAuth Middleware"
        })
    }
}