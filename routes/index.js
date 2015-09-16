var express = require('express');
var router = express.Router();
var watson = require('watson-developer-cloud');
var i18n = require('i18next');
var extend = require('util')._extend
var AlchemyApi = require("./../alchemyapi");
var alchemyapi = new AlchemyApi();
 
var personality_insights = watson.personality_insights({
  username: '81945be6-cd8d-4dbf-9954-2514d254e786',
  password: 'nj8bLN9zryeQ',
  version: 'v2'
});
 

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/', function(req, res, next) {
  var parameters = extend(req.body, { acceptLanguage : i18n.lng() });
  personality_insights.profile(parameters,
    function (err, response) {
      if (err)
        console.log('error:', err);
      else
        res.json(response);
  });
});

router.post('/verbs', function(req, res, next) {
  var myText = req.body.text;
  alchemyapi.relations("text", myText, {}, function(response) {
    res.json(response);
  });
});
module.exports = router;
