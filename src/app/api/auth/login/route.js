import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import sequelize from "@/backend/config/database.js";
import { User, Branch } from "@/backend/models/postgres/index.js";
import config from "@/backend/config/index.js";
import logger from "@/backend/config/logger.js";

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
      branch_id: user.branch_id,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

export async function POST(request) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json(
        { error: "Login and password required" },
        { status: 400 },
      );
    }

    const user = await User.scope("withPassword").findOne({
      where: {
        [Op.or]: [{ email: login.toLowerCase() }, { registration_no: login }],
      },
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "name", "code"],
        },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "Your account is currently inactive. Please contact your school administrator." }, { status: 403 });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    await user.update({ last_login_at: new Date() });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const permissions = await user.getPermissions();

    // Clean up sensitive fields before returning
    const userData = user.get({ plain: true });
    delete userData.password_hash;
    delete userData.plain_password;
    delete userData.password_reset_token;
    delete userData.password_reset_expires;

    const response = NextResponse.json({
      success: true,
      user: userData,
      accessToken,
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    logger.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
