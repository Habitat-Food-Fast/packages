tx = id => { return transactions.findOne(id); }

Meteor.methods({
  resolveAlert(id) {
    if (Meteor.user() && Meteor.user().roles.includes('admin')) {
      Alerts.update(id, {$set: {resolved: true, resolvedAt: new Date(), resolvedBy: `${Meteor.user().profile.fn} ${Meteor.userId()}`}});
    }
  },
  vendorRequestCall(msg) {
    const obj = {
      type: 'danger',
      opened: new Date(),
      message: `${businessProfiles.findOne(Meteor.user().profile.businesses[0]).company_name} has requested a call`,
      details: {
        text: msg ? msg : null,
        contact: Meteor.user().profile.phone
      }
    }
    return Alerts.insert(obj);
  }
});

Alerts.methods = {
  resolve(id) {
    Alerts.update(id, {$set: {resolved: true, resolvedAt: new Date()}});
  },
  dropoffNow(txId) {
    if (!Alerts.findOne({message: `Order ${tx.orderNumber} should be dropped`})) {
      const obj = {
        type: 'warning',
        txId: txId,
        message: `Order ${tx.orderNumber} should be dropped`,
        opened: new Date(),
        details: {
          text: `${tx.runnerObj ? tx.runnerObj.name : 'No runner'}`,
          contact: `${tx.runnerObj ? tx.runnerObj.phone : null}`
        }
      }
      return Alerts.insert(obj);
    }
  },
  newParsed(emailId){

  },
  needsAssign(txId) {
    const tx = transactions.findOne(txId);
    const obj = {
      type: 'danger',
      txId: txId,
      message: `Order ${tx.orderNumber} needs a runner`,
      opened: new Date(),
      details: {
        text: `${tx.company_name}`
      }
    }
    return Alerts.insert(obj);
  },
  runnerAccepted(id) {
    const obj = {
      type: 'success',
      txId: id,
      message: `${tx(id).runnerObj.name} self-assigned to ${tx(id).orderNumber}`,
      opened: new Date(),
      details: {
        text: `${tx(id).runnerObj.phone}`
      }
    }
    return Alerts.insert(obj);
  },
  runnerDrop(id) {
    const obj = {
      type: 'success',
      txId: id,
      message: `${tx(id).runnerObj.name} dropped ${tx(id).orderNumber}`,
      opened: new Date(),
      details: {
        text: `${tx(id).runnerObj.phone}`
      }
    }
    return Alerts.insert(obj);
  },
  runnerPickup(id) {
    const obj = {
      type: 'success',
      txId: id,
      message: `${tx(id).runnerObj.name} picked up ${tx(id).orderNumber}`,
      opened: new Date()
    };
    if (!Alerts.findOne({txId: obj.txId, message: obj.message})) {
      return Alerts.insert(obj);
    }
  },
  runnerText(runnerId, message) {
    usr = Meteor.users.findOne(runnerId);
    return Alerts.insert({
      type: 'warning',
      message: `${usr.profile.fn} texted back ${message}`,
      opened: new Date(),
      details: {
        text: `${usr.profile.fn}`
      }
    });
  },
  apiError(obj) {
    obj.type = 'danger';
  },
  warnScheduled(tx, req) {
    const del = new Date(tx.deliverBy);
    const obj = {
      type: 'danger',
      txId: tx._id,
      opened: new Date(),
      noOpen: true,
      message: `Scheduled order #${tx.orderNumber} ${req ? 'requested' : 'due soon'}  for ${tx.company_name}`,
      details: {
        text: `DELIVERY TIME: ${req ? moment(del).tz('America/New_York').format('h:mm a, M[/]D') : moment(del).tz('America/New_York').format('h:mm A')}`
      }
    };
    return Alerts.insert(obj);
  }
}
