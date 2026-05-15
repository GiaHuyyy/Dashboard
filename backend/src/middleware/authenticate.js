import jwt from "jsonwebtoken";

const authenticate = (req, res, next) => {
  const cookieName = process.env.JWT_COOKIE_NAME || "access_token";
  const tokenFromCookie = req.cookies?.[cookieName];
  const authorization = req.headers.authorization;

  let token = tokenFromCookie;
  if (!token && authorization?.startsWith("Bearer ")) {
    token = authorization.slice("Bearer ".length);
  }

  if (!token) {
    return res.status(401).json({ message: "Thiếu hoặc token không hợp lệ" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET chưa được cấu hình" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

export default authenticate;
