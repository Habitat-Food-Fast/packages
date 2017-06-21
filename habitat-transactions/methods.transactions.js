transactions.methods = {
  insert: new ValidatedMethod({
    name: 'transactions.methods.insert',
    validate: new SimpleSchema({
      'order': { type: [Object]},
      'order.$.fromFeatured': { type: Boolean, optional: true, },
      'order.$.saleItemId': { type: String },
      'order.$.itemInstructions': { type: String, optional: true },
      'order.$.modifiers': { type: [String], optional: true },
      'sellerId': { type: String },
      'buyerId': { type: String },
      'habitat': { type: String },
      'isFlash': { type: Boolean , optional: true},
      'DaaS': { type: Boolean }
    }).validator(),
    run() {
      if(arguments[0].DaaS && Meteor.user() && !Meteor.user().roles.includes('vendor')) {
        throwError('Must be vendor to insert DaaS');
      } else {
        return transactions.insert(arguments[0]);
      }
    }
  }),
  handleOrder: new ValidatedMethod({
    name: 'transactions.methods.handleOrder',
    validate: new SimpleSchema({
      'order': { type: [Object]},
      'order.$.fromFeatured': { type: Boolean, optional: true, },
      'order.$.saleItemId': { type: String },
      'order.$.itemInstructions': { type: String, optional: true },
      'order.$.modifiers': { type: [String], optional: true },
      'sellerId': { type: String },
      'buyerId': { type: String },
      'habitat': { type: String },
      'DaaS': { type: Boolean, optional: true},
    }).validator(),
    run() {
      const args = arguments[0];
      const currentOpenTx = Meteor.users.getOpenTx(args.buyerId);
      if(!currentOpenTx){
        newTxId = '';
        transactions.methods.insert.call(args, (err, id) => {
          if(err) { throwError(err.message); } else {
            newTxId = id;
            if(this.isSimulation){
              modOverlay.animate.close();
              orderFooter.showCheckout();
            }
          }
        });
        return newTxId;
      } else if(currentOpenTx){
        if(args.sellerId === currentOpenTx.sellerId){
          transactions.update(currentOpenTx._id, { $set: {
            order: currentOpenTx.order.concat(transactions.formatOrder(args.order))
            }}, (err) => { if(err){ throwError(err.message); } else {
              if(this.isSimulation){
                modOverlay.animate.close();
                orderFooter.showCheckout();
              }
              return currentOpenTx._id;
            }
          });
        } else {
          if(this.isSimulation){
            return sweetAlert(sweetAlert.copy.removeExisting(currentOpenTx._id, args.sellerId), (isConfirm) => {
              return isConfirm ? transactions.methods.removeTransaction.call({ txId: currentOpenTx._id }, (err) => {
                if (err) { throw new Meteor.Error(err.message); } else {
                  if(this.isSimulation){
                    modOverlay.animate.close();
                    return transactions.methods.insert.call(args, (err) => {
                      if(err) { sweetAlert('Error', err.message); }
                    });
                  }
                }
              }) : false;
            });
          }
        }
      }
    }
  }),

  removeTransaction: new ValidatedMethod({
    name: 'transactions.methods.removeTransaction',
    validate: new SimpleSchema({
      txId: { type: String }
    }).validator(),
    run({ txId }) {
      if (transactions.findOne(txId).buyerId === Meteor.userId()) {
        transactions.update({_id: txId}, {$set: {
          status: 'discarded',
          promoId: null,
        }}, (err, res) => { if(err) { throwError(err.message); } else {
        }});
      }
    }
  }),

  clearOpen: new ValidatedMethod({
    name: 'transactions.methods.clearOpen',
    validate: new SimpleSchema({
      txId: { type: String }
    }).validator(),
    run({ txId }) {
      const userTrans = Meteor.user().profile.transactions;
      if (_.contains(userTrans, txId) || Roles.userIsInRole(Meteor.userId(), ['admin'])) {
        transactions.update(txId, {$set: {status: 'discarded'}});
      } else {
        throw new Meteor.Error('Unauthorized client');
      }
    }
  }),

  acceptPickup: new ValidatedMethod({
    name: 'transactions.methods.acceptPickup',
    validate: new SimpleSchema({
      txId: { type: String },
    }).validator(),
    run({ txId }) {
      const tx = transactions.findOne(txId);
      DDPenv().call('sendPickupAcceptedUserText', Meteor.users.findOne(tx.buyerId).profile.phone, tx._id);
      transactions.update(txId, {$set: {status: 'in_progress'}});
    }
  }),

  acceptDelivery: new ValidatedMethod({
  name: 'transactions.methods.acceptDelivery',
  validate: new SimpleSchema({
    txId: { type: String },
  }).validator(),
  run({ txId }) {
    const tx = transactions.findOne(txId);
    transactions.update(txId, {$set: {status: 'pending_runner'}}, (err) => {
    if(err) { throwError(err.message); } else if(!this.isSimulation){
      if (!tx.DaaS) {
        DDPenv().call('orderAcceptedBuyerText', tx._id, (err) => {
          if(err) { throwError(err.message); }
        });
      }
      DDPenv().call('sendRunnerPing', tx._id, runnerId=false, initialPing=true, (err) => {
        if(err) { console.warn(err.message); }
      });
      }
    });
  }
}),

confirmDropoff: new ValidatedMethod({
  name: 'transactions.methods.confirmDropoff',
  validate: new SimpleSchema({
    txId: { type: String },
    isAdmin: { type: Boolean },
    tip: { type: Number, decimal: true, optional: true}
  }).validator(),
  run({ txId, isAdmin, tip }) {
    tx = transactions.findOne(txId);
    const now = Date.now();
    update = {
      status: 'completed',
      dropoffTime: now,
      dropoffVariationMin: calc._roundToTwo(
        (now - transactions.findOne(txId).deliveredAtEst) / 60000
      ),
      settledByAdmin: isAdmin,
      cashTip: tx.DaaS && tx.DaaSType === 'cash'

    };

    transactions.update(txId, {$set: update}, (err) => {if (err) { throw new Meteor.Error(err.message); } else {
      if(!tx.payRef.tip){
        transactions.update(txId, { $set: {
          'payRef.tip': tx.DaaS && tx.DaaSType === 'cash' ? 0 : tip,
        }});
      }
      businessProfiles.update(tx.sellerId, {$inc: { transactionCount: 1}}, (err) => {
        if(err) { console.warn(err.message); }
      });
    }});

  }
}),

sendReceiptImage: new ValidatedMethod({
  name: 'transactions.methods.sendReceiptImage',
  validate: new SimpleSchema({
    txId: { type: String, },
    tip: { type: Number, decimal: true, },
    image: { type: String, },
    runnerId: { type: String, },
  }).validator(),
  run({ txId, image, runnerId, tip}) {
    if(Meteor.isServer) {
      const tx = transactions.findOne(txId);
      runner.sendReceipt(req=false, tx, tx.orderNumber, image, tx.runnerId, tip, textResponse=false);
    }
  }
}),

  clearPast: new ValidatedMethod({
    name: 'transactions.methods.clearPast',
    validate: null,
    run() {
      transactions.update({ buyerId: Meteor.userId(), status: 'completed' }, {$set: {status: 'archived'}}, {multi: true});
    }
  }),

  assignRunner: new ValidatedMethod({
    name: 'transactions.methods.assignRunner',
    validate: new SimpleSchema({
      txId: { type: String, optional: true },
      orderNumber: { type: Number, optional: true },
      runnerId: {type: String },
      adminAssign: { type: Boolean }
    }).validator(),
    run({ txId, orderNumber, runnerId, adminAssign }) {
      const tx = transactions.findOne(txId ?
        {_id: txId, status: {$in: ['pending_runner', 'queued']}} :
        {orderNumber: orderNumber, status: 'pending_runner'}
      );

      if(runnerId && tx.runnerId){ throwError('409', 'Already Accepted!'); }
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
  }),

  reassignRunner: new ValidatedMethod({
    name: 'transactions.methods.reassignRunner',
    validate: new SimpleSchema({
      txId: { type: String },
      runId: {type: String }
    }).validator(),
    run({ txId, runId }) {
      const tx = transactions.findOne(txId);
      const previousRunnerPhone = Meteor.users.findOne(tx.runnerId).profile.phone;

      if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
        if(tx && tx.declinedBy && tx.declinedBy.includes(runId)){
          transactions.update(txId, {$pull: {declinedBy: runId}});
        }
        transactions.update(txId, {$set: {
          runnerId: runId,
          reassignCount: tx.reassignCount && tx.reassignCount.length ? tx.reassignCount.length : 1,
          runnerObj: transactions.grabRunnerObj(runId)
        }}, (err) => {
          if(err) { throwError(err.message); } else {
            if(!this.isSimulation) {
              twilio.messages.create({
                to: previousRunnerPhone, // Any number Twilio can deliver to
                from: Meteor.settings.twilio.twilioPhone, // A number you bought from Twilio and can use for outbound communication
                body: `${tx.orderNumber} reassigned`,
              }, (err, responseData) => { } );
              DDPenv().call('sendRunnerPing', txId, runId, false);
            }
          }
        });
      } else {
        throwError('Unauthorized client');
      }
    }
  }),

  remove: new ValidatedMethod({
    name: 'transactions.methods.remove',
    validate: new SimpleSchema({
      txId: { type: String },
      newBuyerId: { type: String, optional: true }
    }).validator(),
    run({ txId, newBuyerId}) {
      var tx = transactions.findOne(txId);
      if(!_.contains([this.userId, newBuyerId], tx.buyerId) || tx.status !== 'created') { throw new Meteor.Error('503, Unauthorized'); }
      return transactions.remove(txId);
    }
  }),

  choosePickDel: new ValidatedMethod({
    name: 'transactions.methods.choosePickDel',
    validate: new SimpleSchema({
      txId: { type: String },
      newBuyerId: { type: String, optional: true },
      method: { type: String, trim: true, allowedValues: ['Pickup', 'Delivery'] },
      address: { type: String, optional: true },
      geometry: { type: Object, blackbox: true, optional: true}
    }).validator(),
    run({ txId, method, newBuyerId, address, geometry }) {
      var tx = transactions.findOne(txId);
      var userId = this.userId || newBuyerId;
      if(tx.buyerId !== userId || tx.status !== 'created') { throw new Meteor.Error('503, Unauthorized'); }
      return transactions.update(tx._id, { $set: {
        method: method,
        cancelledByVendor: false,
        missedByVendor: false,
        deliveryAddress: address,
        geometry: geometry,
        promoId: method === 'Pickup' ? null : tx.promoId
      }}, (err) => {
        if(this.isSimulation){
          if(!err){
            Router.go("/hub" + "/" + tx._id + "/" + "confirmOrder");
            analytics.track(`Chose ${method}`, { transaction: txId });
          }
        } else if(err){
          throwError(err.message);
        }
      });
    }
  }),

  searchForAddress: new ValidatedMethod({
    name: 'transactions.methods.searchForAddress',
    validate: new SimpleSchema({
      address: { type: String },
    }).validator(),
    run({ address }) {
      if(!this.isSimulation){
        this.unblock();
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json`;
        const params = {
          params: {
            country: 'us',
            types: 'country,region,postcode,place,locality,neighborhood,address,poi',
            proximity: [ -75.1597308, 39.9802519 ],
            bbox: [-75.27935,39.888665,-75.084343,40.047854],
            access_token: Meteor.settings.public.mapboxKey
          }
        };
        try {
          const result = HTTP.get(url, params);
          if(result.statusCode === 200){
            res = JSON.parse(result.content);
            return res;
          }
        } catch (e) {
          JSON.stringify(e, null, 2);
          throw new Meteor.Error(e.code);
        }
      }
    }
  }),

  getAddrFromCoords: new ValidatedMethod({
    name: 'transactions.methods.getAddrFromCoords',
    validate: new SimpleSchema({
      lng: { type: Number, decimal: true },
      lat: { type: Number, decimal: true }
    }).validator(),
    run({lng, lat}) {
      if(!this.isSimulation){
        this.unblock();
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;
        const params = {
          params: {
            types: 'country,region,postcode,place,locality,neighborhood,address,poi',
            access_token: Meteor.settings.public.mapboxKey
          }
        };

        try {
          const result = HTTP.get(url, params);
          if(result.statusCode === 200){
            parsedRes = JSON.parse(result.content);
            if(parsedRes.features && parsedRes.features[0]) {
              addr = parsedRes.features[0];
              return `${addr.address} ${addr.text}`;
            }
          }
        } catch (e) {
          JSON.stringify(e, null, 2);
          throw new Meteor.Error(e.code);
        }
      }
    }
  }),

  reverseAddrSearch: new ValidatedMethod({
    name: 'transactions.methods.reverseAddrSearch',
    validate: new SimpleSchema({
      lng: { type: Number, decimal: true },
      lat: { type: Number, decimal: true }
    }).validator(),
    run({lng, lat}) {
      if(!this.isSimulation){

      }
    }
  }),

  addTxAddress: new ValidatedMethod({
    name: 'transactions.methods.addTxAddress',
    validate: new SimpleSchema({
      _id: { type: String },
      habId: { type: String },
      deliveryAddress: { type: String },
      geometry: { type: Object, blackbox: true }
    }).validator(),
    run({ _id, habId, geometry }) {
      if(this.isSimulation) { return analytics.track('Added address and info', arguments[0]);} else {
        const tx = transactions.findOne(_id); check(tx._id, String);
        const newUserId = this.userId ? false : tx.buyerId;
        const usr = Meteor.users.findOne(tx.buyerId);
        if(!newUserId) { check(usr, Object); }
        const biz = businessProfiles.findOne(tx.sellerId); check(biz._id, String);
          // TODO: delivery and tip reflect in final page?
        transactions.update(tx._id, {$set:
          _.extend(_.omit(arguments[0], '_id'), {
          method: 'Delivery'
        }) }, (e) => { if (e) { throwError( e.message ); }
        });
        return { _id: tx._id };
      }
    }
  }),

  addRunnerInstructions: new ValidatedMethod({
    name: 'transactions.methods.addRunnerInstructions',
    validate: new SimpleSchema({
      txId: { type: String },
      inst: { type: String },
    }).validator(),
    run({txId, inst}) {
      const tx = transactions.findOne(txId);
      if(!this.userId) { throwError('Must be logged in to add instructions'); }
      if(this.userId !== tx.buyerId) { throwError('Buyer ID does not match userId'); }
      if(tx.status !== 'created') { throwError('Transaction already in progress'); }

      transactions.update(txId, {$set: {deliveryInstructions: inst}}, (err) => {
        if(err) { throwError(err.message); }
      });
    }
  }),

  setTip: new ValidatedMethod({
    name: 'transactions.methods.setTip',
    validate: new SimpleSchema({
      txId: { type: String },
      tip: { type: Number, decimal: true, min: 0, max: 50 }
    }).validator(),
    run({ txId, tip }) {
      const tx = transactions.findOne(txId); check(tx, Object);
      const usr = Meteor.user();
      if((tx.buyerId === usr._id && tx.status === 'created') || Meteor.user().roles.includes('admin')) {
        return transactions.update(tx._id, { $set: { 'payRef.tip': calc._roundToTwo(tip) } }, (err) => {
          if(err) { throw new Meteor.Error(err.message); } else {
            Meteor.call('recalcPayRef', tx._id);
            return tx._id;
          }
        });
    } else {
      throw new Meteor.Error(503, 'methods.setTip.statusOrUserIdWrong');
    }
    }
  }),

  addPromo: new ValidatedMethod({
    name: 'transactions.methods.addPromo',
    validate: new SimpleSchema({
      promoId: { type: String },
      txId: { type: String }
    }).validator(),
    run({ promoId, txId }) {
      return Instances.addToTx(promoId, txId);
    }
  }),

  rate: new ValidatedMethod({
    name: 'transactions.methods.rate',
    validate: new SimpleSchema({
      txId: { type: String },
      deliveryRating: { type: Number, optional: true, min: 1, max: 5  },
      vendorRating: { type: Number, optional: false, min: 1, max: 5  },
      rateMessage: { type: String, optional: true },
      canSubmit: { type: Boolean, optional: false, allowedValues: [true] } //TODO: why passing canSubmit up here?
    }).validator(),
    run({ txId, deliveryRating, vendorRating, rateMessage, canSubmit }) {
      if(!this.isSimulation){
        if(vendorRating <= 3 || deliveryRating <= 3){
          sendLowRatingAlert(arguments[0]); //passing 4/5 params, might as well send all args
        }
      }
      const txCursor = transactions.find(txId, {limit: 1});
      const txSet = {
        $set: {
          rating: (deliveryRating ? deliveryRating : false),
          rating_vendor: vendorRating,
          message: rateMessage
        }
      };

      //we'll append the newly calculated averages to initial query, return at end
      let returnObj = txSet;

      const txUpdate = transactions.update({_id: txId}, txSet, (err) => {
        if(err) { throw new Meteor.Error(err.message); } else {
          const vendorRatings = transactions.find({
            sellerId: txCursor.fetch()[0].sellerId,
            rating_vendor: { $gte: 1 }
          }, {fields: {rating_vendor: 1}});

          var newVendorAverage;
          if(!vendorRatings.count()){
            newVendorAverage = vendorRating;
          } else {
            newVendorAverage = getRatingSum(vendorRatings.fetch(), 'rating_vendor') / vendorRatings.count();  //average rating
          }
          check(newVendorAverage, Number);
          const vendorUpdate = businessProfiles.update(txCursor.fetch()[0].sellerId, {
            $set: { rating_vendor: newVendorAverage }
          }, (err) => {
            if(err) { throw new Meteor.Error(err.reason); } else {
              returnObj.newVendorAverage = newVendorAverage;
            }
          });
          //if delivery, sum runner new averate and update
          if(deliveryRating && txCursor.fetch()[0].method === 'Delivery') {
            const runnerRatings = transactions.find({
              runnerId: txCursor.fetch()[0].runnerId,
              rating: { $gte: 1 }
            }, {fields: { rating: 1 } });

            //if first tx, average is the value of first delivery rating
            var newRunnerAverage;
            if(!runnerRatings.count()){
              newRunnerAverage = deliveryRating;
            } else {
              newRunnerAverage = parseFloat( getRatingSum(runnerRatings.fetch(), 'rating') / runnerRatings.count() );
            }
            const runnerUpdate = Meteor.users.update({
              _id: txCursor.fetch()[0].runnerId}, {
              $set: { 'profile.avgRating': newRunnerAverage },
            }, (err) => {
              if(err) { throw new Meteor.Error(err.reason); } else {
                returnObj.newRunnerAverage = newRunnerAverage;
              }
            });
          }

        }
      });

      return returnObj;
    }
  }),

  emergencyRunnerPing: new ValidatedMethod({
    name: 'transactions.methods.emergencyRunnerPing',
    validate: new SimpleSchema({
      txId: { type: String },
      amount: { type: Number, decimal: true, }
    }).validator(),
    run({ txId, amount }) {
      tx = transactions.findOne(txId);
      hab = Habitats.findOne(tx.habitat);
      transactions.update(txId, {$set: {
        'runnerPayRef': {
          onDemand: true,
          onDemandRate: amount,
        }
      }}, (err) => { if (err) throwError(err.message); });
      if(!this.isSimulation){return sendEmergencyPing(tx, hab._id, amount);}
    }
  })
};

sendEmergencyPing = (tx, habId, amount) => {
  const hab = Habitats.findOne(habId);
  tip =tx.payRef.tip ? '+ ' + accounting.formatMoney(tx.payRef.tip) + ' tip' : '';
  msg = `Payout: ${accounting.formatMoney(amount)}
New on-demand order #${tx.orderNumber} in ${hab.name} for ${tx.company_name}. Respond with the order number to accept`;
  const numbers = Meteor.users
    .find({roles: {$in: ['runner']}, 'profile.runHabitats': {$in: [habId]}})
    .map(u => u.profile.phone);
    numbers.forEach((phoneNumber) => {
      twilio.messages.create({
        to: '+1' + phoneNumber,
        from: Meteor.settings.twilio.twilioPhone,
        body: msg,
      }, (err, res) => {});
    });

};

Meteor.methods({
  acceptOrder(id, method, role) {
      if(Meteor.isServer){
        const tx = transactions.findOne(id);
        transactions.update(id, {$set: {
          acceptedByVendor: role === 'vendor',
          acceptedByAdmin: role === 'admin',
          acceptedAt: new Date(),
          acceptedBy: this.userId,
        }}, (err, res) => {
          if(err){ throwError(err.message); }
          if (!tx.DaaS) {
            DDPenv().call('sendUserReceiptEmail', id, (err, res));
          }
          if(tx.promoId) { Instances.redeem(tx.promoId, tx.buyerId, true); }
          if(!tx.DaaS && tx.payRef.platformRevenue > 0){
            DDPenv().call("submitForSettlement", tx.braintreeId, tx.payRef.platformRevenue, (err, res) => {
              if(err) { throw new Meteor.Error(err.message); }
            });
          }

        });
      }
      return method === "Pickup" ? transactions.methods.acceptPickup.call({txId: id}) :
        transactions.methods.acceptDelivery.call({txId: id});
    },
    updatePrepTime(tx, time) {
      const tran = transactions.findOne(tx);
      const biz = businessProfiles.findOne(tran.sellerId);
      const usr = Meteor.users.findOne(this.userId);
      if (biz._id === usr.profile.businesses[0] || Meteor.user().roles.includes('admin')) {
        transactions.update(tx, {$set: {prepTime: time, readyAt: new Date(Date.now() + (time * 60000))}});
      }
    },
    confirmPickupTime(tx) {
      const item = transactions.findOne(tx);
      if (item.runnerId === Meteor.userId()) {
        transactions.update(tx, {$set: {pickedUpAt: Date.now()}});
      }
    },
    editDaaSInfo(id, state) {
      console.log(state);
      const obj = {
        'customer.name': state.name,
        'customer.phone': state.phone,
        deliveryAddress: state.address,
        deliveryInstructions: state.deliveryInstructions
      };
      if (transactions.findOne(id).sellerId === Meteor.users.findOne(this.userId).profile.businesses[0]) {
        return transactions.update(id, {$set: obj});
      }
    },
    setTransactionClosed(id) {
      if (this.userId) {
        if (transactions.findOne(id).sellerId === Meteor.users.findOne(this.userId).profile.businesses[0]) {
          transactions.update(id, {$set: {closed: true}});
        } else {
          return new Meteor.Error('Unauthorized');
        }
      }
    },
    getRouteInfo(origin,destination,wayPoints,apiKey){
      if(Meteor.isServer){
        url = `https://maps.googleapis.com/maps/api/directions/json?${origin}&${destination}${wayPoints}&key=${apiKey}`;
        console.log(url);
        try {
          res = HTTP.get(url);
          console.log(res.data);
          if(!res.data.routes.length){
              console.warn(`no routes found for ${txId}`);
          } else {
            dirs = res.data.routes[0];
            if(!dirs.legs.length){
              console.warn(`no legs found for ${txId}`);
            } else {
              journey = dirs.legs[0];
              query = {routeInfo: {
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
              }};
              return query;
            }
          }
        } catch (err) {
          console.warn(err);
        }
      }
    },

    alertRunnerReady(txId) {
      const tx = transactions.findOne(txId);
      if (tx.sellerId === Meteor.users.findOne(this.userId).profile.businesses[0]) {
        const runnerPhone = Meteor.users.findOne(tx.runnerId).profile.phone;
        if (!runnerPhone) { return 'no runner'; }
        const msg = `Order #${tx.orderNumber} from ${tx.company_name} is ready for pickup`;
        transactions.update(txId, {$set: {readyTextSent: true}});
        twilio.messages.create({
          to: runnerPhone, // Any number Twilio can deliver to
          from: Meteor.settings.twilio.twilioPhone, // A number you bought from Twilio and can use for outbound communication
          body: msg,
        }, (err, responseData) => {
            if (!err) {
              console.log(responseData.body);
            } else {
              //invalid number
              if(err.code === 21211) {
                const parsedWrongNum = err.message.match(/[0-9]+/)[0];
                console.log(`Message 'sent to invalid number - ${parsedWrongNum}'`);
              } else {
                console.log(err);
              }
            }
          }
        );
      }
    },
    sendStatusUpdateText(phone, firstName, msg, isAdmin){
      if(isAdmin){
        const result = HTTP.post(
          `https://slack.com/api/chat.postMessage?token=${Meteor.settings.slackToken}&channel=${
            Meteor.settings.devMode ? "dev-operations" : "orderup"
          }&text=${msg}&pretty=1`);
      }
      else{
        twilio.messages.create({
          to:'+1' + phone , // Any number Twilio can deliver to
          from: Meteor.settings.twilio.twilioPhone, // A number you bought from Twilio and can use for outbound communication
          body: msg // body of the SMS message
        }, (err, responseData) => {
            if (!err) { }
          }
        );
      }
    },

    sendPickupAcceptedUserText(phoneNumber, txId) {
      //  RANK 3 TODO - check the args
      const tx = transactions.findOne(txId);
      const biz = businessProfiles.findOne(tx.sellerId);

      twilio.messages.create({
        to: phoneNumber, // Any number Twilio can deliver to
        from: Meteor.settings.twilio.twilioPhone, // A number you bought from Twilio and can use for outbound communication
        body: `Thanks for ordering Habitat!
    Your order from ${tx.company_name} will be ready in about ${biz.prep_time} minutes.
    Order #: ${tx.orderNumber}
    Location: ${biz.company_address}
    Just let them know you ordered on Habitat & your order number when you arrive!`.trim()
        }, (err, responseData) => { console.log(responseData); });
    },

    orderAcceptedBuyerText (txId) {
      //  RANK 3 TODO - check the args
      console.log(`inside orderAcceptedbyuyer text`);

      const tx = transactions.findOne(txId);
      const estimate = transactions.deliveryEstimate(tx._id, inMinutes=true);
      const body = `${tx.company_name} has accepted your order! It should arrive in ${estimate} to ${estimate + 10} minutes.`;
      console.log(`body ${body}`);

      twilio.messages.create({
        to: Meteor.users.findOne(tx.buyerId).profile.phone, // Any number Twilio can deliver to
        from: Meteor.settings.twilio.twilioPhone, // A number you bought from Twilio and can use for outbound communication
        body: body
      }, (err, responseData) => {
          var textObj = responseData;
          if (!err) {
            // console.log(responseData);
            // console.log(responseData.body);
          } else {
            console.log("twilio error.orderAcceptedBuyerText" + err);
            console.log("twilio error" + err.message);
          }
      });
    },

    orderDeclinedBuyerText(buyerId, sellerId) {
      Meteor.users.update(buyerId, {$inc: {'profile.mealCount': calc.cancelCredits}}, (err) => {
        if(err) { throw new Meteor.Error(err.message); } else {
          var bizProf = businessProfiles.findOne(sellerId);
          var userProf = Meteor.users.findOne(buyerId);
          var customerMessage = `Hey ${userProf.profile.fn}, ${bizProf.company_name} was unable to accept your order. Don't worry, we've refunded your order and given you $1 in credit for you next order :)`;
          const sendMessageSync = Meteor.wrapAsync(twilio.messages.create, twilio.messages);
          const result = sendMessageSync({
            to: Meteor.users.findOne(buyerId).profile.phone, // Any number Twilio can deliver to
            from: Meteor.settings.twilio.twilioPhone, // A number you bought from Twilio and can use for outbound communication
            body: customerMessage
          });
        }
      });
    },

    orderDeclinedVendorText(txId, from, missed) {
      const tx = transactions.findOne(txId);
      var res;
      transactions.update(txId, {$set: {
        cancelledByVendor:
          (from === 'vendor' && !missed) ||
          (from === 'email') ||
          (from === 'call'),
        missedByVendor: missed,
        cancelledByAdmin: (from === 'god'),
        status: 'created',
        cancelledTime: Date(),
      }}, (err, res) => {
        if(err) { JSON.stringify(err, null, 2); } else {
          const tx = transactions.findOne(txId);
          if(missed) {
            Meteor.call('sendStatusUpdateText', null, 'to admin', `Order # ${tx.orderNumber} cancelled. ${tx.company_name} missed texts and calls`, true);
          }
          const sendMessageSync = Meteor.wrapAsync(twilio.messages.create, twilio.messages);
          var result = sendMessageSync({
            to: businessProfiles.findOne(tx.sellerId).orderPhone, // Any number Twilio can deliver to
            from: Meteor.settings.twilio.twilioPhone, // A number you bought from Twilio and can use for outbound communication
            body: `Order # ${tx.orderNumber} cancelled.`
          });

          res = result;
        }
      });
      return res;
    },
    sendUserReceiptEmail(transId) {
      var transToSend = transactions.findOne(transId);
      var buyer = Meteor.users.findOne(transToSend.buyerId);
      Mailer.send({
        to: buyer.profile.fn + ' <'+buyer.username+'>',
        subject: 'Your habitat order #' + transToSend.orderNumber,
        template: 'emailUserReceipt',
        data: {
          transaction: transToSend
        }
      });
    },
});

getBizNumberArray = (bizId) => {
  const bp = businessProfiles.findOne(bizId);
  if(bp.employees){
    return bp.employees.filter(e => e.text).map(e => e.phone).concat(bp.orderPhone);
  } else {
    return [bp.orderPhone];
  }
};

Meteor.methods({
  getMasterWeek(weekId, weekNum, token) {
    if(Meteor.isServer && Meteor.user() && Meteor.user().roles.includes('admin')){
      try {
        const url = `${Meteor.absoluteUrl()}mastertransactions/${weekId}/${weekNum}/${token}`;
        console.log(url);
        return HTTP.get(url);
      } catch (err) {
        console.warn(err.message, err.stack);
      }
    }
  },
  sendReceiptText(txObj){
    var res;
    getBizNumberArray(txObj.sellerId).forEach((n) => {
      twilio.messages.create({
        to: n, // Any number Twilio can deliver to
        from: Meteor.settings.twilio.twilioPhone, // A number you bought from Twilio and can use for outbound communication
        body: transactions.findOne(txObj._id ).textMessage +  "Respond 1 to accept, 0 to decline",
      }, (err, responseData) => {
          res = responseData;
          if (!err) {
            console.log(responseData.body);
          } else {
            console.log("twilio error" + err.message);
          }
        }
      );
    });
    return res;
  },

  declineTransaction(tx, from, missed){
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
  nullifyTransaction(id){
    //  RANK 2 TODO - check the args
    var myTx = transactions.findOne(id);
    const mInfo = myTx.payRef.mealInfo;
    if (mInfo && mInfo.used > 0) {
      Meteor.users.update(myTx.buyerId, {$inc: {'profile.mealCount': mInfo.used}});
    }
    return transactions.update(id,
      {
        $unset: {
          latestVendorCall: '',
        },
        $set: {
          status: 'created',
          braintreeId: null,
          vendorCallCount: 0
        }
      }
    );
  },
});

getRatingSum = function(collection, key){
  return _.reduce(_.pluck(collection, key), (memo, num) => {
      return parseFloat(memo) + num;
  });
};

handleInitialVendorContact = (txId) => {
	const transactionToSend = transactions.findOne(txId); check(transactionToSend._id, String);
	const bizProfile = businessProfiles.findOne(transactionToSend.sellerId); check(bizProfile._id, String);
	const pendingVendorAcceptCount = transactions.find({sellerId: transactionToSend.sellerId, status: 'pending_vendor'}).count();
  const pref = bizProfile.notificationPreference; check(pref, String);

	switch (pref) {
		case 'sms':
		// if theres more than one transaction dont send
			if (pendingVendorAcceptCount === 1) {
				Meteor.call('sendReceiptText', transactionToSend);
			}
			break;
		case 'fax':
      HTTP.call(`GET`, urls.vendor.single_receipt_fax(txId), (err, res) => {
        if(err){
          Email.send({
            from: "sender@somewhere.net",
            to: "mike@tryhabitat.com",
            cc: "carboncopy@elsewhere.io",
            bcc: "lurker@somewhere.io",
            replyTo: "public@somewhere.net",
            subject: "Missed Fax",
            text: JSON.stringify(err, null, 2),
            html: "",
            headers: "",
          });
        } else {
          if(module.dynamicImport){
            import('phaxio').then((Phaxio) => {
              phaxio = new Phaxio(Meteor.settings.phaxio.pub, Meteor.settings.phaxio.priv);
              phaxio.sendFax({
                to: Meteor.settings.devMode ?
                '+18884732963' :
                `+1${businessProfiles.findOne(transactions.findOne(txId).sellerId).faxPhone.toString()}`,
                string_data: res.content,
                string_data_type: 'html'
              }, (error, data) => {
                if(error) {
                  Email.send({
                    from: "fax@tryhabitat.com",
                    to: Meteor.settings.devMode ? 'mike@tryhabitat.com' : 'info@tryhabitat.com',
                    subject: "Fax Failure",
                    text: JSON.stringify(error, null, 2),
                  });
                }
              });
            })
          }
        }
      });
			break;
		case 'email':
			Meteor.call('sendSingleVendorTxEmail', txId);
			break;
		default:
			if (pendingVendorAcceptCount === 1) {
				Meteor.call('sendReceiptText', transactionToSend);
			}
			break;
		}
    slm(`ORDER UP

    Vendor: ${bizProfile.company_name}
    Vendor Phone: ${bizProfile.orderPhone}
    Contact Type: ${bizProfile.notificationPreference}

    ${transactionToSend.textMessage}`);

};
