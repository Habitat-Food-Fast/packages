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

  updateCategory(id, bizId) {
    pull = Categories.findOne(id).businesses.includes(bizId);
    query = pull ? {$pull: bizId} : {$push: bizId};
    Categories.update(id, {businesses: query}, (err) => {
      if (err) {
        throwError(err.message);
      }
    });
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
  },

  updateCatBiz(cat, biz) {
    if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
      throw new Meteor.Error('Not Authorized');
    }
    const c = Categories.findOne(cat);
    if (c.businesses.includes(biz)) {
      Categories.update({_id: cat}, {$pull: {'businesses': biz}});
    } else {
      Categories.update({_id: cat}, {$push: {'businesses': biz}});
    }
  }
});
