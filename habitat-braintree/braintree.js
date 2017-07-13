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

Meteor.startup(function () {
  import('braintree').then((braintree) => {
    if(!braintree){
      throw new Meteor.Error(bt.err.noPackage.name, bt.err.noPackage.msg);
    } else if(Meteor.settings.braintree.BT_MERCHANT_ID != Meteor.settings.public.braintree.BT_MERCHANT_ID){
      throw new Meteor.Error(bt.err.mismatch.name, bt.err.mismatch.msg);
    }
    gateway = braintree.connect({
        environment: Meteor.settings.devMode ? braintree.Environment.Sandbox : braintree.Environment.Production,
        merchantId: Meteor.settings.braintree.BT_MERCHANT_ID,
        publicKey: Meteor.settings.braintree.BT_PUBLIC_KEY,
        privateKey: Meteor.settings.braintree.BT_PRIVATE_KEY
    });
  });
});

Meteor.methods({
  createSaleTransaction(paymentMethodNonce, txId) {
    if (Meteor.isServer) {
      const tx = transactions.findOne(txId);
      const bp = businessProfiles.findOne(tx.sellerId);
      const isFirstTransaction = transactions.find({buyerId: tx.buyerId, status: 'completed'}).count() === 0;

       if(!bp.open){
         throwError(`Sorry, ${bp.company_name} is closed`);
       } else if (!paymentMethodNonce) {
        console.warn('no paymentnonce');
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
          console.warn('jsut bfore the seocnd request');
          __request(txId, isFirstTransaction, result.transaction.id);
          return _.extend(result, {
            success: true,
            isFirstTransaction: isFirstTransaction,
          });
        }
      }
    }
  },
  // Submit a transaction for processing
  submitForSettlement (braintreeId) {
    if (Meteor.isServer) {
      let tx = transactions.findOne({braintreeId: braintreeId});
      let submitForSettlementSynchronously = Meteor.wrapAsync(gateway.transaction.submitForSettlement, gateway.transaction);
      try {
        result = submitForSettlementSynchronously(braintreeId, tx.payRef.platformRevenue);
        transactions.update({braintreeId: braintreeId}, {$set: {
          amount_settled: tx.payRef.platformRevenue
        }}, (err) => { if(err) { throw new Meteor.Error(err.message); }});
      } catch (e) {
          throw new Meteor.Error(e.name, e.message);
      }
      return result; // transaction details are in result.transaction
    }
  },

  // Cancel a transaction
  voidTransaction (transactionId) {
    if(Meteor.isServer) {
        var voidTransactionSynchronously = Meteor.wrapAsync(gateway.transaction.void, gateway.transaction),
            result;

        try {
            result = voidTransactionSynchronously(transactionId);
        } catch (e) {
            throw new Meteor.Error(e.name, e.message);
        }
        return result;
    }
  },

  // Add a new customer to the braintree vault
createCustomer (customerDetails) {
    check(customerDetails, Match.ObjectIncluding({ 'firstName': String }));

    var createSynchronously = Meteor.wrapAsync(gateway.customer.create, gateway.customer),
        result = null;

    try {
        result = createSynchronously(customerDetails);
    } catch (e) {
        throw new Meteor.Error(e.name, e.message);
    }
    return result;
  },

/////
//2. Find methods

    // Find a transaction
    findTransaction (transactionId) {
      if(!Roles.userIsInRole(this.userId, 'admin')){
        throw new Meteor.Error('Not authorized');
      }
        var findTransactionSynchronously = Meteor.wrapAsync(gateway.transaction.find, gateway.transaction),
            transaction;

        try {
            transaction = findTransactionSynchronously(transactionId);
        } catch (e) {
            throw new Meteor.Error(e.name, e.message);
        }
        return transaction;
    },

    // Lookup a customer in the braintree vault
    findCustomer (customerId) {
        check(customerId, String);
        var findSynchronously = Meteor.wrapAsync(gateway.customer.find, gateway.customer);

        try { customer = findSynchronously(customerId); } catch (e) {
            throw new Meteor.Error(e.name, e.message);
        }

        return customer;
    },

    getClientToken (tokenOptions) {
        var generateTokenSynchronously = Meteor.wrapAsync(gateway.clientToken.generate, gateway.clientToken),
            options = {},
            result = null;

        if (tokenOptions && tokenOptions.customerId)
            options.customerId = tokenOptions.customerId;

        try {
            result = generateTokenSynchronously(options);
        } catch (e) {
            throw new Meteor.Error(e.name, e.message);
        }
        return result.clientToken;
    },

//4. Unused Methods
    // Release from escrow
    releaseFromEscrow (transactionId) {
        var releaseFromEscrowSynchronously = Meteor.wrapAsync(gateway.transaction.releaseFromEscrow, gateway.transaction),
            result;

        try {
            result = releaseFromEscrowSynchronously(transactionId);
        } catch (e) {
            throw new Meteor.Error(e.name, e.message);
        }
        return result;
    },

    // Delete a customer from the braintree vault
    deleteCustomer (customerId) {

        check(customerId, String);
        var deleteSynchronously = Meteor.wrapAsync(gateway.customer.delete, gateway.customer),
            result = null;

        try {
            result = deleteSynchronously(customerId);
        } catch (e) {
            throw new Meteor.Error(e.name, e.message);
        }
        return;
    },

    submitMealForSettlement(mealPlan, nonce){
      var createMealTransactionSynchronously = Meteor.wrapAsync(gateway.transaction.sale, gateway.transaction);
      var result = createMealTransactionSynchronously({
        amount: calc.meal.platformRevenue(mealPlan.meals, mealPlan.deliveries),
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
     // transaction details are in result.transaction

    },

    submitDeliveriesForSettlement(deliveryCount, nonce) {
      var createDeliveryTransactionSynchronously = Meteor.wrapAsync(gateway.transaction.sale, gateway.transaction);

      var price = deliveryCount * 4;

      var result =  createDeliveryTransactionSynchronously({
        amount: price,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true
        }
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
        Invoices.insertDeliveryInvoice(
          deliveryCount, result, 'delivery_credits', (err, res) => {
          if(err) { throw new Meteor.Error(err.message); }
        });
        return result;
      }
    }
});

BT = {
  transactions: {
    generateParams(txId, paymentMethodNonce) {
      const tx = transactions.findOne({_id: txId});
      const bizProf = businessProfiles.findOne(tx.sellerId);
      const btAmount = calc._roundToTwo(tx.payRef.platformRevenue).toString(); check(btAmount, String);
      if(calc._checkDecimalPlace(btAmount) > 2) { throw new Meteor.Error(404, 'params.btAmount.btPriceParamInvalid'); }
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
  },
  admin: {
    emails: {
      disbursement (merchAcct){
        Email.send({
          from: 'info@tryhabitat.com',
          to: 'info@tryhabitat.com', //props.company_email
          subject: 'Disbursement Occured',
          text: JSON.stringify(merchAcct, null, 2),
        });
      },
    }
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
