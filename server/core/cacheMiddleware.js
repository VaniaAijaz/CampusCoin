const { redisClient } = require("./redis");

const clearUserCache = async (req, res, next) => {
  if (!req.user || !req.user._id) return next();
  if (redisClient?.isOpen) {
    try {
      const userId = req.user._id.toString();
      await redisClient.del(`ai_insight:${userId}`);
      await redisClient.del(`dashboard_metrics:${userId}`);
    } catch (err) {
      // Ignore cache invalidation error if redis is down
    }
  }
  next();
};

module.exports = { clearUserCache };
