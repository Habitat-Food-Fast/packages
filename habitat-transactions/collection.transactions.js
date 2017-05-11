import randomColor from 'random-color';
tx = txId => transactions.findOne(txId);
Deliveries = new Meteor.Collection("deliveries");
longCall = Meteor.settings.devMode ? 40000 : 120000;
shortCall = Meteor.settings.devMode ? 40000 : 90000;
finalDelay = Meteor.settings.devMode ? 40000 : 90000;

class transactionsCollection extends Mongo.Collection {
  insert(doc) {
    const bizProf = businessProfiles.findOne(doc.sellerId);
    const usr = Meteor.users.findOne(doc.buyerId) || false;
    const transaction = _.extend(this.resetItems(), {
      status: 'created',
      DaaS: doc.DaaS ? true : false,
      thirdParty: doc.thirdParty || false,
      acceptUrl: doc.acceptUrl,
      payRef: {},
      closed: doc.DaaS ? false : null,
      DaaSType: doc.DaaSType ? doc.DaaSType : null,
      vendorPayRef: {},
      runnerPayRef: {},
      order: !doc.order.length ? [] : this.formatOrder(doc.order, doc.thirdParty),
      plainOrder: !doc.order.length ? [] : this.formatOrder(doc.order, doc.thirdParty),
      orderNumber: doc.orderNumber || this.pin(),
      orderSize: doc.orderSize || 1,
      nonUser: (!Meteor.userId() ? true: false ),
      habitat: doc.habitat,
      method: doc.methodType || doc.method,
      deliveryAddress: doc.deliveryAddress || '',
      geometry: doc.loc, //where the order is getting delivered to
      company_address: bizProf.company_address,
      company_geometry: bizProf.geometry,
      buyerId: !doc.DaaS ? doc.buyerId : doc.sellerId,
      customer: this.customerItems(usr, doc),
      sellerId: doc.DaaS ? doc.sellerId : bizProf._id,
      company_name: doc.DaaS ? doc.company_name : bizProf.company_name,
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
      color: randomColor(0.3, 0.99).hexString(),
    });
    return super.insert(transaction, (err, txId) => {
      if(err) { throwError(err.message); } else {
        if(Meteor.user()){ Meteor.users.update(Meteor.userId(), { $push:{ "profile.transactions": txId } }); }
        calc.recalculateOpenTxs(txId, transactions.findOne(txId));
        return txId;
      }
    });
  }
  forceInsertSingle(doc){ if(!transactions.findOne(doc._id)){ return super.insert(doc); } }
  forceInsert(txs) { return transactions.batchInsert(txs, (err) => { if(err) { throwError(err.message); } else { } }); }
  forceRemove() { return super.remove({}); }
  formatOrder(order, thirdParty){
    console.log(`is third party ${thirdParty}`);
    if(!thirdParty){
      return order.length === 0 ? order : order.map(order =>
         _.extend(order, {
          orderId: this.pin(),
          itemPrice: saleItems.findOne(order.saleItemId) ? saleItems.findOne(order.saleItemId).price : 0,
          itemName: saleItems.findOne(order.saleItemId).name,
          itemCategory: saleItems.findOne(order.saleItemId).category || undefined,
          modifiers: order.modifiers,
          modifiersText: order.modifiers === [] ? [] : this.formatMods(order.modifiers)
        })
      );
    } else {
      return order.length === 0 ? order : order.map(order =>
         _.extend(order, {
          orderId: this.pin(),
          itemPrice: order.itemPrice,
          itemName: order.itemName,
          modifiers: order.modifiers
        })
      );
    }
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
    };
    return modArray;
  }
  remove(id, callback){ return super.remove(id, callback); }
  //todo: clean up params
  deliveryEstimate(txId, inMinutes, prep, sellerId, habitat, daas){
    let tx = transactions.findOne(txId);
    if(!tx) {
      tx = Deliveries.findOne(txId);
    }
    const bp = businessProfiles.findOne(tx.sellerId || sellerId);
    const prepTime = daas ? daas :
      tx.DaaS ? tx.prepTime || prep : bp.prep_time; //TODO: add prepTime to txs on request so we don't need ternary
    const delTime = Habitats.findOne(tx.habitat || habitat).deliveryTime;

    return inMinutes ?
      prepTime + delTime :
      tx.timeRequested ? tx.timeRequested : Date.now() + (60000 * prepTime) + (60000 * delTime);
  }
  getStatus(txId) {
    tx = transactions.findOne(txId);
  }
  requestItems(txId, prepTime) {
    const isDaaS = transactions.findOne(txId) ? transactions.findOne(txId).DaaS : true;
    const timeReq = Date.now();
    return {
      week: weeks.find().count(),
      status: !isDaaS ? 'pending_vendor' :
        transactions.findOne(txId).thirdParty ? 'pending_vendor' : 'pending_runner',
      timeRequested: Date.now(),
      humanTimeRequested: Date(),
      vendorPayRef: businessProfiles.rates(txId),
      vendorOrderNumber: goodcomOrders.find().count() + 1,
      cronCancelTime: isDaaS ? false : timeReq + longCall + shortCall + shortCall + finalDelay,
      deliveredAtEst: this.deliveryEstimate(txId, inMinutes=false, prepTime),
      cancelledByAdmin: false,
      cancelledByVendor: false,
      missedByVendor: false,
      cancelledTime: false,
    };
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
      deliveredAtEst: false, //reset here - want to store time from vendor accept.
    };
  }
  customerItems(usr, doc) {
    if(usr) {
      return { id: usr ? usr._id : '', phone: usr ? usr.profile.phone : '', name: usr ? usr.profile.fn : '', };
    } else if (doc.thirdParty) {
      return { id: '', phone: doc.customerPhone, name: doc.customerName, };
    }
  }
  request(id, fields, callback){
    const trans = transactions.findOne(id);

    if (trans && trans.payRef &&trans.payRef.mealInfo) { Meteor.users.update(trans.buyerId, {$set: {'profile.mealCount': trans.payRef.mealInfo.new}}); }

    //CAN'T USE SUPER HERE, WANT TO USE OVERRIDDEN METHOD TO TRACK LAST UPDATE
    return this.update(id, {$set: _.extend(fields, this.requestItems(id), {
      txType: trans.promoId ?
        Instances.findOne(trans.promoId) ?
          Instances.findOne(trans.promoId).acquisition ? 'acquisition' : 'retention'
          : ''
        : '',
    })}, callback);
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
  closedAndDiscarded() { return ['completed', 'archived', 'discarded']; }
  pin() { return Math.floor(1000 + Math.random() * 9000); }
}

transactions = new transactionsCollection("transactions");
