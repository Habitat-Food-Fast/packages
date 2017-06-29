// import SimpleSchema from 'simpl-schema';
class APIKeyCollection extends Mongo.Collection {
  insert(doc, callback){
    _doc = _.extend(doc, {
      createdAt: new Date(),
      key: doc.key,
      owner: doc.owner,
      webhooks: {
        menu: '',
        accept: '',
        decline: '',
        assign: '',
        complete: '',
        refund: '',
      },
      permissions: doc.permissions
    }); console.log(_doc);
    return super.insert(_doc, callback);
  }
}
APIKeys = new APIKeyCollection( 'api-keys' );
APIRequests = new Meteor.Collection('api-requests')

APIKeys.schema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  createdAt: { type: Date, },
  owner: { type: String, },
  key: { type: String, },
  roles: { type: [String], optional: true },
  permissions: { type: Object, },
    'permissions.order': { type: Boolean, optional: true,  },
    'permissions.accept': { type: Boolean, optional: true,  },
    'permissions.decline': { type: Boolean, optional: true,  },
    'permissions.assign': { type: Boolean, optional: true,  },
    'permissions.menu': { type: Boolean, optional: true,  },
  'webhooks': { type: Object, optional: true },
    'webhooks.menu': { type: String, optional: true },
    'webhooks.accept': { type: String, optional: true },
    'webhooks.decline': { type: String, optional: true },
    'webhooks.assign': { type: String, optional: true },
    'webhooks.complete': { type: String, optional: true, },
    'webhooks.refund': { type: String, optional: true },
});

APIKeys.attachSchema(APIKeys.schema);
