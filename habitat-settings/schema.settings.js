
Settings.schema = [
  {
    "_id" : "8DhQd3A2m4giadsfcWX",
    "name" : "orderTypeRestriction",
    "type" : "pickup"
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
    "_id" : "HwQC39gjnn9PtpbQc",
    "name" : "sortMealsFeed",
    "by" : "order"
  }, {
    "_id" : "7eFpuYcmBiiwHghit",
    "name" : "weeklyMilliCount",
    "count" : 479580881
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
  }, {
    "_id" : "67b382a1a566cab93dd987f",
    "name" : "userRadius",
    "delivery" : 1,
    "pickup" : 2
  }, {
    "_id" : "67b382a1a566cab93dd123r",
    "name" : "cateringPrice",
    "first" : 20,
    "additional" : 10
  },
  {
    "_id" : "17b382a1a566cab93dd123r",
    "name" : "runnerMaxOrders",
    "count" : 2,
  },
  {
    "_id" : "28b382a1a566cab93bb555k",
    "name" : "vendorModeMessage",
    "active" : false,
    "message" : ""
  },
  {
    "_id" : "28b382a1a566cab93bc678o",
    "name" : "pendingDispatch",
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
