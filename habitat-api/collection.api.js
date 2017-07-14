// import SimpleSchema from 'simpl-schema';
class APIKeyCollection extends Mongo.Collection {
  insert(doc, callback){
    const key = doc.key || Random.hexString(32)
    _doc = _.extend(doc, {
      createdAt: new Date(),
      key: key,
      owner: doc.owner,
      lastUsed: new Date(),
      webhooks: {
        menu: '',
        accept: '',
        decline: '',
        assign: '',
        complete: '',
        refund: '',
      },
      permissions: doc.permissions,
      production: !Meteor.settings.devMode
    });
    if (Meteor.users.findOne(doc.owner)) {
      Meteor.users.update(doc.owner, {$set: {apiKey: key}});
    }
    return super.insert(_doc, callback);
  }
  addPartner(ownerName, key, baseUrl, sessionToken, callback){
    return this.insert({
      owner: ownerName,
      key: key,
      role: 'partner',
      baseUrl: '',
      sessionToken: '',
      auth: {
        url: '',
        headers: {},
        body: {},
      },
      webhooks: {
        menu: '',
        accept: '',
        decline: '',
        assign: '',
        complete: '',
        refund: '',
      },
      permissions: {
        order: true,
        accept: true,
        decline: true,
        assign: true,
        menu: true,
      }
    }, callback)
  }
  updateSession(owner, authBody, callback){
    key = APIKeys.findOne({owner});
    console.log(authBody.headers);
    try {
      const sessionToken = HTTP.post(key.auth.url, authBody); console.log(sessionToken);
      return APIKeys.update({owner}, { $set: {
        sessionToken: sessionToken.data.data,
        'auth.headers': authBody.headers,
      }})
    } catch (e) {
      throwError({ reason: e.message})
    }
  }
}
APIKeys = new APIKeyCollection( 'api-keys' );
APIRequests = new Meteor.Collection('api-requests');

APIKeys.schema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  createdAt: { type: Date, },
  owner: { type: String, },
  key: { type: String, },
  baseUrl: { type: String, optional: true },
  sessionToken: { type: Object, blackbox: true, optional: true },
  role: { type: String, optional: true, allowedValues: ['admin', 'vendor', 'partner', 'user', 'runner', 'developer'] },
  production: { type: Boolean },
  lastUsed: { type: Date },
  auth: { type: Object, blackbox: true, optional: true },
    'auth.url': { type: String, optional: false },
    'auth.headers': { type: Object, blackbox: true, optional: false},
    'auth.body': { type: Object, blackbox: true, optional: false },
  permissions: { type: Object, optional: true, },
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

Meteor.methods({
  createApiKey(userId) {
    if (APIKeys.findOne({owner: userId})) {
      console.warn(`${userId} already has an API KEY, removing and replacing...`);
      APIKeys.remove(APIKeys.findOne({owner: userId})._id);
    }
    const user = Meteor.users.findOne(userId);
    let permissions;
    let role;
    if (user.roles.includes('admin')) {
      permissions = {
        accept: true,
        decline: true,
        menu: true,
        order: true,
        assign: true
      };
      role = 'admin';
    } else if (user.roles.includes('vendor')) {
      permissions = {
        accept: true,
        decline: true,
        order: true
      };
      role = 'vendor';
    } else if (user.roles.includes('runner')) {
      permissions = {
        assign: true,
        order: true
      };
      role = 'runner'
    } else {
      permissions = {
        order: true
      };
      role = 'user'
    }
    APIKeys.insert({owner: userId, permissions: permissions, role: role}, (err, res) => {
      if (err) {
        throwError(err);
      }
    });
  }
});
