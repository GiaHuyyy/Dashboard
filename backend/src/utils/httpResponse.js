export const sendOk = (res, payload = {}) => res.json(payload);

export const sendCreated = (res, payload = {}) => res.status(201).json(payload);

export const sendError = (res, status, message, extra = {}) =>
  res.status(status).json({ message, ...extra });

export const sendBadRequest = (res, message = "Dữ liệu không hợp lệ", extra = {}) =>
  sendError(res, 400, message, extra);

export const sendNotFound = (res, message = "Không tìm thấy dữ liệu", extra = {}) =>
  sendError(res, 404, message, extra);

export const sendValidationError = (res, validationError) =>
  sendError(
    res,
    validationError?.status || 400,
    validationError?.message || "Dữ liệu không hợp lệ",
  );
