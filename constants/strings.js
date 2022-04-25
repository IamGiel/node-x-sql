const login_user_password_mismatch = () => "ERRCODE: user-password-mismatch";
const login_succesful_for_user = (email) => `Login successful for ${email}`
const login_not_successful = (email) => `Login unsuccessful for ${email}`

module.exports.login_user_password_mismatch = login_user_password_mismatch;
module.exports.login_succesful_for_user = login_succesful_for_user;
module.exports.login_not_successful = login_not_successful;