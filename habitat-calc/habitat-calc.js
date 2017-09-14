import { _ } from 'underscore';
//init submodule
calc = {
  _checkDecimalPlace (num) {
    //http://stackoverflow.com/questions/10454518/javascript-how-to-retrieve-the-number-of-decimals-of-a-string-number
    const match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    return Math.max( 0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
  },
  _roundToTwo(amt) {
    // http://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-in-javascript
    const rounded = (Math.round(amt * 100) / 100);
    if(this._checkDecimalPlace(rounded) > 2) { throw new Meteor.Error(503, '_roundToTwo.gtTwo'); }
    return rounded;
  },
  _totalPrice(tp){
    return calc._roundToTwo(tp);
  },
  _checkQuery(query, DaaS=false){
    if(!_.contains(['count', 'pretax', 'pretip', 'rate', 'tips', 'tax', 'total', 'payout'], query)){
      throwError(`query ${query} is not allowed`);
    }
  },
  orderTotal(order) {
    return this._roundToTwo(order.map((order) => {
      return order.itemPrice +
        Modifiers.find({_id: {$in: _.flatten(order.modifiers)}}).fetch().reduce((sum, id) => {
          return sum + Modifiers.findOne(id).price;
        }, 0);
      }).reduce((num, sum) => { return num + sum; }, 0));
  },
  _customerCommission(tp){ return this._roundToTwo(tp * 0.05); },
  _mealServiceCharge(tp){ return this._roundToTwo((tp * 0.029) + 0.30); },
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
  meal: {
    mealCountDefault: 1,
    deliveryCountDefault: 1,
    mealPrice: 8,
    mealTotal(meal_count) { return (this.mealPrice * meal_count); },
    subtotal(meal_count){ return this.mealTotal(meal_count); },
    serviceCharge(meal_count){ return calc._mealServiceCharge(this.subtotal(meal_count)); },
    platformRevenue(meal_count){ return calc._roundToTwo( this.subtotal(meal_count) + this.serviceCharge(meal_count) ); },
    getPayRef(meal_count){
      return {
        mealCount: meal_count,
        subtotal: this.subtotal(meal_count),
        serviceCharge: this.serviceCharge(meal_count),
        platformRevenue: this.platformRevenue(meal_count),
      };
    }
  },
  platformRevenue: {
    pickup(tp){
      return calc._roundToTwo(
        calc._totalPrice(tp) +
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
  tax(tp){ return tp * this.taxRate; },
  needToRecalculate(diff){
    return diff.order || diff.method || diff.promoId ||
      ( diff.payRef && diff.payRef.tip ||
        diff.payRef && diff.payRef.tip === 0
      );
  },
  recalculateOpenTxs(id, diff) {
    if(this.needToRecalculate(diff)) {
      const tx = transactions.findOne(id); if(!tx) { throw new Meteor.Error(id + 'Sorry, tx god deleted or is being updated and not there'); }
      if(!tx.DaaS && !tx.thirdParty) {
        Meteor.call('recalcPayRef', id, (err) => {
          if(err) { throw new Meteor.Error(err.message); }
        });
      }
    }
  },
  getPayRef(txId){
    check(txId, String);
    const tx = transactions.findOne(txId);
      const totalPrice = this.orderTotal(tx.order);
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
  //parsing down different payouts from getWeek into what vendor needs
  //we are abstracting this 4 levels up, i don't think there's further need for refactoring
  payouts: {
    delivery(request, query, fullWeek) {
      calc._checkQuery(query);
      week = request.fullWeek;
      subtotal = week.subtotal.deliveryOrders;
      switch (query) {
        case 'count': return week.transactions.filter(tx => tx.status === 'completed' || tx.status === 'archived')
          .filter(tx => tx.method === 'Delivery') .filter(tx => !tx.DaaS).length;
        case 'pretax': return subtotal;
        case 'tax': return subtotal * calc.taxRate;
        case 'total': return subtotal * calc.taxRate + subtotal;
        case 'payout': return  week.payout.deliveryOrders + subtotal * calc.taxRate;
      }
    },
    pickup(request, query) {
      calc._checkQuery(query);
      week = request.fullWeek;
      subtotal = week.subtotal.pickupOrders;
      switch (query) {
        case 'count': return week.transactions.filter(tx => tx.status === 'completed' || tx.status === 'archived')
          .filter(tx => tx.method === 'Pickup').filter(tx => !tx.DaaS).length;
        case 'pretax': return subtotal;
        case 'tax': return subtotal * calc.taxRate;
        case 'total': return subtotal * calc.taxRate + subtotal;
        case 'payout': return week.payout.pickupOrders + subtotal * calc.taxRate;
      }
    },
    total(request, query){
      calc._checkQuery(query);
      week = request.fullWeek;
      subtotal = week.subtotal.orders;
      switch (query) {
        case 'count': return week.transactions.filter(tx => tx.status === 'completed' || tx.status === 'archived')
          .filter(tx => !tx.DaaS).length;
        case 'pretax': return subtotal;
        case 'tax': return subtotal * calc.taxRate;
        case 'total': return subtotal + subtotal * calc.taxRate;
        case 'payout': return  week.payout.orders + subtotal * calc.taxRate ;
      }
    },
    DaaS(request, query){
      calc._checkQuery(query);
      week = request.fullWeek;
      switch (query) {
        case 'count': return week.transactions.filter(tx => tx.status === 'completed' || tx.status === 'archived' )
          .filter(tx => tx.DaaS && tx.method === 'Delivery').length;
        case 'pretip': return Math.abs(week.payout.DaaSPreTip);
        case 'rate': return businessProfiles.getToday(request.bizId).vendorRates.DaaS.flat;
        case 'tips': return week.payout.DaaSTips;
        case 'payout': return Math.abs(week.payout.DaaS);
      }
    },
  },
  creditsForAcquisition: 0.625,
  cancelCredits: 0.125,
  taxRate: 0.08,
};
