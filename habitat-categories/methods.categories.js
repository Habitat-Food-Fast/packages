Meteor.methods({
  insertNewCat(name) {
    if (!Categories.findOne({name: name})) {
      const len = Categories.find().fetch().length;
      Categories.insert({name: name, order: len + 1, businesses: []});
    } else {
      throw new Meteor.Error('Category already exists');
    }
  },

  updateCatOrder( items ) {
    if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
      throw new Meteor.Error('Not Authorized');
    }
    items.forEach(item => Categories.update(item._id, { $set: { order: item.order } }));
  },

  updateCatBiz(id, bizId, type) {
    if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
      throw new Meteor.Error('Not Authorized');
    }
    if (type) {
      Categories.update(id, { $push: { businesses: bizId } });
    } else {
      Categories.update(id, { $pull: { businesses: bizId } });
    }
  },

  editCatName(id, name) {
    if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
      throw new Meteor.Error('Not Authorized');
    }
    if (!Categories.findOne({name: name})) {
      const len = Categories.find().fetch().length;
      Categories.update(id, { $set: { name: name } });
    } else {
      throw new Meteor.Error('Category already exists');
    }
  },

  removeCategory(id) {
    if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
      throw new Meteor.Error('Not Authorized');
    }
    Categories.remove(id);
  }
});
