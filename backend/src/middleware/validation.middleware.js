const { badRequest } = require('../utils/errors');

function validate(schemas) {
  return (req, res, next) => {
    const errors = [];
    const parsed = {};

    for (const key of ['params', 'query', 'body']) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            path: [key, ...issue.path].join('.'),
            message: issue.message,
          });
        }
      } else {
        parsed[key] = result.data;
      }
    }

    if (errors.length > 0) {
      return next(badRequest('Validation failed', errors));
    }

    if (parsed.params) req.params = parsed.params;
    if (parsed.query) {
      // Express 5 exposes req.query as a prototype getter, so shadow it with the
      // validated value instead of assigning directly.
      Object.defineProperty(req, 'query', {
        value: parsed.query,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    if (parsed.body) req.body = parsed.body;
    return next();
  };
}

module.exports = { validate };
