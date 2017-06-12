tx = id => { return transactions.findOne(id); }

Meteor.methods({
  insertTest() {
    Alerts.insert({
      type: 'warning',
      message: 'Call Sangkee Noodle House',
      opened: new Date(),
      details: {
        text: '(443)797-3028'
      }
    });

  },
  resolveAlert(id) {
    if (Meteor.user() && Meteor.user().roles.includes('admin')) {
      Alerts.update(id, {$set: {resolved: true, resolvedAt: new Date, resolvedBy: `${Meteor.user().profile.fn} ${Meteor.userId()}`}});
    }
  }
});

Alerts.methods = {
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
    }
    return Alerts.insert(obj);
  }
}
