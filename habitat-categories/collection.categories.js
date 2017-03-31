Categories = new Mongo.Collection("categories");

class CategoriesCollection extends Mongo.Collection {
  insert(doc) {
    if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
      throw new Meteor.Error('Not Authorized');
    }
  }
}
