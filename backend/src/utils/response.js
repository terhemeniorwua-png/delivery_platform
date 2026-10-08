function success(res, message, data = {}, statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function failure(res, statusCode, message, errors) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { success, failure };
