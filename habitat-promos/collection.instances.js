import { _ } from 'underscore';
import SimpleSchema from 'simpl-schema';
const creditsForAcquisition = 0.625;

export default class instancesCollection extends Mongo.Collection {
  //easy methods for querying around deeply nested properties in Instances.types
  parentType(channelName){ return this.types.filter(obj => _.where(obj.channels, {name: channelName}).length > 0)[0]; }
  channelObj(channelName){ return _.findWhere(this.parentType(channelName).channels, {name: channelName}); }
  subChannels(channelName){ return this.channelObj(channelName).subChannels; }

  interface(name, args){
    console.log('inside interface', args);
    return {
      name: name,
      ownedBy: args.ownerId,
      dateIssued: new Date(),
      expired: false,
      owners: [],
      ownersCount: 0,
      redeemedByCount: 0,
      redeemedBy: [],
      channel: args.channel,
      subChannel: args.subChannel,
      channelType: this.parentType(args.channel).type,
      ownerRole: args.ownerRole,
      habitat: args.habitat,
      adUnits: args.adUnits,
      notes: args.notes,
    };
  }
  insertAcquisitionCode(name, args){
    inter = this.interface(name, args);
    query = _.extend(inter, {
      dollarAmount: 5, // TODO: add back a habitat.deliveryFee to customise
      acquisition: true,
      giveOwnerDiscountOnRedeem: args.giveOwnerDiscountOnRedeem,
    });
    return super.insert(query, { validate: false }, (err) => {
      if(err) { throwError(err); }});
  }
  insertRetentionCode(name, a) {
    query = _.extend(this.interface(name, a), {
      dollarAmount: a.dollarAmount,
      acquisition: false,
      giveOwnerDiscountOnRedeem: false,
    }); console.log(query);
    return super.insert(query, { validate: false }, (err) => {
      if(err) { throwError(err); }
    });
  }
  addOwner(promoName){
    if(!promoName) { throwError(`Error: Missing promoId`); }
    if(!Meteor.userId()) { throwError(`Error: Need valid userId to redeem promos.`); }
    const PROMO = promoName.toUpperCase();
    const my = Instances.findOne({name: PROMO });
    if (!my) {
      throwError(`Sorry, ${PROMO} is invalid or can't be found.`);
    } else if(_.contains(my.owners, Meteor.userId())){
      throwError(`Sorry, ${PROMO} is already added or in use.`);
    } else if (_.contains(my.redeemedBy, Meteor.userId())){
      throwError(`Sorry, you've already redeemed ${PROMO}.`);
    } else if (my.ownedBy === Meteor.userId()){
      throwError(`Nice try, but promo ${PROMO} belongs to you.`);
    } else if (my.expired) {
      throwError(`Sorry, ${PROMO} is no longer valid.`);
    } else if (this.hasRedeemedAcquisition() && my.acquisition) {
      throwError(`Sorry, referral codes like ${PROMO} can only be used once.`);
    } else {
      return super.update(my._id, {$push: {owners: Meteor.userId()}}, (err) => {
        if(err) { throwError(`Sorry, an unexpected error has occured.`); } else {
          if(Meteor.isServer){
            slm(`Successful insert of ${PROMO}`);
          }
        }
      });
    }
  }
  addToTx(promoId, txId) {
    if(this.getRedeemablePromos().map(p => p._id).includes(promoId)){
      return transactions.update(txId, {$set: {promoId: promoId}}, (err) => {
        if(err) { throwError(err.message); }
      });
    }
  }
  toggle(redeem, buyerId){
    return redeem ? {
      $pop: { owners: buyerId },
      $push: { redeemedBy: buyerId }
    } : {
      $push: { owners: buyerId },
      $pop: { redeemedBy : buyerId },
    };
  }
  redeem(promoId, buyerId, redeem) {
    const inst = Instances.findOne(promoId); check(inst, Object);
    Instances.update(promoId, _.extend(this.toggle(redeem, buyerId), {
      $inc: {
        redeemedByCount: redeem ? 1 : -1,
        ownersCount: redeem ? -1 : 1,
      }
    }), (err) => {
      if(err) { throwError(err.message); } else if(inst.acquisition && inst.giveOwnerDiscountOnRedeem){
        this.notify(inst.ownedBy, redeem);
      }
    });
  }
  notify(ownerId, redeem){
    const owner = Meteor.users.findOne(ownerId);
    Meteor.users.update(owner._id, {$inc: {
      'profile.mealCount': redeem ? creditsForAcquisition : - creditsForAcquisition
    }}, (err) => { if(err) { throwError(err.message); } else {
      if(Meteor.isServer && redeem){
        const body = `Order up ${owner.profile.fn}! You have ${owner.profile.mealCount * 8} in FREE food on Habitat`;
        twilio.messages.create({
          to:'+1' + owner.profile.phone,
          from: Meteor.settings.twilio.twilioPhone ||  Meteor.settings.twilio.phone,
          body: body
        }, (err, responseData) => {
          console.log(`just ${redeem ? 'given' : 'taken'} ${creditsForAcquisition} from ${owner.profile.fn} after ${tx.company_name} ${redeem ? 'accepted' : 'declined'} order ${tx.orderNumber}`);
        });
      }
    }});
  }
  //all promos user has redeemed or owns
  getUsersAcquisitionInstance(id){
    return Instances.find({ownedBy: id || Meteor.userId()}, {sort: {dateIssued: 1}}).fetch()[0];
  }

  getSignupCodeUsed(userId){
    const id = userId ? userId : Meteor.userId();
    return Instances.findOne({
      acquisition: true,
      ownedBy: {$ne: userId},
      $or: [
        { redeemedBy: {$in: [userId]}},
        { owners: {$in: [userId]}}
      ]
    });
  }

  getPromoHistory(userId){
    const id = userId ? userId : Meteor.userId();
    return Instances.find({$or: [{owners: {$in: [id]}}, {redeemedBy: {$in: [id]}}]}).fetch();
  }
  hasRedeemedAcquisition(userId){
    const id = userId ? userId : Meteor.userId();
    const userAcqPromo = _.findWhere(this.getPromoHistory(), {
      acquisition: true,
    });
    return !userAcqPromo ? false : userAcqPromo.redeemedBy.includes(id);
  }
  getPromoOwners(promoName){
    const i = Instances.findOne({name: promoName});
    return i ? Meteor.users.find({_id: {$in: i.owners}}).fetch() : console.log(`${promoName} is undefined`);
  }
  getRedeemablePromos(){
    const usablePromos =  this.getPromoHistory().filter(p =>
      !p.expired || !p.redeemedBy.includes(Meteor.userId()) || p.ownedBy !== Meteor.userId()
    );
    //filter usable by promos attached to in progress transactions
    const redeemedAndPendingPromoIds = transactions.find({
      buyerId: Meteor.userId(),
      status: { $nin: ['created'] },
      promoId: { $exists: true }
    }).map(t => t.promoId);
    return usablePromos.filter(p => !redeemedAndPendingPromoIds.includes(p._id));
  }
  alreadyRedeemed(userId, promoId) {
    return Instances.findOne(promoId).redeemedBy.includes(userId);
  }
  //returns POSITIVE amount of discount
  getPromoValue(sellerId, promoId){
    const promo = Instances.findOne(promoId);
    if(!promoId || !promo) { return 0; } else {
      return promo.dollarAmount;
    }
  }
}
Instances = new instancesCollection("instances");
