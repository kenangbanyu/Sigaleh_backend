import redis from "../config/redis.js";

export const cache = (ttl = 3600) => {

  return async (req, res, next) => {

    try {

      const key = req.originalUrl;

      // check cache
      const cached = await redis.get(key);

      // cache hit
      if (cached) {

        res.set("X-Data-Source", "cache");

        return res.json(cached);
      }

      // intercept response
      const originalJson = res.json.bind(res);

      res.json = async (body) => {

        try {

          await redis.set(
            key,
            body,
            {
              ex: ttl,
            }
          );

        } catch (err) {

          console.error("Redis set error:", err);
        }

        res.set("X-Data-Source", "database");

        return originalJson(body);
      };

      next();

    } catch (err) {

      console.error("Redis cache error:", err);

      next();
    }
  };
};