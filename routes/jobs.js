
var express = require('express');
var router = express.Router();
var axios = require("axios");

router.get('/:id', function(req, res, next) {
  axios({
    method: "get",
    url: "https://authenticjobs.com/api/?api_key=4534ad692cb05a0ef1c7e7b07f722cd0&method=aj.jobs.get&id=" + req.params.id + "&format=json"
  }).then(function(data) {
    res.status(200).json(data);

  });

});
module.exports = router;
