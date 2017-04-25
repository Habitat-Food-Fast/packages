API.methods = {
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
      if (API.utility.hasData(connection.data)) {
        console.log(connection.data);
        connection.data.owner = connection.owner;
        let res;
        try {
          if(connection.data.isDelivery) {
            console.log('isDelivery');
            res = transactions.methods.searchForAddress.call({address: connection.data.deliveryAddress});
            console.log(res);
          }
          bp = businessProfiles.findOne(connection.data.sellerId);
          if(!bp) { return API.utility.response(context, 400, { error: 400, message: `Can't find business ${connection.data.companyName}`, }); } else {
            transactions.methods.insertDaaS.call({
              isDelivery: connection.data.isDelivery,
              deliveryAddress: connection.data.isDelivery ? res.features[0].place_name : '',
              deliveryInstructions: connection.data.isDelivery ? connection.data.deliveryInstructions : '',
              loc: connection.data.isDelivery ? res.features[0].geometry : {},
              sellerId: bp._id,
              DaaSType: connection.data.orderType, //credit_card, prepaid, or cash
              fromAPI: true,
              thirdParty: true,
              partnerName: connection.data.owner,
              customerName: `${connection.data.customer.firstName} ${connection.data.customer.lastName}`,
              customerPhone: connection.data.customer.phone,
              customerEmail: connection.data.customer.email,
              order: connection.data.order,
              payRef: connection.data.payRef,
            }, (err, id) => {
              if(err) {
                API.utility.response(context, 403, { error: 403, message: err.message, });
              } else {
                console.log(`id after instert daas ${id}`);
                Meteor.call('requestTxWrapper', id, connection, (err) => {
                  if(err) { console.warn(err.message); } else {
                    console.log('success');
                  }
                });
                API.utility.response( context, 200, {_id: id, "message": "Transaction successfully created!" });
              }
            });
          }
        } catch(exception) {
          console.log(exception);
          return exception;
        }
      }
    },
    PUT( context, connection ) {
      var hasQuery  = API.utility.hasData( connection.data ),
          validData = API.utility.validate( connection.data, Match.OneOf(
            { "_id": String, "name": String },
            { "_id": String, "crust": String },
            { "_id": String, "toppings": [ String ] },
            { "_id": String, "name": String, "crust": String },
            { "_id": String, "name": String, "toppings": [ String ] },
            { "_id": String, "crust": String, "toppings": [ String ] },
            { "_id": String, "name": String, "crust": String, "toppings": [ String ] }
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
    DELETE( context, connection ) {
      var hasQuery  = API.utility.hasData( connection.data ),
          validData = API.utility.validate( connection.data, { "_id": String } );

      if ( hasQuery && validData ) {
        var pizzaId  = connection.data._id;
        var getOrder = transactions.findOne(pizzaId, { fields: { "_id": 1 } } );

        if ( getOrder ) {
          return transactions.remove(pizzaId, (err) => {
            if(err) { console.warn( err.message); } else {
              return API.utility.response( context, 200, { "message": "Order removed!" } );
            }
          });

        } else {
          return API.utility.response( context, 404, { "message": "Can't delete a non-existent order, homeslice." } );
        }
      } else {
        return API.utility.response( context, 403, { error: 403, message: "DELETE calls must have an _id (and only an _id) in the request body in the correct format (String)." } );
      }
    }
  }
};

Meteor.methods({
    requestTxWrapper(id, connection,onnection) {
      transactions.update(id, {$set: {status: 'pending_vendor'}}, (err) => {
        if(err) { console.warn(err.message); }
        Meteor.call('remoteVendorContact', id, connection.data.key, (err) => {
          if(err) { console.warn(err.message); } else {
          }
        });
      })
    }
});
