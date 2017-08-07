import { _ } from 'underscore';
import convert from 'json-2-csv';
const convertSync = Meteor.wrapAsync(convert.json2csv);
import moment from 'moment';

if (Meteor.isServer) {
  Twilio = require('twilio');
  twilio = new Twilio(Meteor.settings.twilio.pub, Meteor.settings.twilio.priv);
}


runner = {
  getAvailableOrders(hab){ return transactions.find({habitat: hab, status: 'pending_runner'}).fetch(); },
  runnerText(txId) { return `Open at ${moment().subtract({hours: 4}).format('hh:mm:ss a')}: \n ${this.generateOrderList(txId)}` + '\n To accept, text back the order number. To dropoff, text back the order number again'; },
  getTimeTillDropoff(time){ return moment(time).from(moment(Date.now())); },
  updateDropoffInfo(txId, callback) {
    const t = transactions.findOne(txId);
    const dropoffInMs = t.deliveredAtEst - Date.now();
    const dropoffInString = this.getTimeTillDropoff(t.deliveredAtEst);
    const pickupInString = this.getTimeTillDropoff(moment(t.pickupAtEst).add(4, 'hours').format());

    const update = { $set: { pickupInString, dropoffInString, dropoffInMs }};
    return transactions.update(t._id, update, callback);
  },
  watchPendingOrders () {
    Habitats.find().forEach((h) => {
      transactions.find({
        status: {$in: ['pending_vendor', 'pending_runner', 'in_progress']},
        habitat: h._id}, {sort: {deliveredAtEst: -1}
      }).forEach((t) => {
        if(typeof t.deliveredAtEst !== 'number') { console.warn(`order # ${t.orderNumber} deliveredAtEst is ${t.deliveredAtEst}`); }
          this.updateDropoffInfo(t._id, (err) => { if(err) { console.warn(err.message); }});
      });
    });
  },
  getRole(role, habitat){ return role === 'runner' ? habitat.staffJoyRunnerRole : habitat.staffJoyDispatchRole; },
  getHours(start, end, habitat) {
    start = moment(Habitats.openedAtToday(habitat._id)) .subtract(Meteor.settings.devMode ? 4 : 0, 'hours') .toISOString() || start;
    end = moment(Habitats.closedAtToday(habitat._id)) .subtract(Meteor.settings.devMode ? 4 : 0, 'hours') .toISOString() || end;
    return { start, end };
  },
  _shifts(start, end, habitat, role){
    const params = {
      auth: staffJoy._auth,
      params: {
        start: this.getHours(start, end, habitat).start,
        end: this.getHours(start, end, habitat).end,
        include_summary: true,
      }
    };
    const res = HTTP.call(`GET`, staffJoy._getUrl(`locations/${habitat.staffJoyId}/roles/${role}/shifts`), params);
    return res.data.data;
  },
  create(habitatId, email, name, internal_id){
      const habitat = Habitats.findOne(habitatId);
      try {
          const url = staffJoy._getUrl(`locations/${habitat.staffJoyId}/roles/${habitat.staffJoyRunnerRole}/users/`);
          const params = { auth: staffJoy._auth, params: {
            min_hours_per_workweek: 0,
            max_hours_per_workweek: 60,
            name, email, internal_id,
          }};
          const data = HTTP.call(`POST`, url, params);
          console.log(data.data);
          Meteor.users.update(internal_id, {$set: {'profile.staffjoyId': data.data.id}})
          return data.data;
      } catch (e) {
        console.warn(`error CREATING data ${e}`);
      }

  },
  getShifts(start, end, habitats, roleName) {
        habitats = !habitats ? staffJoy.allHabitats().map(h => h._id) : habitats;
        let shifts = habitats.map((id) => {
          const habitat = Habitats.findOne(id);
          const role = this.getRole(roleName, habitat);
          try {
            s = this._shifts(start, end, habitat, role);
            return s.map((shift) => {
              try {
                if(shift.user_id !== 0){
                  newUrl = staffJoy._getUrl(`locations/${habitat.staffJoyId}/roles/${role}/users/${shift.user_id}`);
                  const userShift = HTTP.call(`GET`, newUrl, { auth: staffJoy._auth, params: {user_id: shift.user_id} });
                  const workerId = userShift.data.data.internal_id;
                  const usr = Meteor.users.findOne(workerId ? workerId : {username: userShift.data.data.email});
                  return {
                    shift: shift,
                    staffJoyUser: userShift.data.data,
                    user: usr,
                    location: usr && usr.location ? usr.location : '',
                  };
                }
              } catch (e) {
                console.warn(`error geting usershift data ${e.message}`);
              }
            });
          } catch(e) {
            console.warn( "Cannot get shift data..." + e.message);
          }
        });
        const parsedShifts = _.compact(_.flatten(shifts));
        return parsedShifts;
    },
  getShifted(start, end, habitats, roleName) {
    habitats = !habitats ? staffJoy.allHabitats().map(h => h._id) : habitats;
      return this.getShifts(start, end, habitats, roleName).filter((shift) => {
        return !shift || !shift.shift ? {} :
          moment(Date.now()).subtract(Meteor.settings.devMode ? 4 : 0, 'hours').isBetween(
            moment(new Date(shift.shift.start)).subtract(Meteor.settings.devMode ? 4 : 0, 'hours'),
            moment(new Date(shift.shift.stop)).subtract(Meteor.settings.devMode ? 4 : 0, 'hours')
        );
      });
  },
  generateOrderList(txId) {
    const hab = transactions.findOne(txId).habitat;
    return this.getAvailableOrders(hab).reduce((sum, tx) => { return sum + `${tx.company_name} ${tx.orderNumber}: to ${tx.deliveryAddress} ${moment(tx.deliveredAtEst).fromNow(true)}` + '\n'; }, '');
  },
  parseable(tx, orderNumber) {
    return tx && runner.getAvailableOrders(tx.habitat).map(t => t.orderNumber).includes(orderNumber) ||
           tx && tx.status.includes('in_progress') ||
           tx && tx.status.includes('completed');
  },
  assign(req, orderNumber, runnerId){
    return transactions.methods.assignRunner.call({ orderNumber, runnerId, adminAssign: false }, (err, res) => {
      if (err) { console.warn(err.message); } else {
        xml = `<Response><Sms>${runner.runnerText(thisTx._id)}</Sms></Response>`;
        req.response.writeHead(200, {'Content-Type': 'text/xml'});
        return req.response.end(xml);
      }
    });
  },
  dropoff(req, tx, userId, tip){
    if(tx.runnerId !== userId){
      if(req.response){
        xml = `<Response><Sms>Order #${tx.orderNumber} is already accepted. </Sms></Response>`;
        req.response.writeHead(200, {'Content-Type': 'text/xml'});
        return req.response.end(xml);
      } else { throwError(err.message); }

    } else {
      transactions.methods.confirmDropoff.call({
        txId: tx._id,
        isAdmin: false,
      }, (err) => { if(err) {console.warn(err.message);} else {
        if(req.response){
          xml = `<Response><Sms>Order #${tx.orderNumber} dropped off. </Sms></Response>`;
          req.response.writeHead(200, {'Content-Type': 'text/xml'});
          return req.response.end(xml);
        } else { throwError(err.message); }
      }});
    }
  },
  sendReceipt(req, tx, orderNumber, image, runnerId, tip, textResponse) {
    if(!image) {
      return this.invalidResponse(req, `To complete the order and declare the tip, attach the image to a text message and respond ORDER#TIP. Example: 12345#0`);
    } else if(tx.DaaS && (tx.DaaSType === 'credit_card' || tx.DaaSType === 'online') && textResponse && !textResponse.includes('#')) {
      return this.invalidResponse(req, `To complete the order and declare the tip, attach the image to a text message and respond ORDER#TIP. Example: 12345#0`);
    } else {
      transactions.update(tx._id, {$set: {
          receiptPicture: image,
          'payRef.tip': parseFloat(tip),
        }}, (err) => {
        if(err) { this.invalidResponse(req, `Error updating image on order`); } else {
          this.dropoff(req, tx, runnerId, tip);
          const bp = businessProfiles.findOne(tx.sellerId);
          bpEmail = Meteor.users.findOne(bp.uid).username;
          Email.send({
            from: "info@tryhabitat.com",
            to: `${bpEmail}, mike@tryhabitat.com`,
            subject: `Order #${orderNumber} reciept`,
            text: image,
            html: `
            Hi ${bp.company_name}, <br><br>
            To view the receipt for order number ${orderNumber}, go to
            <a href=${image}>this link</a>.

            If there are any problems or discrepancies,
            contact support at 215-399-0313. <br> <br> Thanks, <br> <br> The Habitat Team
            `
          });
        }
      });
    }
  },
  invalidResponse(req, message){
    xml = `<Response><Sms>Sorry, invalid response. ${message}. To contact support, call (215)-399-0313.</Sms></Response>`;
    req.response.writeHead(200, {'Content-Type': 'text/xml'});
    return req.response.end(xml);
  },

generateOrderInfo(tx) {
  const bizProf = businessProfiles.findOne(tx.DaaS ? tx.buyerId : tx.sellerId);
  const userProf = Meteor.users.findOne(tx.buyerId);
  deliveryInstructions = tx.deliveryInstructions ? `(${tx.deliveryInstructions})` : '';

  let msg;
  const pck = tx.prepTime ? moment((Date.now() + (tx.prepTime * 60000)) - 14400000).format('LT') : 'ASAP';
  const deliverAt = moment(tx.deliverBy ? tx.deliverBy : tx.deliveredAtEst).format('h:mm a');
  if(tx.DaaS){
    customerName = tx.customerName || tx.customer.name|| 'unknown';
    customerPhone = tx.customerPhone || tx.customer.phone || 'unknown';
    msg = `Order #${tx.orderNumber} assigned.
READY AT: ${pck}
DELIVER BY: ${deliverAt}
PAYMENT: ${(tx.DaaSType === 'online' || tx.DaaSType === 'credit_card') ? 'Conf drop w/ tip + pic' : tx.DaaSType}
VENDOR: ${tx.company_name} ${bizProf.company_phone}
ADDR: ${bizProf.company_address}
CUSTOMER: ${customerName}
PHONE: ${customerPhone}
ADDR: ${tx.deliveryAddress}. ${deliveryInstructions} `;
  } else {
msg = `Order # ${tx.orderNumber} assigned.
READY AT: ${pck}
PAYMENT: Habitat
VENDOR: ${tx.company_name} ${bizProf.company_phone}
ADDR: ${bizProf.company_address}
CUSTOMER: ${userProf.profile.fn}
PHONE: ${userProf.profile.phone}
ADDR: ${tx.deliveryAddress} ${deliveryInstructions}

VENDOR RECEIPT: ${tx.textMessage}`;
    }
    return msg;
  },
};

Meteor.methods({
sendRunnerPing(txId, runnerId){
  if (Meteor.isServer) {
    const tx = transactions.findOne(txId);
    return twilio.messages.create({
        to: Meteor.users.findOne(runnerId).profile.phone,
        from: Meteor.settings.twilio.twilioPhone,
        body: runner.generateOrderInfo(tx, Meteor.users.findOne(runnerId)),
      }, (err, responseData) => {
          if (!err) { console.log(responseData.body); } else {
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
  retireRunner(runnerId){
    const usr = Meteor.users.findOne(runnerId);
    if(usr && usr.roles.includes('admin')){
      tx = transactions.findOne({runnerId}, {sort: {timeRequested: -1}});
      Meteor.users.update(runnerId, {$set: {
        retired: {
          at: new Date(),
          lastOrder: tx ? tx.humanTimeRequested : false,
          reason: '',
        },
        'profile.staffjoyId': false,
      }}, (err) => {
        if(err) { console.warn(err.message); }
      });
    }
  }
});

staffJoy = {
  //private
  _auth: "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6Niwia2V5IjoiMWRjOGFjNTg5M2VjNTA1OWQwNjU0OGI2ZDExOTQwZjM1ZjkwMTQ4MCJ9.A6ju9vli32kO9V1LoU2QVMkae2hK83E818xCScmVVH4:Mpasz1992",
  _orgId: 1, //habitat's orgId,
  _baseUrl(){ return `http://staffing.tryhabitat.com/api/v2`; },
  _orgQuery(){ return `/organizations/${this._orgId}`; },
  _baseRequest(){ return this._baseUrl() + this._orgQuery(); },
  _getUrl(query){ return !query ? this._baseRequest() : this._baseRequest() + `/${query}`; },
  allHabitats() { return Habitats.find().map(h => ({_id: h._id, staffJoyId: h.staffJoyId, name: h.name})); },
  getWorkers(workers){
    res = workers.map((worker) => {
      return _.extend(worker, { userId: Meteor.users.findOne({username: worker.email}) ? true : false });
    });
    // .filter(w => Meteor.users.findOne({username: w.email}) ? true : false);
    return res;
  },
  all(){
    habs =  Habitats.find().map((h) => {
      try {
        const res = HTTP.call(`GET`, staffJoy._getUrl(`locations/${h.staffJoyId}/roles/${h.staffJoyRunnerRole}/users`), {
          auth: this._auth,
        });
        const data = res.data.data;
        return data;
      } catch (err) {
        console.warn(err);
        throwError(err)
      }
    });

    return _.compact(_.uniq(_.flatten(habs), usr => usr.internal_id).map((u) => {
      if(!u.internal_id){ console.warn(`no internal id for ${u.email}`); return; } else {
        if(!Meteor.users.findOne(u.internal_id)){
          console.warn(`no METEOR user for ${u.name}`);
          return u.id;
        } else {
          return u;
        }
      }
    }))
  }
};

runnerPayout = {
  _perOrderRate: 1.5,
  _hourlyRate: 4,
  getOrders(runnerId, timespan, status=transactions.completedAndArchived()) {
    query = {
      method: 'Delivery', status: {$in: status }, runnerId: runnerId,
    };
    const txs = transactions.find(query).fetch();

    start = timespan.startTime || timespan.start;
    end = timespan.endTime || timespan.end;
    after = txs.filter(t =>
      t.timeRequested > new Date(start).getTime() &&
      t.timeRequested < new Date(end).getTime()
    );

    return after;
  },
  //maps through all shifts in a timespan, summing hours for each userId
  getAllShifts(shifts){
    return shifts.map((shift) => {
      check(shift.stop, String);
      check(shift.start, String);
      stop = new Date(moment(shift.stop).format()).getTime();
      start = new Date( moment(shift.start).format()).getTime();

      return _.extend(shift, { user_id: shift.user_id, hours: ((stop - start) / (1000*60*60)%24), });
    });
  },
  getBaseHours(shifts, runnerId) {
    const runner = Meteor.users.findOne(runnerId);

    return this.getAllShifts(shifts)
      .filter((shift) => {
        check(shift.user_id, Number);
        check(runnerId, String);
        return shift.user_id === runnerId;
      })
      .map((shift) => {
        check(shift.hours, Number);
        return shift.hours;
      })
      .reduce((sum, num) => { return sum + num; }, 0);
  },
  perOrderRate(runnerId, timespan){
    check(runnerId, String);
    return this.getOrders(runnerId, timespan).length * this._perOrderRate;
  },
  workedLessThanOne(shifts, timespan, runnerId){
    check(runnerId, String);
    lto = this.getOrders(runnerId, timespan).length > 0 &&
           this.getTotalHours(shifts, timespan, runnerId) === 0;
    return lto;
  },
  getTotalHours(shifts, timespan, runnerId){
    totalHours = this.getBaseHours(shifts, runnerId);
    check(shifts, Array); check(runnerId, String); check(runnerId, String);

    return totalHours;
  },
  getTotalHourlyOwed(shifts, timespan, runnerId){
    check(runnerId, String);
    return this.getTotalHours(shifts, timespan, runnerId) * this._hourlyRate;
  },
  getTotalTips(runnerId, timespan){
    return this.getOrders(runnerId, timespan)
      .map(t => t.payRef.tip || 0)
      .reduce((sum, num) => { return sum + num; }, 0);
  },
  getTotalOwed(shifts, timespan, runnerId){
    check(runnerId, String);
    hourly = this.getTotalHourlyOwed(shifts, timespan, runnerId);
    perOrder = this.perOrderRate(runnerId, timespan);
    tipTotal = this.getTotalTips(runnerId, timespan);
    owed = hourly + perOrder+ tipTotal;
      return owed;
    },
  filterInactive(worker){ return worker.transactionCount === 0 || worker.daasCount === 0; },
  // getRunnerPayout(worker, shifts, timespan){
  //   console.log(timespan);
  //   console.log(`getRunnerPayout start ${timespan.startTime}`)
  //   const runnerId = Meteor.users.findOne({username: worker.email})._id;
  //   return _.extend(worker, {
  //     runnerId: runnerId,
  //     start: timespan.startTime,
  //     end: timespan.endTime,
  //     hoursWorked: this.getTotalHours(shifts, timespan, runnerId),
  //     transactionCount: this.getOrders(runnerId, timespan).length,
  //     daasCount: this.getOrders(runnerId, timespan).filter(t => t.DaaS).length,
  //     hourlyRate: this._hourlyRate,
  //     owedHourTotal: accounting.formatMoney(this.getTotalHours(shifts, timespan, runnerId) * this._hourlyRate),
  //     owedDeliveryFee: accounting.formatMoney(this._perOrderRate),
  //     owedTips: accounting.formatMoney(runner.getTotalTips(runnerId, timespan)),
  //     runnerOwed: accounting.formatMoney(this.getTotalOwed(shifts, timespan, runnerId)),
  //   });
  // },
  // sort(payout){ return _.sortBy(payout, 'hoursWorked').reverse(); },
  // payout(workers, shifts, timespan){
  //
  //   const payout = this.sort(
  //     staffJoy.getWorkers(workers).map(worker => this.getRunnerPayout(worker, shifts, timespan))
  //     // .filter(worker => this.filterInactive(worker))
  //   );
  //
  //   return payout;
  // }
};

runner.payouts = {
  //staffjoy doens't have a query for ALL users,
  //so have to query per habitat,
  //concatenate the the habitat runner arrays,
  //and parse out duplicates (i.e runners who work in multiple habitats)
  getWorkers(habitats=Habitats.find()) {
    return _.uniq(_.flatten(habitats.map(h =>
      HTTP.call(`GET`,
        staffJoy._getUrl(`locations/${h.staffJoyId}/roles/${h.staffJoyRunnerRole}/users`),
        { auth: staffJoy._auth }
      ).data.data)), w => w.id);
      // .filter(w => !w.archived);
  },
  //again need to flatten out habitat arrays, but don't need uniq because all shifts are distinct
  getWeekShifts(week, staffJoyId, habitats=Habitats.find()){
    const weeks = _.flatten(habitats.map(h =>
      HTTP.call(`GET`, staffJoy._getUrl(`locations/${h.staffJoyId}/roles/${h.staffJoyRunnerRole}/shifts`), {
        auth: staffJoy._auth,
        params: {
          start: moment(week.startTime).toISOString(),
          end: moment(week.endTime).toISOString(),
          include_summary: true,
          user_id: staffJoyId,
        }
      }).data.data)); console.log(weeks);
    return weeks;
  },
  getShiftHours(week, staffJoyId) {
    weekHours = runner.payouts.getWeekShifts(week, staffJoyId).map(shift => ({
      user_id: shift.user_id,
      hours: ((
        new Date(moment(shift.stop).format()).getTime() -
        new Date(moment(shift.start).format()).getTime()) /
        (1000*60*60)%24
      ),
    })); console.log(weekHours);
    return weekHours;
  },
  runnerTransactions(week, runnerId){
    txs = transactions.find({
      method: 'Delivery',
      status: { $in: transactions.completedAndArchived() },
      runnerId: runnerId,
    }).fetch();

    txsFiltered = txs.filter(t =>
      t.timeRequested > new Date(week.startTime).getTime() &&
      t.timeRequested < new Date(week.endTime).getTime()
    );

    return txsFiltered;
  },
  _baseHoursWorked(allShifts, staffJoyId){
    return allShifts
      .filter(shift=>  shift.user_id === staffJoyId)
      .map(shift => shift.hours)
      .reduce((sum, num) => { return sum + num; }, 0);
  },
  _totalHoursWorked(runnerTxs, allShifts, staffJoyId){
    return runnerTxs.length > 0 && this._baseHoursWorked(allShifts, staffJoyId) === 0 ? 1 : this._baseHoursWorked(allShifts, staffJoyId);
  },
  _tips(runnerTxs){
    return runnerTxs.map(t => t.payRef.tip || 0).reduce((sum, num) => { return sum + num; }, 0);
  },
  _perTxKeep(runnerTxs){
    return runnerTxs
    .filter(t => !t.catering)
    .length * 1.5;
  },
  _onDemandOwed(runnerTxs){
    return runnerTxs
      .filter(t => t.runnerPayRef && t.runnerPayRef.onDemand)
      .map(t => t.runnerPayRef.onDemandRate)
      .reduce((sum, num) => { return sum + num; }, 0);
  },
  _catering(runnerTxs){
    return runnerTxs
      .filter(t => t.catering)
      .map(t => t.vendorPayRef.totalPrice)
      .reduce((sum, num) => { return sum + num; }, 0) * 0.4;
  },
  _totalOwed(runnerTxs, allShifts, staffJoyId){
    hourlyRate = (this._totalHoursWorked(runnerTxs, allShifts, staffJoyId) * 4);
    perTxKeep = this._perTxKeep(runnerTxs);
    onDemandOwed = this._onDemandOwed(runnerTxs);
    tips = this._tips(runnerTxs);
    total = hourlyRate + perTxKeep + onDemandOwed + tips;
    return total;
  },
  _progress(token, progress) { streamer.emit(token, progress); },
  payRef(worker, allShifts, runnerTxs, runnerId, week){
    wk = weeks.findOne({week: week});
    console.log(worker.email);
    query = _.extend(worker, {
      week: wk.week,
      hoursWorked: this._totalHoursWorked(runnerTxs, allShifts, worker.id),
      transactionCount: runnerTxs.length,
      start: wk.startTime,
      end: wk.endTime,
      templeCount: runnerTxs.filter(t => t.habitat === 'g77XEv8LqxJKjTT8k').length,
      ucCount: runnerTxs.filter(t => t.habitat === 'zfY5SkgFSjXcjXbgW').length,
      daasCount: runnerTxs.filter(t => t.DaaS).length,
      cateringCount: runnerTxs.filter(t => t.catering).length,
      onDemand: runnerTxs.filter(t => t.runnerPayRef && t.runnerPayRef.onDemand).length,
      runnerHourlyRate: accounting.formatMoney(4),
      owedOnDemandTotal: this._onDemandOwed(runnerTxs),
      owedHourTotal: accounting.formatMoney(this._totalHoursWorked(runnerTxs, allShifts, worker.id) * 4),
      owedDeliveryFee: accounting.formatMoney(this._perTxKeep(runnerTxs)),
      owedTips: accounting.formatMoney(this._tips(runnerTxs)),
      owedCatering: accounting.formatMoney(this._catering(runnerTxs)),
      runnerOwed: this._totalOwed(runnerTxs, allShifts, worker.id),
    });
    return query;
  },
  getAll(week, token){
    workers = runner.payouts.getWorkers();
    return workers.map((worker, index) => {
      progress = index / workers.length;
      this._progress(token, progress);
      console.log(worker.email, 'staffjoy email')
      const runnerUser = Meteor.users.findOne({ $or: [
        {username: worker.email},
        {_id: worker.internal_id},
      ]});

      if(runnerUser){
        console.log(runnerUser.profile.email)
        const runnerTxs = runner.payouts.runnerTransactions(week, runnerUser._id);
        const allShifts = runner.payouts.getShiftHours(week, worker.id);
        return runner.payouts.payRef(worker, allShifts, runnerTxs, runnerUser._id, week.week);
      } else {
        console.warn(`not found for`, worker.email, worker.internal_id);
      }
    }).filter(doc => doc && doc.transactionCount > 0 || doc &&  doc.daasCount > 0);
  }
};

Meteor.methods({
   getRunnerWeek(weekId, weekNum, token) {
     if(Meteor.isServer){
       try {
         return HTTP.get(`${Meteor.absoluteUrl()}staffjoy/weekTotals/${weekId}/${weekNum}/${token}`);
       } catch (err) {
         console.warn(err.message, err.stack);
       }
     }
   }
});

Router.route('/allweeks', {
  where: 'server',
  action() {
    const allPayouts = _.flatten(weeks.find({week: {$lte: 10}}, { sort: {week: 1}}).map(w => runner.payouts.getAll(w)));
    try {
      return convert.json2csv(allPayouts, (err, spreadsheet) => {
        if(err) { console.warn(err.message); } else {
          this.response.writeHead(200, csv.writeHead(`runner_summary_week-`, 'csv'));
          this.response.end(spreadsheet);
        }
      }, csv.settings);

    } catch (err) {
      console.warn(err.message, err.stack);
    }
  }
});
