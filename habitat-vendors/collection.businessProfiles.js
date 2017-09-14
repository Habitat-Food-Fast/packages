import { _ } from 'underscore';

class businessProfilesCollection extends Mongo.Collection {
  insert(doc, callback) {
    const _doc = _.extend(doc, {
      prep_time: parseInt(doc.prep_time),
      open: false,
      featured: false,
      clicks: 0,
      DaaS: true,
      backend_name: doc.company_name,
      order: businessProfiles.find().count() + 1,
      categories: [ 'none' ], //need to start w/ this or reassigning category won't work
      transactionCount: 0,
      employees: [],
      weeklyHours: this.setHours(),
      backend_habitat: Habitats.findOne(doc.habitat[0]).name,
      grubhubId: doc.grubhubId
    }); console.log(_doc);
    super.insert(_doc, (err, newBizId) => {
      if(err) { console.log('inside error'); throwError({reason: err.message}); }
      const bp = businessProfiles.findOne(newBizId);
        console.warn(`creating apikey for ${bp.uid}`);
        Meteor.call('createApiKey', bp.uid, (err, res) => {
          if (err) {
            console.log(err);
          }
        });
    }, callback);
  }
  remove(id, callback){
    return super.remove(id, (err, res) => {
      if(err) { throw new Meteor.Error(err.message); }
      Modifiers.remove({uid: id}, {multi: true});
      saleItems.remove({uid: id}, {multi: true});
    });
  }
  forceRemove(callback){
    return super.remove({}, callback);
  }
  forceInsert(docs, callback){
    return docs.forEach((doc) => {
      super.insert(doc, {validate: false}, (err, id) => {
        if(err) { throwError(err.message); } else {
          fakePhone = phone.random();
          businessProfiles.update(id, {$set: {
            orderPhone: fakePhone,
            employees: [],
            faxPhone: fakePhone.toString(),
            // company_name: `FAKE ${doc.company_name}`,
            company_phone: fakePhone.toString(),
            company_email: Random.id() + '@hotmail.com',
          }}, (err) => { if(err) { throwError(err.message); }});
        }
      });
    });
  }
  setHours(id){
    hoursArray = [];
    rateObj = {
      vendorPremium: false,
      deliveryFee: 2.99,
      vendorRates: {
        pickup: { percent: 0.1, flat: 0 },
        delivery: { percent: 0.1, flat: 0 },
        freeDel: { percent: 0.25, flat: 0, minimum: 10 },
        DaaS: { percent: 0, flat: 5 }
      }
    };
    if(id) {
      hoursArray = businessProfiles.findOne(id).weeklyHours.map((hourObj) => {
        return _.extend(hourObj, rateObj);
      });
    } else {
      [0,1,2,3,4,5,6].forEach((i) => {
        var openHour = 9 * 3600000;
        var closeHour = 19 * 3600000;
        var dayBase = i * 86400000;
        hoursArray.push({
          day: i,
          open: true,
          vendorPremium: false,
          deliveryFee: 2.99,
          openHr: '9:00 AM',
          closeHr: '7:00 PM',
          openTime: dayBase + openHour,
          closeTime: dayBase + closeHour,
          vendorRates: rateObj.vendorRates,
        });
      });
    }

    return hoursArray;
  }
  openedAtToday(bizId) {
    openHr = this.getToday(bizId).openHr;
    hr = moment(openHr, ["h:mm"]).format("HH");
    min = moment(openHr, ["h:mm"]).format("mm");
    return moment().day(moment(Date.now()).day()).hour(hr).minute(min).format();
  }
  getWeeklyOrders(bp, week, isDaaS) {
    txs = transactions.find({
      week: week.week,
      status: {$in: transactions.completedAndArchived()},
      DaaS: isDaaS,
      sellerId: bp._id
    }, {sort: {timeRequested: 1}});
    return txs.count() ? txs.fetch() : [];
  }
  getToday(id){
    const weeklyHours = businessProfiles.findOne(id).weeklyHours; check(weeklyHours, [Object]);
    return _.findWhere( weeklyHours, { day: moment().day() } );
  }
  getTomorrowOpen(id){
    const weeklyHours = businessProfiles.findOne(id).weeklyHours; check(weeklyHours, [Object]);
    return _.findWhere( weeklyHours, { day: moment().day() + 1} ) ? _.findWhere( weeklyHours, { day: moment().day() + 1} ).openHr : undefined;
  }
  deliveryFee(id){ return this.getToday(id).vendorPremium ? 0 : this.getToday(id).deliveryFee; }
  deliveryEstimate(id, inMinutes){
    const bp = businessProfiles.findOne(id);
    const delTime = Habitats.findOne(bp.habitat[0]).deliveryTime;
    return inMinutes ?
      bp.prep_time + delTime :
      Date.now() + (60000 * bp.prep_time) + (60000 * delTime);
  }
  pickupEstimate(doc){
    const bp = businessProfiles.findOne(doc.sellerId);
    return transactions.findOne(doc._id).timeRequested + (60000 * bp.prep_time);
  }
  rates(txId){
    if(!txId) { return } else {
      const tx = transactions.findOne(txId); if(!tx) { throwError('No transaction found'); }
      const bp = businessProfiles.findOne(tx.sellerId);
      const today = this.getToday(tx.sellerId);
      //TODO: refactor into calc package
      const meetsFreeDelCriteria = (
        tx.method === 'Delivery' &&
        today.vendorPremium &&
        tx.payRef.tp >= today.vendorRates.freeDel.minimum
      );

      const rates = tx.DaaS ? today.vendorRates.DaaS :
        today.vendorRates[
          meetsFreeDelCriteria ?
          'freeDel' :
          tx.method ? tx.method.toLowerCase() : 'pickup'
        ];
      const totalWithTax = tx.payRef.tp + (tx.payRef.tp * calc.taxRate);
      const txPayout = tx.payRef.tp - (tx.payRef.tp * rates.percent) - rates.flat;
      const DaaSTotal = today.vendorRates.DaaS.flat;

      return tx.catering ? {
        totalPrice: this.cateringPrice(tx.orderSize),
        vendorPayout: - this.cateringPrice(tx.orderSize)
      } : _.extend(rates,  {
        totalPrice: tx.DaaS ? DaaSTotal : tx.payRef.tp,
        totalWithTax: totalWithTax,
        vendorPayout: this.getPayout(tx, txPayout, DaaSTotal),
      });
    }
  }
  getPayout(tx, txPayout, DaaSTotal){
    if(tx.DaaS){
      if(tx.method === 'Pickup'){
        return 0;
      } else {
        return - DaaSTotal;
      }
    } else {
      return txPayout;
    }
  }
  cateringPrice(bags) {
    const cat = Settings.findOne({name: 'cateringPrice'});
    return bags > 1 ? cat.first + ((bags - 1) * cat.additional) : cat.first;
  }
  getShortName(company_name) {
    const bizByWord = company_name.split(' ');
    const shortName = bizByWord.length < 1 ? bizByWord[0] : (bizByWord[0].length > 8 ? bizByWord[0] : `${bizByWord[0]} ${bizByWord[1] ? bizByWord[1] : ''}`);
    const removeCommas = shortName.replace(/,/g , " ");
    return removeCommas.replace('&', ' and ');
  }
  bizInitials(bizName) { return bizName.split(' ').map(w => w.charAt(0)).join().replace(',','');}
  getMenu(id){
    bp = businessProfiles.findOne(id ? id : {})
    saleItems.find({uid: bp._id}).forEach((si) => {
      console.log(si._id)
      mods = Modifiers.find({itemId: {$in: [si._id]}}).map((mod) => {

        return modCategories.findOne(mod.subcategory) ? _.extend(
          _.omit(mod, ['itemId', 'uid', '_id', 'subcategory']),
          { name, selectOne, required } = modCategories.findOne(mod.subcategory)
        ) : false
      });
      console.log({
        name: si.name,
        price: si.price,
        category: si.category,
        modifiers: mods,
      });
    })
  }
}

businessProfiles = new businessProfilesCollection("businessprofiles");

businessProfiles.allow({
  update(){ return Roles.userIsInRole(Meteor.userId(), ['admin']); }
});

businessProfiles.find({}).observeChanges((id, fields) => {
  if(fields.open && fields.open === false){
    const extVendorId = transactions.findOne({partnerName: Ontray.owner}).externalVendorId;
    Ontray.hours.close(extVendorId);
  }
});

businessProfiles.escape = company_name => company_name.replace(/,/g , " ").replace('&', ' and ');
if (Meteor.isServer) {
  businessProfiles._ensureIndex({ 'geometry.coordinates': '2d'});
}
generateBizPass = function (company_name) {
  return  company_name.substr(0, 5)
          .toLowerCase()
          .replace(/\s+/g, '') +
          ("0" + Math.floor(Math.random() * (9999 - 0 + 1)))
          .substr(-4);
};

businessProfiles.initEasySearch(['company_name', 'company_email', 'company_address'], {
  'limit': 20,
  'use': 'mongo-db',
  'convertNumbers': false
});
