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
      const vendorId = context.params.orderId;
      const hasQuery = API.utility.hasData( connection.data );
      if (vendorId) {
        connection.data.owner = connection.owner;
        vendor = businessProfiles.findOne(vendorId);
        return _.isObject(vendor) ?
          API.utility.response( context, 200, getVendors ) :
          API.utility.response( context, 404, { error: 404, message: "No vendor found." } );
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
  rates: {
    /////Ye all who enter, read the comments.
    /////this is a naive MVP implementation of delivery fee calculation based on distance.
    GET( context, connection ) {
      let getZones;
      const hasQuery = API.utility.hasData( connection.data );
      // const validData = API.utility.validate( connection.data, Match.OneOf(
      //   { "_id": String, "status": String }
      // ));
      const request = {
        vendorId,
        destination,
        bagCount,
        allowedTransport,
      } = connection.data;
      console.log(request);

      if (!connection.data.vendorId) {
          API.utility.response( context, 404, { error: 404, message: "Invalid request: No vendor Id attached." });
      } else if(!businessProfiles.findOne(connection.data.vendorId)) {
        return API.utility.response(context, 400, { error: 400, message: `Invalid request: vendorId doesn't match any vendors`, });
      } else {
        bp = businessProfiles.findOne(connection.data.vendorId);
        //because we don't have full geojson data for each individual vendor, look to backend_habitat
        //currently we don't know what the habitat array is for anymore, and backend habitat has become
        //definitive source for data, runners, etc.
        //Therefore, vendor's zone is the backend_habitat's coordinates
        hab = Habitats.findOne({name: bp.backend_habitat});

        //handle delivery address vs coords being passed up
          console.warn(`Contains characters, this must be an address`);
          try {
            //${lng},${lat}
            const result = HTTP.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${request.destination}.json`, {
              params: {
                country: 'us',
                types: 'address',
                proximity: [ -75.1597308, 39.9802519 ],
                bbox: [-75.27935,39.888665,-75.084343,40.047854],
                access_token: Meteor.settings.public.mapboxKey
              }
            });

            if(result.statusCode === 200){
              const res = JSON.parse(result.content);
              if(!res.features.length){
                return API.utility.response(context, 400, { error: 400, message: `Sorry, outside delivery range`, });
              } else {
                const originCoords = bp.geometry.coordinates; //array [lng,lat]
                const destinationCoords = res.features[0].center; //array [lng,lat]
                const vendorZonePolygon = hab.bounds.data.geometry.coordinates; //array of array of array of [lng, lat]s

                try {
                  url = `https://api.mapbox.com/directions/v5/mapbox/walking/${originCoords.join(',')};${destinationCoords.join(',')}`;
                  console.log(url);
                  const directions = HTTP.get(url, { params: { access_token: Meteor.settings.public.mapboxKey } });
                  const route = directions.data.routes[0];
                  const distanceInMiles = calc._roundToTwo(route.distance * 0.000621371192);
                  const isAvailable = distanceInMiles < 2;
                  //get today's rates object, double the daas rate if outside backend habitat.
                  //api does not have a catering flag, but will have to calculate i

                  const today = businessProfiles.getToday(bp._id);
                  const chargePremium = _chargePremium(bp._id, today, destinationCoords, vendorZonePolygon);

                  try {
                    const quoteId = Quotes.insert({
                      createdAt: new Date(),
                      apiKey: connection.data.api_key,
                      partner: connection.owner,
                      vendorId: bp._id,
                      companyName: bp.company_name,
                      isAvailable: isAvailable,
                      rate: calc._roundToTwo(chargePremium ? today.vendorRates.DaaS.flat * 2 : today.vendorRates.DaaS.flat),
                      currency: 'USD',
                      distance: distanceInMiles,
                      metric: false
                    });
                    const quote = Quotes.findOne(quoteId, {fields: { createdAt: 0, apiKey: 0, partner: 0, companyName: 0, vendorId: 0 }});
                    return API.utility.response( context, 200, quote );
                  } catch (e) {
                    return API.utility.response(context, 400, { error: 400, message: e.message, });

                  }
                } catch (e) {
                  return API.utility.response(context, 400, { error: 400, message: e.message, });
                }
              }
            }
          } catch (e) {
            return API.utility.response(context, 400, { error: 400, message: `Sorry, outside delivery range`, });
          }
      }
    },
  },
  menus: {
    GET(context, connection){
      console.warn('hit menu get')
      if (!API.utility.hasData(connection.data)) {
        return API.utility.response(context, 400, { error: 400, message: `Invalid request: No data passed on GET`, });
      } else if(!connection.data.vendorId){
        return API.utility.response(context, 400, { error: 400, message: `Invalid request: No vendorId passed on GET`, });
      } else if(!businessProfiles.findOne(connection.data.vendorId)) {
        return API.utility.response(context, 400, { error: 400, message: `Invalid request: vendorId doesn't match any vendors`, });
      } else {
        menu = Menus.findOne({vendorId: connection.data.vendorId}, {sort: {lastUpdated: -1}});
        return API.utility.response( context, 200, { message: 'Here is the menu', data: menu });
      }
    }
  },
  orders: {
    GET( context, connection, params ) {
      let getOrders;
      const txId = context.params.orderId;
      console.log(txId);
      const hasQuery = API.utility.hasData( connection.data );
      if ( hasQuery ) {
        connection.data.owner = connection.owner;

        if(txId){
          order = transactions.findOne(txId);
          console.log(order);
          if(order){
            if(order.partnerName === connection.owner || order.buyerId === connection.owner || order.sellerId === connection.owner) {
              return API.utility.response( context, 200, order );
            } else {
              return API.utility.response( context, 401, { error: 401, message: "Can't find that order" } )
            }
            return API.utility.response( context, 401, { error: 401, message: "Can't find that order" } )
          }
        }
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
          request = connection.data;
          delete request.api_key; //no longer need this now that partner has been validated
          const bp = businessProfiles.findOne(request.sellerId);
          if(!bp) { throw new Error(`Sorry, can't find vendor with that ID`) }
          const usr = Meteor.users.findOne(businessProfiles.findOne(connection.owner) ? bp.uid : connection.owner);
          request.sellerId =  bp ? bp._id : '';
          request.company_name = bp ? bp.company_name : '';
          request.thirdParty = !usr //if owner is not habitat user
          request.partnerName = usr ? '' : connection.owner;
          request.DaaS = !usr ||
            usr.roles.includes('admin') ||
            usr.roles.includes('vendor') ||
            request.scheduled ||
            request.catering ||
            request.thirdParty && request.method === 'Delivery';
          request.externalId = request.externalId ? request.externalId.toString() : false;
          request.externalVendorId = request.externalVendorId ? request.externalVendorId.toString() : false;

          if(!request.status){
            if(request.scheduled){
              request.status = 'queued';
            } else if (request.DaaS && request.partnerName !== 'grubhub'){
              request.status = 'pending_runner';
            } else {
              request.status = 'pending_vendor';
            }
          }
          console.log(connection.data);
          cleanDoc = transactions.validate(connection.data);
          const txId = transactions.insert(cleanDoc);
          return API.utility.response( context, 200, { message: 'Successfully created order!', orderId: txId });
        } catch(exception) {
          return API.utility.response(context, 403, { error: 403, message: exception, });
        }
      }
    },
    PATCH( context, connection ) {
      const hasQuery  = API.utility.hasData( connection.data );
      const txId = context.params.orderId;
      if ( hasQuery || txId ) {
        console.log(connection.data);
        const apiObj = APIKeys.findOne({key: connection.data.api_key});
          const tx = transactions.findOne(txId);
          if (tx) {
            const url = context.route.handler.path;
            if (url.includes === 'accept' && apiObj.permissions.accept) {
              API.methods.acceptOrder(txId, apiObj);
              return API.utility.response( context, 200, { message: 'Successfully accepted order!', orderId: txId });
            } else if (url.includes === 'assign' && apiObj.permissions.assign) {
              API.methods.assignRunner(txId, connection.data.runnerId, apiObj);
              return API.utility.response( context, 200, { message: 'Successfully assigned order!', orderId: txId });
            } else if (url.includes === 'decline' && apiObj.permissions.decline) {
              API.methods.declineOrder(txId, apiObj);
              return API.utility.response( context, 200, { message: 'Successfully declined order.', orderId: txId });
            } else {
              return API.utility.response( context, 403, { error: 401, message: "Your permissions don't allow for that PATCH." } );
            }
          } else {
            return API.utility.response( context, 404, { "message": "No order found for the orderId in your PATCH URL." } );
          }
      } else {
        return API.utility.response( context, 403, { error: 403, message: "PATCH calls require an orderId in the URL, and an object with the appropriate data." } );
      }
    },
  },
  acceptOrder(txId, apiObj) {
    const tx = transactions.findOne(txId);
    transactions.update(txId, { $set: {
      acceptedByVendor: apiObj.permissions.role === 'vendor',
      acceptedByAdmin: apiObj.permissions.role === 'admin',
      acceptedAt: new Date(),
      acceptedBy: apiObj.owner,
    }}, (err, res) => {
      if (err) { throwError(err.message); }
      if (!tx.DaaS) {
        Meteor.call('sendUserReceiptEmail', txId);
      }
      if (tx.promoId) { Instances.redeem(tx.promoId, tx.buyerId, true); }
      if (!tx.DaaS && tx.payRef.platformRevenue > 0) {
        Meteor.call('submitForSettlement', tx.braintreeId, tx.payRef.platformRevenue, (err, res) => {
          if (err) { throw new Meteor.Error(err.message); }
        });
      }
    });
    const type = tx.method === 'Pickup' ? acceptPickup : acceptDelivery;
    return transactions.methods.type.call({txId: id});
  },
  declineOrder(txId, apiObj) {
    let role = apiObj.permissions.role;
    if (role === 'admin') { role = 'god'; }
    const tx = transactions.findOne(txId);
    if(!Meteor.settings.devMode && from !== 'god' && !tx.DaaS){ Meteor.call('closeBusinessForToday', tx.sellerId); }
    if (!tx.DaaS) {
      Meteor.call('orderDeclinedVendorText', tx._id, from, missed, (err, res) => {
        console.log(JSON.stringify(err, null, 2));
        console.log(JSON.stringify(res, null, 2));
          });
      Meteor.call('orderDeclinedBuyerText', tx.buyerId, tx.sellerId, (err, res) => {
        console.log('inside of the send buyer text');
        console.log(JSON.stringify(err, null, 2));
        console.log(JSON.stringify(res, null, 2));
        });
      return Meteor.call('voidTransaction', tx.braintreeId, (err) => {
        if(err && tx.braintreeId) { throw new Meteor.Error(err.message); } else {
          console.log('transaction voided');
          Meteor.call('nullifyTransaction', tx._id, (err, res) => {
            if(err) { throw new Meteor.Error(err.message); }
          });
        }
      });
    } else {
      Meteor.call('nullifyTransaction', tx._id, (err, res) => {
        if(err) { throw new Meteor.Error(err.message); }
      });
    }
  },
  assignRunner(txId, runnerId, apiObj) {
    const tx = transactions.findOne(txId);
    const rnr = Meteor.users.findOne(runnerId);
    const runnerObj = transactions.grabRunnerObj(runnerId);
    if(tx && tx.declinedBy && tx.declinedBy.includes(runnerId)){
      transactions.update(txId, {$pull: {declinedBy: runnerId}});
    }
    transactions.update(tx._id, { $set: {
      status: 'in_progress', runnerAssignedAt: new Date(), runnerId, adminAssign, runnerObj
    }}, (err, num) => {
      DDPenv().call('sendRunnerPing', tx._id, runnerId, initialPing=false, (err, res) => {
        if(err) { throwError(err.message); }
      });
    });
  }
};

function _chargePremium(bizId, today, destinationCoords, vendorZonePolygon){
  return !turf.inside( turf.point(destinationCoords), turf.polygon(vendorZonePolygon) );
}
