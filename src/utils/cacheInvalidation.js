import redis from "../config/redis.js";

// delete single cache
export const clearCache = async (key) => {

  try {

    await redis.del(key);

  } catch (err) {

    console.error("Redis delete error:", err);

  }
};

// delete multiple cache by prefix
export const clearCacheByPrefix = async (prefix) => {

  try {

    const keys = await redis.keys(`${prefix}*`);

    if (keys.length > 0) {

      await redis.del(...keys);
    }

  } catch (err) {

    console.error("Redis prefix delete error:", err);

  }
};