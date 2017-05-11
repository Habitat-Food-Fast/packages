class saleItemsCollection extends Mongo.Collection {
  insert(doc, callback) {
    return super.insert(_.extend(doc, {
      photoUrl: '',
      isHiddenFromMenu: false,
      featured: true
    }), (err, saleItemId) => {
      if(err) { throw new Meteor.Error(err.message); } else {
        Modifiers.update(
          {_id: {$in: doc.modifiers} },
          { $push: { itemId: saleItemId } },
          { multi: true },
        (err, count) => {
          if(err) { throwError(err.message); } else {
          }
        });
      }
    });
  }
  forceInsert(docs, callback){
    return super.batchInsert(docs, callback);
  }
  remove(id, callback){
    return super.remove(id, (err, res) => {
      if(err) { throw new Meteor.Error(err.message); }
      Modifiers.remove({uid: id}, {multi: true});
    });
  }
  forceRemove(callback){
    return super.remove({}, callback);
  }
}

saleItems = new saleItemsCollection("saleitems");
saleItems.initEasySearch(['name'], {
  'limit': 100,
  'use': 'mongo-db',
  'convertNumbers': true
});
