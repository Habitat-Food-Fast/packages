import SimpleSchema from 'simpl-schema';

API.methods = {
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
        API.utility.response( context, 200, getVendors);
      }
    },
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
        API.utility.response( context, 200, getOrders);
      }
    },
    POST( context, connection ) {
      if (!API.utility.hasData(connection.data)) {
        return API.utility.response(context, 400, { error: 400, message: `Invalid request: No data passed on POST`, });
      } else {
        try {
          delete connection.data.api_key; //no longer need this now that partner has been validated
          const usr = Meteor.users.findOne(connection.owner);
          const bp = businessProfiles.findOne(connection.data.sellerId);
          connection.data.sellerId =  bp ? bp._id : '';
          connection.data.thirdParty = !usr //if owner is not habitat user
          connection.data.partnerName = usr ? '' : connection.owner;
          connection.data.DaaS = !usr || usr.roles.includes('admin') || usr.roles.includes('vendor');
          validateOrder(context, connection.data);
          const txId = transactions.insert(connection.data);
          API.utility.response( context, 200, { message: 'Successfully created order!', orderId: txId });
        } catch(exception) {
          API.utility.response(context, 403, { error: 403, message: exception.message, });
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
        API.utility.response( context, 403, { error: 403, message: "PUT calls must have a pizza ID and at least a name, crust, or toppings passed in the request body in the correct formats (String, String, Array)." } );
      }
    },
  }
};
