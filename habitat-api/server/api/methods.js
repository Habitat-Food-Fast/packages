import SimpleSchema from 'simpl-schema';

API.methods = {
  ping: {
    GET(context, connection){
      if (!API.utility.hasData(connection.data)) {
        return API.utility.response(context, 400, { error: 400, message: `Invalid request: No data passed on GET`, });
      } else{
        return API.utility.response( context, 200, _.omit(APIKeys.findOne({key: connection.data.api_key}), '_id'));
      }
    }
  },
  vendors: {
    GET( context, connection ) {
      let getVendors;
      const hasQuery = API.utility.hasData( connection.data );
      if (connection.data.vendorId) {
        connection.data.owner = connection.owner;
        getVendors = businessProfiles.find(connection.data.vendorId).fetch();
        return getVendors.length > 0 ?
          API.utility.response( context, 200, getVendors ) :
          API.utility.response( context, 404, { error: 404, message: "No vendors found, dude." } );
      } else {
        getVendors = businessProfiles.find().fetch();
        return API.utility.response( context, 200, getVendors);
      }
    },
  },
  zones: {
    GET( context, connection ) {
      let getZones;
      const hasQuery = API.utility.hasData( connection.data );
      fields = {
        name: 1,
        open: 1,
        bounds: 1
      }
      if (connection.data.zoneId) {
        connection.data.owner = connection.owner;
        getZones = Habitats.find(connection.data.zoneId, {fields: fields}).fetch();
        return getZones.length > 0 ?
          API.utility.response( context, 200, getZones ) :
          API.utility.response( context, 404, { error: 404, message: "No zones found." } );
      } else {
        getZones = Habitats.find({}, {fields: fields}).fetch();
        return API.utility.response( context, 200, getZones);
      }
    },
  },
  menus: {
    GET(context, connection){
      console.warn('hit menu get')
      if (!API.utility.hasData(connection.data)) {
        return API.utility.response(context, 400, { error: 400, message: `Invalid request: No data passed on GET`, });
      } else if(!connection.data.sellerId){
        return API.utility.response(context, 400, { error: 400, message: `Invalid request: No sellerId passed on GET`, });
      } else if(!businessProfiles.findOne(connection.data.sellerId)) {
        return API.utility.response(context, 400, { error: 400, message: `Invalid request: sellerId doesn't match any vendors`, });
      } else {
        console.log(`about to fetch menu`);
        return API.utility.response( context, 200, { message: 'Here is the menu', data: menu });
      }
    }
  },
  orders: {
    GET( context, connection ) {
      let getOrders;
      const hasQuery = API.utility.hasData( connection.data );
      if ( hasQuery ) {
        connection.data.owner = connection.owner;
        getOrders = transactions.find( connection.data ).fetch();

        return getOrders.length > 0 ?
          API.utility.response( context, 200, getOrders ) :
          API.utility.response( context, 404, { error: 404, message: "No transactions found, dude." } );
      } else {
        getOrders = transactions.find({ "owner": connection.owner }).fetch();
        return API.utility.response( context, 200, getOrders);
      }
    },
    POST( context, connection ) {
      if (!API.utility.hasData(connection.data)) {
        return API.utility.response(context, 400, { error: 400, message: `Invalid request: No data passed on POST`, });
      } else {
        try {
          delete connection.data.api_key; //no longer need this now that partner has been validated
          const bp = businessProfiles.findOne(connection.data.sellerId);
          const usr = Meteor.users.findOne(businessProfiles.findOne(connection.owner) ? bp.uid : connection.owner);
          connection.data.sellerId =  bp ? bp._id : '';
          connection.data.company_name = bp ? bp.company_name : '';
          connection.data.thirdParty = !usr //if owner is not habitat user
          connection.data.partnerName = usr ? '' : connection.owner;
          connection.data.DaaS = !usr ||
            usr.roles.includes('admin') ||
            usr.roles.includes('vendor') ||
            connection.data.thirdParty && connection.data.method === 'Delivery';

          validateOrder(context, connection.data);
          const txId = transactions.insert(connection.data);
          return API.utility.response( context, 200, { message: 'Successfully created order!', orderId: txId });
        } catch(exception) {
          return API.utility.response(context, 403, { error: 403, message: exception.message, });
        }
      }
    },
    PUT( context, connection ) {
      var hasQuery  = API.utility.hasData( connection.data ),
          validData = API.utility.validate( connection.data, Match.OneOf(
            { "_id": String, "status": String }
          ));

      if ( hasQuery && validData ) {
        const transaction = transactions.findOne(connection.data._id, { fields: { "_id": 1 } } );
        if (transaction) {
          return transactions.update(connection.data._id, { $set: connection.data }, (err) => {
            if(err) { console.warn(err.message); } else {
              return API.utility.response( context, 200, { "message": "Order successfully updated!" } );
            }
          });
        } else {
          return API.utility.response( context, 404, { "message": "Can't update a non-existent pizza, homeslice." } );
        }
      } else {
        return API.utility.response( context, 403, { error: 403, message: "PUT calls must have a pizza ID and at least a name, crust, or toppings passed in the request body in the correct formats (String, String, Array)." } );
      }
    },
  }
};
