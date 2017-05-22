Meteor.startup(function(){
  if(Meteor.isServer && !Habitats.find().count()){
    console.warn('WARNING: RESETTING HABITAT TO SCHEMA STATE');
    Habitats.remove({}, {multi: true});
    Habitats.defaults.forEach(h => Habitats.insert(h));
    if(Meteor.settings.devMode && !Meteor.settings.inspectorMode){
      Habitats.update({name: 'Test Habitat'}, {$set: {
        featured: true
      }}, (err) => { if(err) { console.warn(err.message); }});
    }
  }
});

zones = () => ([
  {
    name: 'Plus',
    multiplier: 1.5,
    min: 1,
    max: 799,
  },
  {
    name: 'Distance',
    multiplier: 2.0,
    min: 800,
    max: 1999,
  },
  {
    name: 'Premium',
    multiplier: 2.5,
    min: 2000,
    max: 5000,
  }
]);
Habitats.defaults = [
  {
    "_id" : "zfY5SkgFSjXcjXbgW",
    "deliveryTime": 15,
    "staffJoyId": 3,
    "staffJoyRunnerRole": 5,
    "staffJoyDispatchRole": 6,
    "name" : "University City",
    "icon" : "penn",
    "order" : 2,
    "featured" : true,
    "open" : true,
    "mealsEnabled" : true,
    "surge" : false,
    "orderType" : "either",
    "bounds" : {
        "type" : "geojson",
        "data" : {
            "type" : "Feature",
            "properties" : {
                "name" : "Ucity"
            },
            "geometry" : {
                "type" : "Polygon",
                "coordinates": [
  [
    [
      -75.19652366638184,
      39.93863256077298
    ],
    [
      -75.19206047058105,
      39.94323904802225
    ],
    [
      -75.18802642822266,
      39.94731882060564
    ],
    [
      -75.18287658691406,
      39.94988500451482
    ],
    [
      -75.18115997314453,
      39.952648479526374
    ],
    [
      -75.17987251281738,
      39.95745139661032
    ],
    [
      -75.18030166625975,
      39.959819834275656
    ],
    [
      -75.18098831176758,
      39.961332959837826
    ],
    [
      -75.18330574035645,
      39.963898617960986
    ],
    [
      -75.18407821655273,
      39.96468803186065
    ],
    [
      -75.20227432250977,
      39.96337233696405
    ],
    [
      -75.20905494689941,
      39.963043409283806
    ],
    [
      -75.21540641784668,
      39.96324076608185
    ],
    [
      -75.22150039672852,
      39.96488538391138
    ],
    [
      -75.22107124328612,
      39.9565303153649
    ],
    [
      -75.22184371948242,
      39.95251688800991
    ],
    [
      -75.20690917968749,
      39.950674580196505
    ],
    [
      -75.20158767700195,
      39.94968760917033
    ],
    [
      -75.19961357116699,
      39.94837162564995
    ],
    [
      -75.19952774047852,
      39.94462093372432
    ],
    [
      -75.20390510559082,
      39.94310743840445
    ],
    [
      -75.20510673522949,
      39.94172552213358
    ],
    [
      -75.20476341247559,
      39.94080422911386
    ],
    [
      -75.19652366638184,
      39.93863256077298
    ]
  ]
]

            }
        }
    },
    "weeklyHours" : Habitats.setHours(),
    "zones": zones(),
  },
  {
    "_id" : "g77XEv8LqxJKjTT8k",
    "deliveryTime": 15,
    "staffJoyId": 2,
    "staffJoyRunnerRole": 3,
    "staffJoyDispatchRole": 4,
    "name" : "Temple",
    "icon" : "owl",
    "orderType" : "either",
    "order" : 0,
    "featured" : true,
    "mealsEnabled" : true,
    "open" : true,
    "surge" : false,
    "bounds" : {
        "type" : "geojson",
        "data" : {
            "type" : "Feature",
            "properties" : {
                "name" : "Temple"
            },
            "geometry" : {
                "type" : "Polygon",
                "coordinates": [
          [
            [
              -75.16665458679199,
              39.97225278615979
            ],
            [
              -75.15257835388184,
              39.97034523140161
            ],
            [
              -75.14837265014648,
              39.988662135535506
            ],
            [
              -75.16536712646484,
              39.99083221532039
            ],
            [
              -75.16867160797119,
              39.975377114288165
            ],
            [
              -75.16665458679199,
              39.97225278615979
            ]
          ]
        ]
            }
        }
    },
    "weeklyHours" : Habitats.setHours(),
    "zones": zones(),
  },
  {
    "_id": "bYguNijgQGw88mhjv",
    "staffJoyId": 6,
    "staffJoyRunnerRole": 13,
    "staffJoyDispatchRole": 14,
    "name" : "Fairmount",
    "icon" : "owl",
    "orderType" : "either",
    "order" : 0,
    "featured" : true,
    "mealsEnabled" : true,
    "open" : true,
    "surge" : false,
    "bounds" : {
        "type" : "geojson",
        "data" : {
            "type" : "Feature",
            "properties" : {
                "name" : "Fairmount"
            },
            "geometry" : {
                "type" : "Polygon",
                "coordinates" :  [
          [
            [
              -75.15978813171387,
              39.971003014917976
            ],
            [
              -75.16785621643066,
              39.97231856296058
            ],
            [
              -75.16948699951172,
              39.97554154865434
            ],
            [
              -75.17807006835938,
              39.97462071110789
            ],
            [
              -75.17961502075194,
              39.974489161874125
            ],
            [
              -75.18141746520996,
              39.96751669015106
            ],
            [
              -75.18407821655273,
              39.96481959995776
            ],
            [
              -75.18176078796387,
              39.96106980997141
            ],
            [
              -75.17798423767088,
              39.96008298895259
            ],
            [
              -75.1710319519043,
              39.95935931115414
            ],
            [
              -75.16227722167969,
              39.958306675229906
            ],
            [
              -75.15978813171387,
              39.971003014917976
            ]
          ]
        ]
            }
        }
    },
    "weeklyHours" : Habitats.setHours(),
    "zones": zones(),
  },
  {
    "_id": "TMdKN6FhxdbyoXodY",
    "staffJoyId": 6,
    "staffJoyRunnerRole": 13,
    "staffJoyDispatchRole": 14,
    "name" : "Test Habitat",
    "icon" : "owl",
    "orderType" : "either",
    "order" : 0,
    "featured" : false,
    "mealsEnabled" : true,
    "open" : true,
    "surge" : false,
    "bounds" : {
        "type" : "geojson",
        "data" : {
            "type" : "Feature",
            "properties" : {
                "name" : "CC"
            },
            "geometry" : {
                "type" : "Polygon",
                "coordinates" :  [
          [
            [
              -75.16360759735107,
              39.95426045505634
            ],
            [
              -75.16965866088867,
              39.955082876914574
            ],
            [
              -75.16910076141356,
              39.946595007738985
            ],
            [
              -75.15004634857176,
              39.94475254043076
            ],
            [
              -75.14691352844238,
              39.95225370421749
            ],
            [
              -75.16360759735107,
              39.95426045505634
            ]
          ]
        ]
            }
        }
    },
    "weeklyHours" : Habitats.setHours(),
    "zones": zones(),
  }
];

insertFairmount = () => {

  Habitats.insert({
    "_id": "bYguNijgQGw88mhjv",
    "staffJoyId": 6,
    "staffJoyRunnerRole": 13,
    "staffJoyDispatchRole": 14,
    "name" : "Fairmount",
    "icon" : "owl",
    "orderType" : "either",
    "order" : 0,
    "featured" : true,
    "mealsEnabled" : true,
    "open" : true,
    "surge" : false,
    "bounds" : {
        "type" : "geojson",
        "data" : {
            "type" : "Feature",
            "properties" : {
                "name" : "Fairmount"
            },
            "geometry" : {
                "type" : "Polygon",
                "coordinates" :  [
          [
            [
              -75.15978813171387,
              39.971003014917976
            ],
            [
              -75.16785621643066,
              39.97231856296058
            ],
            [
              -75.16948699951172,
              39.97554154865434
            ],
            [
              -75.17807006835938,
              39.97462071110789
            ],
            [
              -75.17961502075194,
              39.974489161874125
            ],
            [
              -75.18141746520996,
              39.96751669015106
            ],
            [
              -75.18407821655273,
              39.96481959995776
            ],
            [
              -75.18176078796387,
              39.96106980997141
            ],
            [
              -75.17798423767088,
              39.96008298895259
            ],
            [
              -75.1710319519043,
              39.95935931115414
            ],
            [
              -75.16227722167969,
              39.958306675229906
            ],
            [
              -75.15978813171387,
              39.971003014917976
            ]
          ]
        ]
            }
        }
    },
    "weeklyHours" : Habitats.setHours(),
    "zones": zones(),
  }, (err) => {
    if(err) { console.warn(err.message); }
  })
}
