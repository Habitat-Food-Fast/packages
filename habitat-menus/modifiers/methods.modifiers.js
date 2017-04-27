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
  })
};
