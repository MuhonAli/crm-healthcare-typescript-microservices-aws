import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios"; 

const userSchema = new mongoose.Schema(
  {
    organization_id: { type: String, required: true },
    organization_name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    first_name: { type: String, required: true },
    email: { type: String, required: true, },
    password: { type: String, required: true },
    job_description: { type: String, required: true },
    last_name: { type: String, required: true },
    date_of_birth: { type: Date, required: true },
    work_phone_no: { type: String, required: true },
    work_phone_extension: { type: String },
    home_phone_no: { type: String },
    home_phone_extension: { type: String },
    role: { type: String, required: true },
    gender: { type: String },
    street_address: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    zip_code: { type: String, required: true },
    profile_pic_url: { type: String },
    email_signature: {
      signature: { type: String, default: false },
      enable_on_outgoing_msg: { type: Boolean, default: false },
      include_before_text_in_replies: { type: Boolean, default: false },
    },
    additional_info: { type: String },
    is_super_admin: { type: Boolean, default: false },
    is_emr_data: { type: Boolean, default: false },
    emr_user_id: { type: Number, default: null},
    emr_facility_id: { type: Number, default: null },
    has_crm_access: { type: Boolean, default: true },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  } 
);

userSchema.methods.webToken = async function () {
  const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET);
  this.tokens = this.tokens.concat({ token });
  await this.save();
  return token;
};

userSchema.statics.findByCredential = async (username, password) => {
  const user = await User.findOne({ username });
  if (!user) {
    return "no-user";
  }
  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) {
    return "not-matched";
  }

  if (user && !user.is_active) {
    return "deactivated";
  }

  if (user && !user.has_crm_access) {
    return "no-crm-access";
  }

  // Check organization status
  try {
    const orgEndpoint = process.env.ORGANIZATION_API_ENDPOINT_URL + "/api/admin/organizationStatus/" + user.organization_id;
  
    const response = await axios.get(orgEndpoint, { 
      headers: {
        "Content-Type": "application/json",
      },
    });
  
    if (response.status !== 200) {  
      return "organization-inactive";
    }  

  } catch (error) {
    if (error.response && error.response.status === 404) {
      return "The organization is not active or it does not have proper access";
    } else {
      return "Organization is not active or does not have proper access";
    } 
  }

  const token = jwt.sign(
    {
      id: user._id,
      organization_id: user.organization_id,
      organization_name: user.organization_name,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      work_phone_no: user.work_phone_no,
      work_phone_extension: user.work_phone_extension,
      role: user.role,
      is_super_admin: user.is_super_admin,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" } 
  );
  user.token = token;
  const data = {
    data: user,
    token: token,
  };
  return data;
};

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && !this.isApiCallFromEmr) {
    this.password = await bcryptjs.hash(this.password, 8);
  } 
  next();
}); 
  
   

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.is_deleted;
  delete userObject.password;

  return userObject;
};

const User = mongoose.model("users", userSchema);

export default User;
