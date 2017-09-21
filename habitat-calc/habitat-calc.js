import { _ } from 'underscore';
//init submodule
recalcOrderTotal = (order) => {
  return round(order.map((order) => {
    return order.itemPrice +
      Modifiers.find({_id: {$in: _.flatten(order.modifiers)}}).fetch().reduce((sum, id) => {
        return sum + Modifiers.findOne(id).price;
      }, 0);
    }).reduce((num, sum) => { return num + sum; }, 0));
}
calc = {
  _roundToTwo(amt) {
    return (Math.round(amt * 100) / 100);
  },
  _tip(tx){
    if(tx && tx.method === 'Pickup'){
      return 0;
    } else {
      return tx && tx.payRef && tx.payRef.tip ? tx.payRef.tip : 0;
    }
  },
  _promoAmount(tx){ return Instances.getPromoValue(tx.sellerId, tx.promoId); },
  _deliveryFee(tx){
    const today = businessProfiles.getToday(tx.sellerId);
    if (!today.vendorPremium) { return today.deliveryFee; } else {
      const deliveryFee = today.deliveryFeeMinimumFallback; //it's premium, so deliveryFee for today is 0. need to look at the day's minimumFallbackFee
      const diff = today.vendorRates.freeDel.minimum - tx.payRef.tp; //get the difference between the free delivery minimum and totalPrice
      return diff <= 0 ? 0 : deliveryFee;
    }
  },
  platformRevenue: {
    pickup(tp){
      return calc._roundToTwo(
        tp +
        calc.tax(tp) +
        calc.serviceCharge.pickup
      );
    },
    delivery(tp, tx){
      const prePromo = tp + calc._deliveryFee(tx) + calc._tip(tx) + calc.tax(tp);
      if ((prePromo - calc._promoAmount(tx)) < 0) {
        return 0;
      } else {
        return calc._roundToTwo(prePromo - calc._promoAmount(tx));
      }
    }
  },
  serviceCharge: { pickup: 0.50, },
  tax(tp){ return tp * 0.08; },
  getPayRef(txId){
    check(txId, String);
    const tx = transactions.findOne(txId);
      const totalPrice = recalcOrderTotal(tx.order);
      switch (tx.method) {
        case 'Pickup':
          const pickupMealAmount = this.calcMealAmount(this.platformRevenue.pickup(totalPrice), tx);
          return {
            tp: totalPrice,
            tax: this.tax(totalPrice),
            tip: 0,
            chargeFee: this.serviceCharge.pickup,
            platformRevenue: !pickupMealAmount ? this.platformRevenue.pickup(totalPrice) : pickupMealAmount.diff,
            mealInfo: !pickupMealAmount ? null : pickupMealAmount,
          };
        case 'Delivery':
          const deliveryMealAmount = this.calcMealAmount(this.platformRevenue.delivery(totalPrice, tx), tx);
          const payRef = {
            tp: totalPrice,
            tax: this.tax(totalPrice),
            deliveryFee: this._deliveryFee(tx),
            promoAmount: this._promoAmount(tx),
            chargeFee: 0,
            tip: this._tip(tx),
            platformRevenue: !deliveryMealAmount ? this.platformRevenue.delivery(totalPrice, tx) : deliveryMealAmount.diff,
            mealInfo: deliveryMealAmount ? deliveryMealAmount : null
          };
          return payRef;
        default: //method is not set, default to pickup
          return {
            tp: totalPrice,
            tax: this.tax(totalPrice),
            chargeFee: this.serviceCharge.pickup,
            platformRevenue: !pickupMealAmount ? this.platformRevenue.pickup(totalPrice) : pickupMealAmount.diff,
            mealInfo: !pickupMealAmount ? null : pickupMealAmount,
          };
        }
  },

  calcMealAmount(total, tx) {
    const usr = Meteor.users.findOne(tx.buyerId);
    const usersMeals =  usr ? usr.profile.mealCount : null;
    if (usersMeals) {
      const bigCt = usersMeals * 8;
      const newBigCt = bigCt - total;
      if (newBigCt > 0) {
        const rounded = Math.round((newBigCt / 8) * 10) / 10;
        return {
          used: Number((usersMeals - rounded).toFixed(1)),
          new: rounded,
          diff: 0
        };
      } else {
        return {
          used: Number(usr.profile.mealCount),
          new: 0,
          diff: Math.abs(newBigCt)
        };
      }
    } else {
      return false;
    }
  },
  //All .weeks private methods are DaaS/Food Fast agnostic
  weeks: {
    _completed(bizId, weekNum){
      txs = transactions.find({
       week: parseInt(weekNum),
       sellerId: bizId,
       status: { $in: ['completed', 'archived']},
    }, {sort: { timeRequested: 1 }}).fetch()
      return txs;
    },
    _missed(bizId, weekNum){
      transactions.find({
       week: parseInt(weekNum),
       sellerId: bizId,
       $or: [
        { missedByVendor: true },
        { cancelledByVendor: true },
        { cancelledByAdmin: true },
       ]
     }, {sort: { timeRequested: 1 }}).fetch()
    },
    _all(bizId, weekNum) {
      return transactions.find({
       week: parseInt(weekNum),
       sellerId: bizId,
       $or: [
        { missedByVendor: true },
        { cancelledByVendor: true },
        { cancelledByAdmin: true },
        { status: { $in: [ 'completed', 'archived' ] }},
       ]
     }, {sort: { timeRequested: -1 }}).fetch();
    },
    _getAllWeeks(bizId) { return weeks.find({}, {sort: {week: 1}}).map(week => this.getWeek(bizId, week, counts=true)); },
    getWeek(bizId, weekNum, counts){
      //always filter what vendor sees by these
      const week = weeks.findOne({week: parseInt(weekNum)});
      const allComplete = this._completed(bizId, weekNum);
      const response = {
        vendor: businessProfiles.findOne(bizId),
        transactions: !counts ? this._all(bizId, weekNum) : this._all(bizId, weekNum).length,
        potentialTransactions: !counts ? this._missed(bizId, weekNum) :
          this._missed(bizId, weekNum) ? this._missed(bizId, weekNum).length : 0,
        completedTransactions: !counts ? allComplete : allComplete.length,
        subtotal: {
          deliveryOrders: allComplete
            .filter(t => !t.DaaS)
            .filter(t => t.method === 'Delivery')
            .reduce((total, tx) => { return total + parseFloat(tx.vendorPayRef.totalPrice); }, 0),
          pickupOrders: allComplete
            .filter(t => !t.DaaS)
            .filter(t => t.method === 'Pickup')
            .reduce((total, tx) => { return total + parseFloat(tx.vendorPayRef.totalPrice); }, 0),
          orders: allComplete
            .filter(t => !t.DaaS)
            .reduce((total, tx) => { return total + parseFloat(tx.vendorPayRef.totalPrice); }, 0),
          DaaS: allComplete
            .filter(t => t.DaaS && t.method === 'Delivery')
            .reduce((total, tx) => { return total + parseFloat(tx.vendorPayRef.totalPrice); }, 0),
        },
        payout: {
          deliveryOrders: allComplete
            .filter(t => !t.DaaS)
            .filter(t => t.method === 'Delivery')
            .reduce((total, tx) => { return total + parseFloat(tx.vendorPayRef.vendorPayout); }, 0),
          pickupOrders: allComplete
            .filter(t => !t.DaaS)
            .filter(t => t.method === 'Pickup')
            .reduce((total, tx) => { return total + parseFloat(tx.vendorPayRef.vendorPayout); }, 0),
          orders: allComplete
            .filter(t => !t.DaaS)
            .reduce((total, tx) => { return total + parseFloat(tx.vendorPayRef.vendorPayout); }, 0),
          DaaSPreTip: allComplete
            .filter(t => t.DaaS && t.method === 'Delivery')
            .reduce((total, tx) => { return total + parseFloat(tx.vendorPayRef.vendorPayout); }, 0),
          DaaSTips: allComplete
            .filter(t => t.DaaS && t.method === 'Delivery')
            .reduce((total, tx) => {
              tip = parseFloat(tx.payRef.tip) || parseFloat(tx.tip) || 0;
              return total + tip;
            }, 0),
          DaaS: allComplete
            .filter(t => t.DaaS && t.method === 'Delivery')
            .reduce((total, tx) => {
              tips = parseFloat(tx.payRef.tip) || 0;
              return total + tx.vendorPayRef.vendorPayout - tips;
            }, 0),
        },
        startTime: moment(week.startTime).format(),
        endTime: moment(week.endTime).format(),
        start: week.startTime,
        end: week.endTime,
      };
      return response;
    },
  },
};
