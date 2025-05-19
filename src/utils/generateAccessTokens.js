import { User } from "../models/user.model.js";



export const generateAccessTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        return { accessToken };

    } catch (error) {
        return res.status(401).json({
            status: 401,
            message: "Internal Server Error on: generateAccessTokens."
        })
    }
}