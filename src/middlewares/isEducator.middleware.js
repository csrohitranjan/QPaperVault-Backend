export const isAdminAuth = (req, res, next) => {

    const { role } = req.user;

    if (role === 'educator') {
        next(); // Role is educator, proceed to the next middleware
    } else {
        return res.status(403).json({
            status: 403,
            message: "Unauthorized Access: educator privileges required"
        })
    }
};