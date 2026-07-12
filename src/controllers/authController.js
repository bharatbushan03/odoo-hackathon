const { ResponseWrapper } = require('../utils');
const { HttpStatus } = require('../constants');

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  login = async (req, res) => {
    const { email, password } = req.body;
    const data = await this.authService.login(email, password);
    ResponseWrapper.success(res, { message: 'Login successful', data }, HttpStatus.OK);
  };

  signup = async (req, res) => {
    const { name, email, password } = req.body;
    const data = await this.authService.signup(name, email, password);
    ResponseWrapper.success(res, { message: 'Account created successfully', data }, HttpStatus.CREATED);
  };

  me = async (req, res) => {
    const data = await this.authService.getProfile(req.user.id);
    ResponseWrapper.success(res, { data }, HttpStatus.OK);
  };

  forgotPassword = async (req, res) => {
    const { email } = req.body;
    const data = await this.authService.forgotPassword(email);
    ResponseWrapper.success(res, { message: data.message }, HttpStatus.OK);
  };
}

module.exports = AuthController;
