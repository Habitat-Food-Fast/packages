tx = txId => transactions.findOne(txId);
Deliveries = new Meteor.Collection("deliveries");
longCall = Meteor.settings.devMode ? 40000 : 120000;
shortCall = Meteor.settings.devMode ? 40000 : 90000;
finalDelay = Meteor.settings.devMode ? 40000 : 90000;

class transactionsCollection extends Mongo.Collection {
  insert(doc) {
    const bizProf = businessProfiles.findOne(doc.company_name ?
      { company_name: doc.company_name} :
      doc.sellerId
    );
    const usr = Meteor.users.findOne(doc.buyerId) || false;
    console.warn(`insert`, doc.method);
    return super.insert(_.extend(this.resetItems(), {
      status: doc.status || 'created',
      DaaS: doc.DaaS ? true : false,
      thirdParty: doc.thirdParty || false,
      partnerName: doc.partnerName,
      acceptUrl: doc.acceptUrl,
      payRef: doc.payRef || {},
      closed: false,
      DaaSType: doc.orderType || doc.DaaSType,
      vendorPayRef: {},
      runnerPayRef: {},
      prepTime: doc.prepTime || bizProf.prep_time,
      order: doc.order || (!doc.order || !doc.order.length) ? [] : this.formatOrder(doc.order, doc.thirdParty),
      plainOrder: doc.plainOrder,
      // || (!doc.order || !doc.order.length) ? [] : this.formatOrder(doc.order, doc.thirdParty),
      orderNumber: doc.orderNumber || this.pin(),
      orderSize: doc.orderSize || 1,
      habitat: doc.habitat || bizProf.habitat[0],
      method: doc.method ? doc.method : doc.isDelivery ? 'Delivery' : 'Pickup',
      deliveryAddress: doc.deliveryAddress || '',
      deliveryInstructions: doc.deliveryInstructions,
      geometry: doc.loc, //where the order is getting delivered to
      company_address: bizProf.company_address,
      company_geometry: bizProf.geometry,
      buyerId: !doc.DaaS ? doc.buyerId : doc.sellerId,
      customer: this.customerItems(usr, doc),
      sellerId: bizProf._id,
      company_name: bizProf.company_name,
      createdAt: Date.now(),
      createdAtHuman: Date(),
      timeRequested: 0,
      humanTimeRequested: 0,
      vendorCallCount: 0,
      latestVendorCall: 0,
      settledByAdmin: null,
      problem: false,
      rating: null,
      message: null,
      rating_vendor: null,
      week: weeks.find().count(),
      scheduled: doc.scheduled,
      deliverBy: doc.deliverBy,
      catering: doc.catering ? doc.catering : false
    }), (err, txId) => {
      tx = transactions.findOne(txId);
      console.warn(`after insert`, tx.method);

      if(err) { throwError(err.message); } else {
        if(tx.method === 'Delivery') {this.addRouteInfo(txId)}
        if(tx.status === 'pending_vendor' || tx.status === 'pending_runner'){
          transactions.request(txId, {});
        }
        if (tx.scheduled && tx.status === 'queued') {
          transactions.update(tx._id, {$set: {vendorPayRef: businessProfiles.rates(tx._id)}});
          Alerts.methods.warnScheduled(tx, true); }
        if(doc.buyerId){ Meteor.users.update(doc.buyerId, { $push:{ "profile.transactions": txId } }); }
        if(!doc.thirdParty && !tx.DaaS){ calc.recalculateOpenTxs(txId, transactions.findOne(txId)); }

        return txId;
      }
    });
  }
  forceInsertSingle(doc){ if(!transactions.findOne(doc._id)){ return super.insert(doc); } }
  forceInsert(txs) { return transactions.batchInsert(txs, (err) => { if(err) { throwError(err.message); } else { } }); }
  forceRemove() { return super.remove({}); }
  formatOrder(order, thirdParty){
    if(!thirdParty){
      o= order.length === 0 ? order : order.map(order =>
         _.extend(order, {
          orderId: this.pin(),
          itemPrice: saleItems.findOne(order.saleItemId) ? saleItems.findOne(order.saleItemId).price : 0,
          itemName: saleItems.findOne(order.saleItemId) ? saleItems.findOne(order.saleItemId).name : '',
          itemCategory: saleItems.findOne(order.saleItemId).category || undefined,
          modifiers: order.modifiers,
          modifiersText: order.modifiers === [] ? [] : this.formatMods(order.modifiers)
        })
      );
    } else {
      o= order.length === 0 ? order : order.map(order =>
         _.extend(order, {
          orderId: this.pin(),
          itemPrice: order.itemPrice,
          itemName: order.itemName,
          modifiers: order.modifiers
        })
      );
    }

    console.log(o); return o;
  }
  formatMods(mods) {
    let modArray = [];
    for (i = 0; i < mods.length; i++) {
      var mod = Modifiers.findOne(mods[i]);
      if (mod) {
        modArray.push({
          name: mod.name,
          category: modCategories.findOne(mod.subcategory).name,
          price: mod.price
        });
      }
    }
    return modArray;
  }
  remove(id, callback){ return super.remove(id, callback); }
  //todo: clean up params
  deliveryEstimate(txId, inMinutes, prep, sellerId, habitat, daas){
    let tx = transactions.findOne(txId);
    const bp = businessProfiles.findOne(tx.sellerId || sellerId);
    const prepTime = tx.prepTime || bp.prep_time; //TODO: add prepTime to txs on request so we don't need ternary
    habId = tx.habitat || habitat;
    console.log(habId);
    const delTime = Habitats.findOne(habId).deliveryTime;
    const estimate = inMinutes ?
      prepTime + delTime :
      tx.timeRequested ? tx.timeRequested : Date.now() + (60000 * prepTime) + (60000 * delTime);
    return estimate;
  }
  addRouteInfo(txId, count, i) {
    if(Meteor.isClient){
      console.warn("cant add route info on client");
    } else {
      tx = transactions.findOne(txId);
      HTTP.call('GET', gmapsUrl(tx), (err, result) => {
        if(err){ console.warn(err.message); } else {
          if(!result.data.routes.length){
              console.warn(`no routes found for ${txId}`);
          } else {
            dirs = result.data.routes[0];
            if(!dirs.legs.length){
              console.warn(`no legs found for ${txId}`);
            } else {
              journey = dirs.legs[0];
              transactions.update(txId, { $set: {
                routeInfo: {
                  car: {
                    distance: {
                      text: journey.distance.text,
                      meters: journey.distance.value,
                    },
                    duration: {
                      text: journey.duration.text,
                      seconds: journey.duration.value,
                    }
                  }
                }
              } }, (err) => {
                if(err) { console.warn(err.message); } else {
                  // console.log(calc._roundToTwo((i / count) * 100) + '%');
                  // console.log(`set ${tx.orderNumber} to`, transactions.findOne(txId).routeInfo.car.distance.text);
                }
              });
            }
          }
        }
      });
    }
  }
  getStatus(txId) {
    tx = transactions.findOne(txId);
  }
  requestItems(txId, prepTime, daas) {
    const isDaaS = daas || transactions.findOne(txId).DaaS;
    const timeReq = Date.now();
    req = {
      week: weeks.find().count(),
      timeRequested: Date.now(),
      humanTimeRequested: Date(),
      vendorPayRef: businessProfiles.rates(txId),
      vendorOrderNumber: isDaaS ? null : goodcomOrders.find().count() + 1,
      cronCancelTime: isDaaS ? false : timeReq + longCall + shortCall + shortCall + finalDelay,
      deliveredAtEst: this.deliveryEstimate(txId, inMinutes=false, prepTime),
      cancelledByAdmin: false,
      cancelledByVendor: false,
      missedByVendor: false,
      cancelledTime: false,
    };
    return req;
  }
  scheduledRequestItems(txId) {
    req = {
      week: weeks.find().count(),
      timeRequested: Date.now(),
      humanTimeRequested: Date(),
      vendorPayRef: businessProfiles.rates(txId),
      deliveredAtEst: transactions.findOne(txId).deliverBy,
      cancelledByAdmin: false,
      cancelledByVendor: false,
      missedByVendor: false,
      cancelledTime: false,
      status: 'pending_runner'
    };
    return req;
  }
  //reset vendor, runner, admin lifecycle. no user related stuff or payRef determining fields
  resetItems(){
    return {
      calledRunner: false,
      cancelledByVendor: false,
      acceptedByVendor: false,
      missedByVendor: false,
      acceptedByAdmin: false,
      acceptedAt: false,
      acceptedBy: false,
      cancelledByAdmin: false,
      settledByAdmin: false,
      dropoffVariationMin: 0,
      adminAssign: false,
      promoUsed: null,
      promoId: null,
      // deliveredAtEst: false,
    };
  }
  customerItems(usr, doc) {
    if(usr) {
      return { id: usr ? usr._id : '', phone: usr ? usr.profile.phone : '', name: usr ? usr.profile.fn : '', };
    } else if (doc.thirdParty || doc.DaaS) {
      return {
        id: '',
        phone: doc.customer.phone,
        name: doc.customer.name,
        email: doc.customer.email
      };
    }
  }
  request(id, fields, callback){
    console.log(`inside request`, id)
    const trans = transactions.findOne(id);

    if (trans && trans.payRef && trans.payRef.mealInfo) { Meteor.users.update(trans.buyerId, {$set: {'profile.mealCount': trans.payRef.mealInfo.new}}); }
    const prep = trans.prepTime;
    //CAN'T USE SUPER HERE, WANT TO USE OVERRIDDEN METHOD TO TRACK LAST UPDATE
    return transactions.update(id, {$set: _.extend(fields, this.requestItems(id), {
      txType: trans.promoId ?
        Instances.findOne(trans.promoId) ?
          Instances.findOne(trans.promoId).acquisition ? 'acquisition' : 'retention'
          : ''
        : '',
    })}, (err, res) => {
      if (err) {
        throwError(err);
      }
    });
  }
  timeSinceRequest(txId){
    const tx = transactions.findOne(txId);

    const diff = Math.abs(new Date(tx.dropoffTime) - new Date(tx.timeRequested));
    var minutes = Math.floor((diff/1000)/60);

    return minutes;
  }
  //definitely a more elegant way to handle whether or not it's w/ timeRequested or from now
  belowMinSubtotal(txId){
    const tx = transactions.findOne(txId);
    const today = tx ? businessProfiles.getToday(tx.sellerId) : undefined;

    return tx.method === 'Delivery' &&
      today.vendorPremium &&
      tx.payRef.tp < today.vendorRates.freeDel.minimum;
  }
  notifyVendor(id, callCount, callback){
    //CAN'T USE SUPER HERE, WANT TO USE OVERRIDDEN METHOD TO TRACK LAST UPDATE
    return this.update(id, {$set: {
      latestVendorCall: Date.now(),
      vendorCallCount: callCount + 1
    }}, callback);
  }
  notifyRunner(id, callCount, call){
    return super.update(id, {$set: call ? {
      latestRunnerCall: Date(),
      runnerCallCount: callCount + 1,
    } : {
      textedRunner: true,
      runnerTextTime: Date(),
    }});
  }
  runnerDecline(txId, runnerId, callback) {
    return super.update(txId, {$set: {
      runnerDeclined: true,
      runnerDeclinedTime: new Date(),
      declinedBy: runnerId,
    }}, callback);
  }

  creditsCoverFullOrder(id) {
    return transactions.findOne(id) && transactions.findOne(id).payRef.mealInfo && (transactions.findOne(id).payRef.platformRevenue === 0);
  }
  platRevIsZero(id) { return transactions.findOne(id).payRef.platformRevenue === 0; }
  getPromo(txId){ return Instances.findOne(tx(id).promoId); }

  getComplete(habId, range) {
    return transactions.find({
      habitat: habId,
      status: {$in: transactions.completedAndArchived()},
    }, {sort: {timeRequested: -1}}).fetch().filter((tx) => {
      return moment(tx.timeRequested).isSame(Habitats.closedAtToday(habId), range || 'day');
    });
  }
  getDeclined(habId, range) {
    return transactions.find({
      habitat: habId,
      $or: [
        {declinedByVendor: true},
        {cancelledByVendor: true},
        {cancelledByAdmin: true}
      ],
    }, {sort: {createdAt: -1}}).fetch().filter((tx) => {
      return moment(tx.timeRequested).isSame(Habitats.closedAtToday(habId), range || 'day');
    });
  }
  getIncomplete(habId, range)  {
    return transactions.find({
      habitat: habId,
      status: {$nin: transactions.completedAndArchived()},
    }, {sort: {createdAt: -1}}).fetch().filter((tx) => {
      return moment(tx.createdAt).isSame(Habitats.closedAtToday(habId), range || 'day');
    });
  }
  getAll(habId, range){
    return this.getComplete(habId, range).length + this.getIncomplete(habId, range).length;
  }
  completedAndArchived(){ return [ 'completed', 'archived' ]; }
  active(){ return [ 'pending_vendor', 'pending_runner', 'in_progress' ]; }
  userVisible() { return ['created', 'pending_vendor', 'pending_runner', 'in_progress', 'completed']; }
  userCart() { return ['created', 'pending_vendor', 'pending_runner', 'in_progress']; }
  closedAndDiscarded() { return ['completed', 'archived', 'discarded', 'cancelled']; }
  pin() { return Math.floor(1000 + Math.random() * 9000); }
  grabRunnerObj(runnerId) {
    const rnr = Meteor.users.findOne(runnerId);
    return {
      phone: rnr.profile.phone,
      pic: rnr.profile.profile_pic,
      name: rnr.profile.fn
    };
  }
}

transactions = new transactionsCollection("transactions");

const apiKey = 'AIzaSyCyFtEt80IOFCQ_mgvXDwAFKNNCewjeEWo';

deliveryAddressCoords = (txId) => {
  const coords = transactions.findOne(txId).geometry.coordinates,
        lng = coords[1],
        lat = coords[0];
  return { lng, lat };
};

import geolib from 'geolib';

gmapsUrl = (tx) => {
  const biz = businessProfiles.findOne({_id: tx.sellerId, geometry: {$exists: true}});
  const originCoords = biz.geometry.coordinates;

  // console.log(`${biz.company_address} to ${tx.deliveryAddress}`);
  const origin = `origin=${originCoords[1]},${originCoords[0]}`;
  const coords = deliveryAddressCoords(tx._id);

  const destination = `destination=${coords.lng},${coords.lat}`;

  compass = geolib.getCompassDirection( {latitude: 52.518611, longitude: 13.408056}, {latitude: 51.519475, longitude: 7.46694444} );
  transactions.update(tx._id, {$set: { compassDirection: compass }});

  const stopsAlongTheWay = false;
  const wayPoints = !stopsAlongTheWay ? '' : `&waypoints=optimize:true|${stopsAlongTheWay}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?${origin}&${destination}${wayPoints}&key=${apiKey}`;
  return url;
};
