var express = require('express');
var router = express.Router();
var watson = require('watson-developer-cloud');
var i18n = require('i18next');
var extend = require('util')._extend;
var async = require("async");
var AlchemyApi = require("./../alchemyapi");
var alchemyapi = new AlchemyApi();

var personality_credentials = {
  username: '81945be6-cd8d-4dbf-9954-2514d254e786',
  password: 'nj8bLN9zryeQ',
  version: 'v2'
};

var concept_credentials = {
  url: "https://gateway.watsonplatform.net/concept-insights/api",
  username: "01246e25-5b85-4576-9add-9ec282ccc4a5",
  password: "4ZWZtpiH4isZ",
  version: 'v2'
};
 
var personality_insights = watson.personality_insights(personality_credentials);
var conceptInsights = watson.concept_insights(concept_credentials);

var corpus_id = process.env.CORPUS_ID || '/corpora/public/TEDTalks';
var graph_id = process.env.GRAPH_ID || '/graphs/wikipedia/en-20120601';
 
var getPassagesAsync = function(doc) {
  return function (callback) {
    conceptInsights.corpora.getDocument(doc, function(err, fullDoc) {
      if (err)
        callback(err);
      else {
        doc = extend(doc, fullDoc);
        doc.explanation_tags.forEach(crop.bind(this, doc));
        delete doc.parts;
        callback(null, doc);
      }
    });
  };
};

var crop = function(doc, tag){
  var textIndexes = tag.text_index;
  var documentText = doc.parts[tag.parts_index].data;

  var anchor = documentText.substring(textIndexes[0], textIndexes[1]);
  var left = Math.max(textIndexes[0] - 100, 0);
  var right = Math.min(textIndexes[1] + 100, documentText.length);

  var prefix = documentText.substring(left, textIndexes[0]);
  var suffix = documentText.substring(textIndexes[1], right);

  var firstSpace = prefix.indexOf(' ');
  if ((firstSpace !== -1) && (firstSpace + 1 < prefix.length))
      prefix = prefix.substring(firstSpace + 1);

  var lastSpace = suffix.lastIndexOf(' ');
  if (lastSpace !== -1)
    suffix = suffix.substring(0, lastSpace);

  tag.passage = '...' + prefix + '<b>' + anchor + '</b>' + suffix + '...';
};

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

router.post('/concepts', function(req, res, next) {
  var params = extend({graph: graph_id}, req.body);
  conceptInsights.graphs.annotateText(params, function(err, results) {
    if (err)
      return next(err);
    else
      res.json(results);
  });
});

router.get('/conceptual', function(req, res, next) {
  var params = extend({ corpus: corpus_id, limit: 10 }, req.query);
  conceptInsights.corpora.getRelatedDocuments(params, function(err, data) {
    if (err)
      return next(err);
    else {
      async.parallel(data.results.map(getPassagesAsync), function(err, documentsWithPassages) {
        if (err)
          return next(err);
        else{
          data.results = documentsWithPassages;
          res.json(data);
        }
      });
    }
  });
});

router.get('/labelSearch', function(req, res, next) {
  var params = extend({
    corpus: corpus_id,
    prefix: true,
    limit: 10,
    concepts: true
  }, req.query);

  conceptInsights.corpora.searchByLabel(params, function(err, results) {
    if (err)
      return next(err);
    else
      res.json(results);
  });
});

router.post('/verbs', function(req, res, next) {
  var myText = req.body.text;
  alchemyapi.relations("text", myText, {}, function(response) {
    res.json(response);
  });
});

module.exports = router;
