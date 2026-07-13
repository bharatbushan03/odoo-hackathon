const { asyncHandler, ResponseWrapper } = require('../utils');
const { HttpStatus } = require('../constants');

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const data = await this.authService.login(email, password);
    ResponseWrapper.success(res, { message: 'Login successful', data }, HttpStatus.OK);
  });

  signup = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const data = await this.authService.signup(name, email, password);
    ResponseWrapper.success(res, { message: 'Account created successfully', data }, HttpStatus.CREATED);
  });

  signupOrg = asyncHandler(async (req, res) => {
    const { orgName, orgCode, name, email, password } = req.body;
    const data = await this.authService.signupOrg(orgName, orgCode, name, email, password);
    ResponseWrapper.success(res, { message: 'Organization and admin account created successfully', data }, HttpStatus.CREATED);
  });

  me = asyncHandler(async (req, res) => {
    const data = await this.authService.getProfile(req.user.id);
    ResponseWrapper.success(res, { data }, HttpStatus.OK);
  });

  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const data = await this.authService.forgotPassword(email);
    ResponseWrapper.success(res, { message: data.message }, HttpStatus.OK);
  });
}

module.exports = AuthController;
