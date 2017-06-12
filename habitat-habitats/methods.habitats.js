Habitats.methods = {
  insert: new ValidatedMethod({
  name: 'Habitats.methods.insert',
  validate: new SimpleSchema({
    name: { type: String },
    icon: { type: String },
    coords: { type: Array},
    'coords.$': { type: Array },
    'coords.$.$': { type: [Number], decimal: true }
  }).validator(),
  run({ name, icon, coords }) {
    if(coords.length !== 1 || coords[0].length < 3) {
      throwError('coords in wrong format');
    } else if (!Meteor.user() || !Meteor.user().roles.includes('admin')) {
      throwError('notAuthorized');
    }
    return Habitats.insert({
      "name" : name,
      "icon" : icon,
      "order" : Habitats.find().count() + 1,
      "featured" : false,
      "open" : false,
      "mealsEnabled" : true,
      "surge" : false,
      "orderType" : "either",
      "bounds" : {
          "type" : "geojson",
          "data" : {
              "type" : "Feature",
              "properties" : {
                  "name" : name
              },
              "geometry" : {
                  "type" : "Polygon",
                  "coordinates" : coords
              }
          }
      },
      "weeklyHours" : Habitats.setHours(),
    });
  }
}),
updateRadius: new ValidatedMethod({
  name: 'Habitats.methods.updateRadius',
  validate: new SimpleSchema({
    id: {type: String },
    radius: {type: Array},
    'radius.$': {type: [Number], decimal: true }
  }).validator(),
  run({id, radius}) {
    if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) { throw new Meteor.Error('unauthorized'); }
    Habitats.update(id, {$unset: {'bounds.data.geometry.coordinates': ''}}, (err, res) => {
      if (!err) {
        Habitats.update(id, {$set: {'bounds.data.geometry.coordinates': radius}}, (err, res) => {
          if (err) {
            throw new Meteor.Error('Failure to update');
          }
        });
      }
    });
  }
})
};
