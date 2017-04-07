Modifiers.methods = {
  updateOrderBeforeCheckout: new ValidatedMethod({
    name: 'modifiers.methods.updateOrderBeforeCheckout',
    validate: new SimpleSchema({
      transId: { type: String, optional: false },
      orderId: { type: Number, optional: false },
      saleItemInstructions: { type: String, optional: true },
      modsToUpdate: { type: [String], optional: true },
    }).validator(),
    run({ transId, orderId, saleItemInstructions, modsToUpdate }) {
      transactions.update({_id: transId, 'order.orderId': orderId},
        {
          $set: {
            'order.$.itemInstructions': saleItemInstructions,
            'order.$.modifiers': modsToUpdate,
          }
        }, (err) => { if(err) { throw new Meteor.Error(err.message); } }
      );
    }
  }),
  removeSaleItemFromCart: new ValidatedMethod({
    name: 'modifiers.methods.removeSaleItemFromCart',
    validate: new SimpleSchema({
      transId: { type: String, optional: false },
      orderId: { type: Number, optional: false },
    }).validator(),
    run({ transId, orderId }) {
      transactions.update(transId , { $pull: {order: { orderId: orderId }} }, (err) => {
        if(err) { throw new Meteor.Error(err.message); }
        }
      );
    }
  }),
  addOrderQuantity: new ValidatedMethod({
    name: 'modifiers.methods.addOrderQuantity',
    validate: new SimpleSchema({
      obj: { type: Object },
      'obj.itemInstructions': { type: String, optional: true },
      'obj.itemPrice': { type: Number, decimal: true },
      'obj.modifiers': { type: [String], optional: true },
      'obj.fromFeatured': { type: Boolean, optional: true },
      'obj.orderId': { type: Number},
      'obj.saleItemId': { type: String },
      txId: { type: String },
      add: { type: Boolean }
    }).validator(),
    run({ obj, txId, add}) {
      obj.orderId = obj.orderId + 1;
      if (add) {
        transactions.update(txId, {$push: {order: obj}});
      } else {
        transactions.update(txId, {$pull: {order: obj}});
      }
    }
  })
};
