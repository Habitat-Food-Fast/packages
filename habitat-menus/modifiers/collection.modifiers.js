Modifiers = new Mongo.Collection("modifiers");
modCategories = new Mongo.Collection('modcategories');

modCategories.allow({
  update () { return Roles.userIsInRole(Meteor.userId(), ['admin']); }
});
