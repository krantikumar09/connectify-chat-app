import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

// signup a new user
export const signup = async (req, res) => {
  if (!req.body) {
    return res.json({ success: false, message: "Req body is missing!" });
  }

  const { fullName, email, password, bio } = req.body;

  try {
    if (!fullName || !email || !password || !bio) {
      return res.json({ success: false, message: "All fields are required!" });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.json({
        success: false,
        message: "User already exists! Please login.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });

    const token = generateToken(newUser);

    res.json({ success: true, token, message: "Sign Up Successful!" });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Something went wrong! Please try again.",
    });
  }
};

// login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if user is exists
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.json({ success: false, message: "User not found!" });
    }

    // check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, userData.password);
    if (!isPasswordCorrect) {
      return res.json({ success: false, message: "Invalid credentials!" });
    }

    // generate token
    const token = generateToken(userData._id);

    res.json({ success: true, userData, token, message: "Logged in!" });
  } catch (error) {
    console.log("Login error: ", error);
    res.json({
      success: false,
      message: "Something went wrong! Please try again.",
    });
  }
};

// to check if user is authenticated
export const checkAuth = (req, res) => {
  res.json({ success: true, user: req.user });
};

// controller to update user profile details
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;

    const userId = req.user._id;
    let updatedUser;

    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
      );
    } else {
      const upload = await cloudinary.uploader.upload(profilePic);

      updateProfile = await User.findByIdAndUpdate(
        userId,
        { profilePic: upload.secure_url, bio, fullName },
        { new: true }
      );
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Something went wrong!" });
  }
};
