

exports.checkSessionEidandType = function requireLogin (req, res, next) {
if(!req.session.userType  && !req.session.eID){
    res.redirect('/login');
  } else {
    next();
  }
};
