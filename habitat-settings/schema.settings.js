Settings.schema = [
  {
    "_id" : "7eGouYcmBiiwHampy",
    "name" : "feedRender",
    "vendor" : false
  }, {
    "_id" : "8DhQd3A2m4giadsfcWX",
    "name" : "orderTypeRestriction",
    "type" : "pickup"
  }, {
    "_id" : "AREGkctb783x3vtTi",
    "name" : "deliveryFee",
    "fee" : 2.99
  }, {
    "_id" : "bQdCEGig6tnKDD3ja",
    "name" : "mealsOpen",
    "enabled" : true
  }, {
    "_id" : "QHTRPC2f3WLcvuJPm",
    "name" : "mainFeed",
    "feed" : "vendor"
  }, {
    "_id" : "YJQd5ny8qy4yYk5rF",
    "name" : "sortVendorFeed",
    "by" : "order"
  }, {
    "_id" : "7eFpuYcmBiiwHamtu",
    "name" : "runOpenOrCloseBiz",
    "open" : true
  }, {
    "_id" : "569ef272a82631a3b2309cc4",
    "name" : "updateMessage",
    "message" : "Update taking a while? Switch off WiFi or restart the app if this continues for more than a few minutes. If you have any issues, get in touch at 443-386-9479 or info@tryhabitat.com"
  }, {
    "_id" : "xPXjmcMmZv5rhJ9tv",
    "name" : "globalTipAmount",
    "amount" : 1
  }, {
    "_id" : "56b382a1a826caa93dd9986e",
    "name" : "threeFeedsVisible",
    "allVisible" : false
  }, {
    "_id" : "HwQC39gjnn9PtpbQc",
    "name" : "sortMealsFeed",
    "by" : "order"
  }, {
    "_id" : "7eFpuYcmBiiwHghit",
    "name" : "weeklyMilliCount",
    "count" : 479580881
  }, {
    "_id" : "56d8838c924807212c656521",
    "name" : "parentDiscountProp",
    "prop" : ""
  }, {
    "_id" : "zSg3hHA5nDAFMan35",
    "name" : "parentPromos",
    "codes" : [
        "Nice",
        "hangout",
        "MEAL DEAL",
        "SUMMERTIME",
    ],
    "sentEmails" : [
        "Quhx4aAWusnGhdBMv",
        "waoBNrYoq5D5stmK6",
        "HfpJwxTFfoeCpxxyn",
        "Mt9xZTQFmXpRLjfGY",
        "fEYFDvoGPxXEjK2is",
        "4s3H4i3iXkFbc3eX7",
        "mvhhN5DwBtrD6fPEt"
    ]
  }, {
    "_id" : "wdebeuPJgztPZjoaz",
    "name" : "estimatedDeliveryTime",
    "time" : 15
  }, {
    "_id" : "56fd865fa82694e07ed27a47",
    "name" : "androidLink",
    "link" : "itms-apps://itunes.apple.com/us/app/habitat-student-marketplace/id970190145"
  }, {
    "_id": "59870d65fa82694e07ed2",
    "name": "pushContent",
    "title": "",
    "text": ""
  }, {
    "_id" : "56b382a1a826caa93dd9766p",
    "name" : "runHabitatHours",
    "open" : true
  }, {
    "_id" : "56b382a1a826caa93dd9765g",
    "name" : "newAppIsAvailable",
    "is" : false
  }
];

Meteor.startup(function(){
  if(Meteor.isServer && Settings.find().count() !== Settings.schema.length){
    console.warn('WARNING: RESETTING HABITAT TO SCHEMA');
    Settings.remove({}, {multi: true});
    Settings.schema.forEach(s => Settings.insert(s));
  }
});
