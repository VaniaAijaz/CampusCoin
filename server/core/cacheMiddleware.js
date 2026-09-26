const { redisClient } = require("./redis");

/**
 * Invalidate all redis cache keys belonging to a user
 * @param {string|mongoose.Types.ObjectId} userId
 */
const invalidateUserCache = async (userId) => {
  if (!userId) return;
  if (redisClient?.isOpen) {
    try {
      const uId = userId.toString();
      const keysToClear = await redisClient.keys(`campuscoin:user:${uId}:*`);
      if (keysToClear && keysToClear.length > 0) {
        await redisClient.del(keysToClear);
      }
    } catch (err) {
      // Ignore cache invalidation error if redis is down
    }
  }
};

const clearUserCache = async (req, res, next) => {
  if (req.user?._id) {
    await invalidateUserCache(req.user._id);
  }
  next();
};

module.exports = { clearUserCache, invalidateUserCache };
