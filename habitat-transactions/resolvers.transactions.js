import convert from 'json-2-csv';
const convertSync = Meteor.wrapAsync(convert.json2csv);

transactions.csv = {
  orders(txId, req) {
    getIncomplete = req.getIncomplete;
    const tx = transactions.findOne(txId);
    const b = businessProfiles.findOne(tx.sellerId);

    const u = Meteor.users.findOne(tx.DaaS ? b.uid : tx.buyerId);
    const h = Habitats.findOne(tx.habitat);

    if(b && h){
      const up = u ? u.profile : '';
      const firstOrder = transactions.find({sellerId: tx.sellerId, status: {$in: transactions.completedAndArchived()}}, {sort: {timeRequested: 1}}).fetch()[0];
      const res = {
         // weekId: weeks.findOne({week: tx.week})._id,
        week: tx.week,
        habitat: h.name,
        _id: tx._id,
        order_number: tx.orderNumber,
        braintreeId: tx.braintreeId || '',
        receipt_link: urls.user.single_receipt(tx._id),
        buyerId: tx.buyerId,
        buyerName: up ? up.fn : '',
        buyerLastName: up && up.ln ? up.ln : '',
        buyerPhone: up ? up.phone : '',
        buyerEmail: up ? up.email : '',
        buyerCompletedOrdersToDate: transactions.find({buyerId: tx.buyerId, status: {$in: transactions.completedAndArchived()}}).count(),
        mealUser: up ? up.mealUser : '',
        gender: up && up.gender && up.gender !== null ?
          up.gender :
          '',
        createdAt: u ? u.createdAt : '',
        companyId: tx.sellerId,
        firstOrder: firstOrder && firstOrder.humanTimeRequested ? firstOrder.humanTimeRequested : '',
        company_name: businessProfiles.escape(tx.company_name),
        mealName: tx.mealId && FeaturedMeals.findOne(tx.mealId) ? FeaturedMeals.findOne(tx.mealId).title : '',
        promoName: tx.promoId && Instances.findOne(tx.promoId) ? Instances.findOne(tx.promoId).name : '',
        promoId: tx.promoId && Instances.findOne(tx.promoId) ? Instances.findOne(tx.promoId)._id : '',
        DaaS: tx.DaaS,
        DaaSType: tx.DaaSType,
        isAcquisition: !tx.promoId ? '' : (Instances.findOne(tx.promoId) && Instances.findOne(tx.promoId).acquisition),
        accepted_by_vendor: tx.acceptedByVendor || false,
        settledByAdmin: tx.settledByAdmin || false,
        adminAssign: tx.adminAssign || false,
        missed_by_vendor: tx.missedByVendor || false,
        cancelled_by_vendor: tx.cancelledByVendor || false,
        cancelled_by_admin: tx.cancelledByAdmin || false,
        completed: tx.status === 3 || tx.status === 4 || tx.status === 'completed' || tx.status === 'archived',
        delivery: tx.method === 'Delivery',
        runnerId: tx.runnerId ? tx.runnerId : '',
        runnerName: tx.runnerId && Meteor.users.findOne(tx.runnerId) ? Meteor.users.findOne(tx.runnerId).profile.fn : '',
        runnerRating: tx.method === 'Delivery' && tx.rating ? tx.rating : '',
        vendorRating: tx.rating_vendor,
     };
      return _.extend(res, times(tx, req), payRef(tx, req));
    } else {
        if(!u) { console.warn('no user doc'); }
        if(!b){ console.warn('no biz'); }
        if(!h) { console.log(`no hab`); }
        console.warn(`skipping ${txId}`);
      }
  },
  items(txId){
    const tx = transactions.findOne(txId); check(tx._id, String);
    const u = Meteor.users.findOne(tx.buyerId);
    if(!u) { console.warn(`user missing for buyerId ${tx.buyerId}`); } else {
      const mapItems = tx.order.map((o) => {
        const item = saleItems.findOne(o.saleItemId);
        if(!item) { console.warn(`no saleItem for sID ${o.saleItemId}`); } else {
          return {
            'orderNumber': tx.orderNumber,
            vendor: businessProfiles.escape(tx.company_name),
            item: businessProfiles.escape(item.name),
            itemPrice: accounting.formatMoney(item.price),
            platformRevenue: accounting.formatMoney(tx.payRef.platformRevenue),
            totalMealsInOrder: tx.order
              .map(singleOrderObj => saleItems.findOne(singleOrderObj.saleItemId) ?
                saleItems.findOne(singleOrderObj.saleItemId).price :
                0
              ).filter(price => price > 5).length,
            customer: u.profile.ln ? `${u.profile.fn} ${u.profile.ln}` : u.profile.fn,
            phone: u.profile && u.profile.phone ? u.profile.phone : '',
            mealUser: u.profile.mealUser,
            gender: u.profile.gender ? u.profile.gender : '',
            delivery: tx.method === 'Delivery',
            created: csv.transformTime(tx.createdAt, true),
            requested: csv.transformTime(tx.timeRequested),
            delivered: tx.method === 'Delivery' ? csv.transformTime(tx.dropoffTime) : '',
          };
        }
      });
      return mapItems;
    }
  },
  vendor: {
    resolvers: {
      DaaS(week, bp, tx){
        const tip = tx.payRef.tip || tx.tip || 0;
        order = {
          'Week Ending': moment(week.endTime).format('MMM Do YYYY'),
          'Type': tx.DaaSType,
          'Order Number': tx.orderNumber,
          'Time Requested': tx.humanTimeRequested,
          'Vendor Commission': vendorCommission(tx),
          'Tip': tip,
          'Total': vendorCommission(tx) + tip,
          'Address': tx.deliveryAddress.split(',')[0],
        };
        // console.log(order);
        return order;
      },
      habitat(week, bp, tx){
        order = {
          'Week Ending': moment(week.endTime).format('MMM Do YYYY'),
          'Method': tx.method,
          'Order Number': tx.orderNumber,
          'Time Requested': tx.humanTimeRequested,
          'Order Total': tx.payRef.tp,
          'Habitat Rate': tx.vendorPayRef.percent,
          'Tax': 0.08,
          'Vendor Commission': vendorCommission(tx),
          'Total': (tx.payRef.tp - vendorCommission(tx)) + (tx.payRef.tp * 0.08),
          'Address': tx.method === 'Delivery' ? tx.deliveryAddress.split(',')[0] : 'N/A',
        };
        // console.log(order);
        return order;
      },
    },
    payout: {
      _progress(token, progress) {
        streamer.emit(`progress-${token}`, progress );
      },
      DaaS(bizId, weekNum, DaaS, token=Random.id(), send=true){
        const bp = businessProfiles.findOne(bizId);
        const week = weeks.findOne({week: weekNum});
        const date = moment(week.endTime).format('MMM Do YYYY');
        const resolver = businessProfiles.getWeeklyOrders(bp, week, isDaaS=true);
        const orders = resolver.map((t, index) => {
          progress = index / resolver.length;
          console.log(`completed ${progress * 100}%`);
          this._progress(token, progress);
          return EJSON.toJSONValue(transactions.csv.vendor.resolvers.DaaS(week, bp, t));
        });

        if(orders.length){
          try {
            console.log(`converting ${orders.length} DaaS for ${bp.company_name}`);
            id = vendorReceipts.insert({
              createdAt: new Date(),
              sellerId: bizId,
              company_name: bp.company_name,
              weekNum: weekNum,
              orders: resolver.length,
              DaaS: true,
              csv: convertSync(orders, csv.settings),
              bp, week, date,
            });
            return orders;
          } catch (err) {
            throw new Meteor.Error(err.message);
          }
        }
      },
      habitat(bizId, weekNum, DaaS, token=Random.id(), send=true){
        const bp = businessProfiles.findOne(bizId);
        const week = weeks.findOne({week: weekNum});
        const date = moment(week.endTime).format('MMM Do YYYY');
        const resolver = businessProfiles.getWeeklyOrders(bp, week, isDaaS=false);

        const orders = resolver.map((t, index) => {
          console.log(`completed ${(index / resolver.length) * 100}%`);
          this._progress(token, (index / resolver.length));
          return EJSON.toJSONValue(transactions.csv.vendor.resolvers.habitat(week, bp, t));
        });

        if(orders.length){
          try {
            console.log(`converting ${orders.length} DaaS for ${bp.company_name}`);
            id = vendorReceipts.insert({
              createdAt: new Date(),
              sellerId: bizId,
              company_name: bp.company_name,
              weekNum: weekNum,
              orders: orders.length,
              DaaS: true,
              csv: convertSync(orders, csv.settings),
              bp, week, date,
            });
            return orders;
          } catch (err) {
            throw new Meteor.Error(err.message);
          }
        }
      },
      getAttachments(bizId, weekNum, DaaS, token=Random.id(), send=true){
        const week = weeks.findOne({week: weekNum});console.log(`week ${week._id}`);
        const bp = businessProfiles.findOne(bizId);
        const DaaSOrders = this.DaaS(bizId, weekNum, DaaS, token=Random.id(), send=true); console.log(`daasorder length is ${DaaSOrders.length}`);
        const HabitatOrders = this.habitat(bizId, weekNum, DaaS, token=Random.id(), send=true);console.log(`hab length is ${HabitatOrders.length}`);
        const date = moment(week.endTime).format('MMM Do YYYY');
        let   attachments = !HabitatOrders.length ? [] : [{
          fileName: `FF_${businessProfiles.getShortName(bp.company_name)}_invoice_${date}.csv`,
          contents: HabitatOrders
        }];
        if(bp.DaaS) {
          attachments.push({
            fileName: `DaaS_${businessProfiles.getShortName(bp.company_name)}_invoice_${date}.csv`,
            contents: DaaSOrders
          });
        }
        return attachments;
      },
      send(bizId, weekNum, DaaS, token=Random.id(), send=true){
        const bp = businessProfiles.findOne(bizId);
        const week = weeks.findOne({week: weekNum});
        const attachments = this.getAttachments(bizId, weekNum, DaaS, token=Random.id(), send=true);
        console.log(`inside send for ${bp.company_name}, week: ${week.week}`);
        if(send){
          const date = moment(week.endTime).format('MMM Do YYYY');
          Mailer.send({
            to: Meteor.settings.devMode ?  'mike@tryhabitat.com' : `${bp.company_name} <${Meteor.users.findOne(bp.uid).username}>`,
            subject: `Habitat Invoice - Week Ending ${date}`,
            template: 'emailVendorWeeklyPayout',
            data: { bizId: bizId, week: weekNum },
            attachments,
          });
        }
      },
    },
  },
};

function times(tx, req){
  return {
    dayCreated: tx.createdAt ? csv.transformTime(tx.createdAt, true) : '',
    createdAt: tx.createdAt ? csv.transformTime(tx.createdAt) : '',
    dayRequested: tx.timeRequested ? csv.transformTime(tx.timeRequested, true) : '',
    timeRequested: getIncomplete ? '' : tx.timeRequested ? csv.transformTime(tx.timeRequested) : '',
    dropoffVariation: getVariation(tx, getIncomplete),
  };
}
function getVariation(tx, getIncomplete){
  if(getIncomplete || tx.method === 'Pickup'){
    return '';
  } else if(tx.dropoffVariationMin){
     if(tx.dropoffVariationMin < 120){
       return calc._roundToTwo(tx.dropoffVariationMin);
     } else {
       return '';
     }
  } else {
    return '';
  }
}
function vendorCommission(tx) {
  const backupRate = !businessProfiles.rates(tx._id) ? 'NO RATE' :
    businessProfiles.rates(tx._id).totalPrice -
    businessProfiles.rates(tx._id).vendorPayout;
  const vCom = !tx.vendorPayRef.totalPrice ? backupRate :
    tx.DaaS ?
      tx.vendorPayRef.flat :
      tx.vendorPayRef.totalPrice - tx.vendorPayRef.vendorPayout;
  return calc._roundToTwo(vCom);
}
runReceiptTest = () => {
  weeks.find({week: 32}, {sort: {week: -1}}).forEach((week) => {
    console.warn(`we are in week ${week.week}`);
    businessProfiles.find({company_name: 'Ochatto Hot Pot'}).forEach((bp) => {
      console.warn(`hello ${bp.company_name}!`);
      txs = transactions.find({
				week: week.week,
				status: {$in: transactions.completedAndArchived()},
				DaaS: true,
				sellerId: bp._id
			}, {limit: 5, sort: {timeRequested: 1}})
			.map((t) => EJSON.toJSONValue(transactions.csv.vendor.DaaS(week, bp, t)));

			convert.json2csv(txs, Meteor.bindEnvironment((err, spreadsheet) => {
				if(err) { throw new Meteor.Error(err.message); } else {
					vendorReceipts.insert({
						csv: spreadsheet
					}, (err, res) => {
						console.log(err); console.log(res);
					});
				}
			}), csv.settings);
    });
  });
};
function payRef(tx){
  const bp = businessProfiles.findOne(tx.sellerId);
  const backupRate = !businessProfiles.rates(tx._id)? 'NO RATE' : calc._roundToTwo(businessProfiles.rates(tx._id).totalPrice -businessProfiles.rates(tx._id).vendorPayout);
  const vCom = !tx.vendorPayRef.totalPrice ? backupRate :
    tx.DaaS ?
      tx.vendorPayRef.flat :
      tx.vendorPayRef.totalPrice - tx.vendorPayRef.vendorPayout;
  return {
    totalPrice: tx.payRef.tp || 0,
    promoAmount: tx.payRef.promoAmount ? tx.payRef.promoAmount : 0,
    mealCredits: tx.payRef.mealInfo ? tx.payRef.mealInfo.used * 8 : 0,
    deliveryFee: tx.payRef.deliveryFee ? tx.payRef.deliveryFee : 0,
    tip: tx.payRef.tip ? tx.payRef.tip : 0,
    chargeFee: tx.method === 'Pickup' ? tx.payRef.chargeFee : 0,
    platformRevenue: tx.payRef.platformRevenue || 0,
    customerCommission: tx.DaaS ? '' : calc._customerCommission(tx.payRef.platformRevenue) || 0,
    vendorCommission: calc._roundToTwo(vCom),
  };
}
