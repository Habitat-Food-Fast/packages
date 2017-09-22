import { _ } from 'underscore';
if (Meteor.isServer) {
var gateway,
    finalBraintreePrice,
    deliveryFee,
    overheadForTip,
    transactionType,
    merchantAccountId,
    result,
    params,
    id,
    roundedAmount;

//Can stay as a meteor package
Meteor.startup(function () {
  import('braintree').then((braintree) => {
    if(!braintree){
      throw new Meteor.Error(bt.err.noPackage.name, bt.err.noPackage.msg);
    } else if(Meteor.settings.braintree.BT_MERCHANT_ID != Meteor.settings.public.braintree.BT_MERCHANT_ID){
      throw new Meteor.Error(bt.err.mismatch.name, bt.err.mismatch.msg);
    }
    gateway = braintree.connect({
        environment: Meteor.isDevelopment ? braintree.Environment.Sandbox : braintree.Environment.Production,
        merchantId: Meteor.settings.braintree.BT_MERCHANT_ID,
        publicKey: Meteor.settings.braintree.BT_PUBLIC_KEY,
        privateKey: Meteor.settings.braintree.BT_PRIVATE_KEY
    });
  });
});

Meteor.methods({
  //@MARKET
  createSaleTransaction(paymentMethodNonce, txId) {
    if (Meteor.isServer) {
      const tx = transactions.findOne(txId);
      const bp = businessProfiles.findOne(tx.sellerId);
      const isFirstTransaction = transactions.find({buyerId: tx.buyerId, status: 'completed'}).count() === 0;

       if(!bp.open){
         throwError(`Sorry, ${bp.company_name} is closed`);
       } else if (!paymentMethodNonce) {
        if (transactions.creditsCoverFullOrder(txId) || paymentMethodNonce && tx.payRef.platformRevenue === 0) {
        __request(txId, isFirstTransaction, braintreeId=false);
        return { success: true, isFirstTransaction: isFirstTransaction };
        }
      } else {
        check(paymentMethodNonce, String); check(txId, String); check(tx, Object);
        if(tx.buyerId !== Meteor.userId()) { throw new Meteor.Error(503, 'methods.createSaleTransaction.statusOrUserIdWrong'); }
        const syncTransaction = Meteor.wrapAsync(gateway.transaction.sale, gateway.transaction);
        const result = syncTransaction(BT.transactions.generateParams(txId, paymentMethodNonce));

        if(!result.success) {
          throwError(result);
        } else {
          __request(txId, isFirstTransaction, result.transaction.id);
          return _.extend(result, {
            success: true,
            isFirstTransaction: isFirstTransaction,
          });
        }
      }
    }
  },
  //@DISPATCH, API, VENDOR
  //acceptOrder
  submitForSettlement (braintreeId) {
    if (Meteor.isServer) {
      try {
        const tx = transactions.findOne({braintreeId: braintreeId});
        const settleSync = Meteor.wrapAsync(gateway.transaction.submitForSettlement, gateway.transaction);
        transactions.update({braintreeId: braintreeId}, {$set: { amount_settled: tx.payRef.platformRevenue }});
        return settleSync(braintreeId, tx.payRef.platformRevenue);
      } catch (e) {
        throw new Meteor.Error(e.name, e.message);
      }
    }
  },

  //@DISPATCH
  //declineOrder
  voidTransaction (transactionId) {
    if(Meteor.isServer) {
      try {
        const voidSync = Meteor.wrapAsync(gateway.transaction.void, gateway.transaction);
        return voidSync(transactionId);
      } catch (e) {
        throw new Error(e.name, e.message);
      }
    }
  },

  // Add a new customer to the braintree vault
  createCustomer (customerDetails) {
    try {
      const createCustomerSync = Meteor.wrapAsync(gateway.customer.create, gateway.customer);
      return createCustomerSync(customerDetails);
    } catch (e) {
      throw new Meteor.Error(e.name, e.message);
    }
  },

  // Lookup a customer in the braintree vault
  findCustomer (customerId) {
    var findCustomerSync = Meteor.wrapAsync(gateway.customer.find, gateway.customer);
    try {
      return findCustomerSync(customerId);
    } catch (e) {
      throw new Meteor.Error(e.name, e.message);
    }
  },

  getClientToken (tokenOptions) {
    let options = {};
    if (tokenOptions && tokenOptions.customerId){
      options.customerId = tokenOptions.customerId;
    }
    try {
      const generateTokenSync = Meteor.wrapAsync(gateway.clientToken.generate, gateway.clientToken);
      const result = generateTokenSync(options);
      return result.clientToken;
    } catch (e) {
      throw new Meteor.Error(e.name, e.message);
    }
  },

  submitMealForSettlement(mealPlan, nonce){
    const createMealTransactionSynchronously = Meteor.wrapAsync(gateway.transaction.sale, gateway.transaction);
    var result = createMealTransactionSynchronously({
      amount: meal.platformRevenue(mealPlan.meals, mealPlan.deliveries),
      paymentMethodNonce: nonce,
      options: { submitForSettlement: true },
      customFields: { tip: false, meal: true }
    });

    if (!result.success) {
      var potentialErrors = result.errors.deepErrors();
      if (potentialErrors.length > 0) {
        throw new Meteor.Error('bt-transaction-error', potentialErrors[0].message);
      } else {
        switch (result.transaction.status) {
          case 'processor_declined':
            throw new Meteor.Error('bt-transaction-error', result.transaction.processorResponseText);
          case 'settlement_declined':
            throw new Meteor.Error('bt-transaction-error', result.transaction.processorSettlementResponseText);
          case 'gateway_rejected':
            throw new Meteor.Error('bt-transaction-error', 'Gateway Rejected: ' + result.transaction.gatewayRejectionReason);
        }
      }
    } else {
      Invoices.insert(_.extend(mealPlan, {uid: Meteor.userId()}), result, 'meal_plan_custom');
      return result;
    }
  }
});

BT = {
  transactions: {
    generateParams(txId, paymentMethodNonce) {
      const tx = transactions.findOne({_id: txId});
      const bizProf = businessProfiles.findOne(tx.sellerId);
      const btAmount = round(tx.payRef.platformRevenue).toString(); check(btAmount, String);
      return {
        amount: btAmount,
        orderId: tx._id,
        merchantAccountId: Meteor.settings.braintree.BT_MASTER_MERCHANT_ACCOUNT_ID,
        paymentMethodNonce: paymentMethodNonce,
        customFields: {
          time_created: tx.createdAtHuman,
          time_requested: tx.humanTimeRequested,
          company_name: bizProf.company_name,
          company_address: bizProf.company_address,
          order_text: null,
          total_price: accounting.formatMoney(tx.payRef.tp),
          braintree_fee: tx.method === 'Pickup' ? accounting.formatMoney(tx.payRef.chargeFee) : 0,
          deliveryFee:((tx.method == "Delivery") ? tx.payRef.deliveryFee : 0),
          tip: ((tx.method == "Delivery") ? tx.payRef.tip : null),
          is_delivery: ((tx.method == "Delivery") ? true : false),
          featured: ((tx.featured) ? true : false),
          order_number: tx.orderNumber,
        },
        options: {
          submitForSettlement: false //don't submit until vendor accept...
        }
      };

    },
  }
};
}


function __request(txId, isFirstTransaction, braintreeId){
  transactions.request(txId, {
    braintreeId: braintreeId,
    firstOrder: isFirstTransaction,
    status: 'pending_vendor',
  }, (err) => { if (err) { throwError(err.reason); }});
}
