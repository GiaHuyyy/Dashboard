const getMongooseValidationMessage = (error) => {
  const firstError = Object.values(error?.errors || {})[0];
  return firstError?.message || "Dữ liệu không hợp lệ";
};

const getDuplicateKeyMessage = (error) => {
  const firstKey = Object.keys(error?.keyValue || {})[0];
  if (!firstKey) return "Dữ liệu đã tồn tại";
  return `${firstKey} đã tồn tại`;
};

const resolveErrorResponse = (error) => {
  if (error?.name === "ValidationError") {
    return { status: 400, message: getMongooseValidationMessage(error) };
  }

  if (error?.name === "CastError") {
    return { status: 400, message: "Dữ liệu không hợp lệ" };
  }

  if (error?.code === 11000) {
    return { status: 409, message: getDuplicateKeyMessage(error) };
  }

  return { status: error?.status || 500, message: error?.message || "Lỗi hệ thống" };
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const { status, message } = resolveErrorResponse(error);

  if (status >= 500) {
    console.error(error);
  }

  return res.status(status).json({ message });
};

export default errorHandler;
