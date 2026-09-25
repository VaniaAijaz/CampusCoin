const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.warn("[SERVER] Redis connection failed after 5 retries. Caching disabled.");
        return new Error("Retry time exhausted");
      }
      return Math.min(retries * 100, 3000); // Wait between retries
    }
  }
});

let isRedisConnected = false;

redisClient.on("error", (err) => {
  // Only log the first error or hide it completely
  if (!isRedisConnected) return; 
  console.error("Redis Client Error", err);
});

redisClient.on("connect", () => {
  isRedisConnected = true;
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis...");
  } catch (err) {
    console.warn("Redis connection aborted (Ensure Docker is running if you want caching).");
  }
};

module.exports = { redisClient, connectRedis };
