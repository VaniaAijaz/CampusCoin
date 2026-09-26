const { createClient } = require("redis");

const isDocker = process.env.USE_DOCKER_REDIS === "true";

let redisClient = null;

if (isDocker) {
  redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          console.warn("[SERVER] Redis connection failed after 5 retries. Caching disabled.");
          return new Error("Retry time exhausted");
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
  });
} else {
  // Dummy client to prevent errors
  redisClient = {
    isOpen: false,
    get: async () => null,
    setEx: async () => null,
    del: async () => null,
    keys: async () => [],
    connect: async () => {},
  };
}

const connectRedis = async () => {
  if (!isDocker) {
    console.log("Redis is disabled (USE_DOCKER_REDIS is not 'true'). Running without cache.");
    return;
  }
  try {
    await redisClient.connect();
    console.log("Connected to Redis...");
  } catch (err) {
    console.warn("Redis connection aborted. Running without cache.");
  }
};

module.exports = { redisClient, connectRedis };
