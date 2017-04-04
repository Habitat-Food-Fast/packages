import phoneFormatter from 'phone-formatter';
// import crypto from 'crypto';
import convert from 'json-2-csv';

if (Meteor.isServer) {
  Twilio = require('twilio');
  twilio = new Twilio(Meteor.settings.twilio.pub, Meteor.settings.twilio.priv);
  console.log(twilio);
}


runner = {
  getAvailableOrders(hab){ return transactions.find({habitat: hab, status: 'pending_runner'}).fetch(); },
  runnerText(txId) { return `Open orders on Habitat: \n ${this.generateOrderList(txId)}` + '\n To accept, text back the order number. To dropoff, text back the order number again'; },
  getTimeTillDropoff(time){ return moment(time).from(moment(Date.now())); },
  updateDropoffInfo(t, callback) {
    const dropoffInMs = t.deliveredAtEst - Date.now();
    const dropoffInString = this.getTimeTillDropoff(t.deliveredAtEst);
    return transactions.update(t._id, { $set: { dropoffInString, dropoffInMs }}, callback);
  },
  watchPendingOrders () {
    Habitats.find().forEach((h) => {
      transactions.find({
        status: {$in: ['pending_runner', 'in_progress']},
        habitat: h._id}, {sort: {deliveredAtEst: -1}
      }).forEach((t) => {
        if(typeof t.deliveredAtEst !== 'number') { console.warn(`order # ${t.orderNumber} deliveredAtEst is ${t.deliveredAtEst}`); }
          this.updateDropoffInfo(t, (err) => { if(err) { console.warn(err.message); }});
      });
    });
  },
  getShifted() {
    return staffJoy.getShifts().filter((shift) => {
      return !shift || !shift.shift ? {} :
        moment(Date.now()).isBetween(
          moment(new Date(shift.shift.start)),
          moment(new Date(shift.shift.stop))
      );
    });
  },
  alertShifted(txId, habId){
    runner.getShifted(habId).filter(runner => runner.user.profile.runHabitats.includes(habId)).forEach((runner) => {
      twilio.messages.create({
        to: runner.profile.phone,
        from: Meteor.settings.twilio.twilioPhone,
        body: this.runnerText(txId),
      }, (err, responseData) => {
          if (!err) {
            return responseData.success;
          } else {
            console.log(err.message);
          }
        }
      );
    });
  },
  generateOrderList(txId) {
    const hab = transactions.findOne(txId).habitat;
    return this.getAvailableOrders(hab).reduce((sum, tx) => { return sum + `${tx.company_name} ${tx.orderNumber}: due ${moment(tx.deliveredAtEst).fromNow(true)}` + '\n'; }, '');
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
        tip: tip,
      }, (err) => { if(err) {console.warn(err.message);} else {
        if(transactions.find({status: 'pending_runner'}).count()){ this.alertShifted(tx._id, tx.habitat); }
        if(req.response){
          xml = `<Response><Sms>Order #${tx.orderNumber} dropped off. </Sms></Response>`;
          req.response.writeHead(200, {'Content-Type': 'text/xml'});
          return req.response.end(xml);
        } else { throwError(err.message); }
      }});
    }
  },
  sendReceipt(req, tx, orderNumber, image, runnerId, tip) {
    if(!image) { return this.invalidResponse(req, `Must include receipt image to drop off`); } else {
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

generateOrderInfo(tx, runner) {
  const bizProf = businessProfiles.findOne(tx.DaaS ? tx.buyerId : tx.sellerId);
  const userProf = Meteor.users.findOne(tx.buyerId);
  deliveryInstructions = tx.deliveryInstructions || '';
  let msg;

  if(tx.DaaS){
    customerName = tx.customerName || 'unknown';
    customerPhone = tx.customerPhone || 'unknown';
    msg = `Order #${tx.orderNumber} for ${runner.profile.fn} accepted, estimated pickup time is ${tx.prepTime} minutes.
VENDOR NAME: ${tx.company_name}
PHONE: ${bizProf.company_phone}
ADDR: ${bizProf.company_address}
CUSTOMER NAME: ${customerName}
PHONE: ${customerPhone}
ADDR: ${tx.deliveryAddress}. (${deliveryInstructions}) `;
  } else {
msg = `Order # ${tx.orderNumber} for ${runner.profile.fn}  accepted, estimated pickup time is ${bizProf.prep_time} minutes.
VENDOR NAME:  ${tx.company_name}
PHONE: ${bizProf.company_phone}
ADDR: ${bizProf.company_address} ${deliveryInstructions}
CUSTOMER NAME: ${userProf.profile.fn}
PHONE: ${userProf.profile.phone}
ADDR: ${tx.deliveryAddress}

VENDOR RECEIPT: ${tx.textMessage}`;
  }
  return msg;
},
};

Meteor.methods({
sendRunnerPing(txId, runnerId, initialPing){
  const tx = transactions.findOne(txId);
  return initialPing ? runner.alertShifted(tx._id, tx.habitat) :
    twilio.messages.create({
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
});

staffJoy = {
  //private
  _auth: "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6Niwia2V5IjoiMWRjOGFjNTg5M2VjNTA1OWQwNjU0OGI2ZDExOTQwZjM1ZjkwMTQ4MCJ9.A6ju9vli32kO9V1LoU2QVMkae2hK83E818xCScmVVH4:Mpasz1992",
  _orgId: 1, //habitat's orgId,
  _baseUrl(){ return `http://staffing.tryhabitat.com/api/v2`; },
  _orgQuery(){ return `/organizations/${this._orgId}`; },
  _baseRequest(){ return this._baseUrl() + this._orgQuery(); },
  _getUrl(query){
    url = !query ? this._baseRequest() : this._baseRequest() + `/${query}`;
    // validUrl.isHttpsUri();
    console.log(url);
    return url;

   },
  allHabitats() { return Habitats.find().map(h => ({_id: h._id, staffJoyId: h.staffJoyId, name: h.name})); },
  getWorkers(workers){
    res = workers.map((worker) => {
      return _.extend(worker, { userId: Meteor.users.findOne({username: worker.email}) ? true : false });
    });
    // .filter(w => Meteor.users.findOne({username: w.email}) ? true : false);
    return res;
  },
  //default to all habitats for tod
  getShifts (start, end, habitats=this.allHabitats()) {
      return _.flatten(habitats.map((id) => {
        const habitat = Habitats.findOne(id);
        start = moment(Habitats.openedAtToday(habitat._id)).subtract(Meteor.settings.devMode ? 0 : 5, 'hours').toISOString() || start; console.log(start);
        end = moment(Habitats.closedAtToday(habitat._id)).subtract(Meteor.settings.devMode ? 0 : 5, 'hours').toISOString() || end; console.log(end);
        try {
          return HTTP.call(`GET`,
            staffJoy._getUrl(`locations/${habitat.staffJoyId}/roles/${habitat.staffJoyRunnerRole}/shifts`),
            { auth: staffJoy._auth, params: { start: start, end: end, include_summary: true, } }
          ).data.data.map((shift) => {
            try {
              console.log(shift);
              newUrl = this._getUrl(`locations/${habitat.staffJoyId}/roles/${habitat.staffJoyRunnerRole}/users/${shift.user_id}`); console.log(newUrl);
              const userShift = HTTP.call(`GET`, newUrl, { auth: staffJoy._auth, params: {user_id: shift.user_id} });
              const workerId = userShift.data.data.internal_id;
              return {
                shift: shift,
                staffJoyUser: userShift.data.data,
                user: Meteor.users.findOne(workerId ? workerId : {username: userShift.data.data.email}),
              };
            } catch (e) { console.log(`error geting usershift data ${e.message}`); }
          });
        } catch(e) { console.log( "Cannot get shift data..." + e.message); }
      }));
  },
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
      console.log(shift);

      check(shift.stop, String);
      check(shift.start, String);
      console.log(shift.user_id); check(shift.user_id, Number);

      stop = new Date(moment(shift.stop).format()).getTime();
      start = new Date( moment(shift.start).format()).getTime();

      return _.extend(shift, { user_id: shift.user_id, hours: ((stop - start) / (1000*60*60)%24), });
    });
  },
  getBaseHours(shifts, runnerId) {
    const runner = Meteor.users.findOne(runnerId);

    return this.getAllShifts(shifts)
      .filter((shift) => {
        console.log(shift);

        check(shift.user_id, Number);
        check(runnerId, String);
        console.log(`shift.user_id ${shift.user_id} workerId ${runnerId}`);

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
    console.log(`worked less than one ${lto} for ${runnerId}`);
    return lto;
  },
  getTotalHours(shifts, timespan, runnerId){
    // totalHours = this.workedLessThanOne(shifts, timespan, runnerId) ? 1 : this.getBaseHours(shifts, runnerId);
    totalHours = this.getBaseHours(shifts, runnerId);
    check(shifts, Array); check(runnerId, String); check(runnerId, String);
    console.log(`totalhours for ${totalHours} ${runnerId}`);
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
    return this.getTotalHourlyOwed(shifts, timespan, runnerId)  +
           this.perOrderRate(runnerId, timespan) +
           this.getTotalTips(runnerId, timespan);
  },
  filterInactive(worker){ return worker.transactionCount === 0 || worker.daasCount === 0; },
  getRunnerPayout(worker, shifts, timespan){
    const runnerId = Meteor.users.findOne({username: worker.email})._id;
    return _.extend(worker, {
      runnerId: runnerId,
      hoursWorked: this.getTotalHours(shifts, timespan, runnerId),
      transactionCount: this.getOrders(runnerId, timespan).length,
      daasCount: this.getOrders(runnerId, timespan).filter(t => t.DaaS).length,
      hourlyRate: this._hourlyRate,
      owedHourTotal: accounting.formatMoney(this.getTotalHours(shifts, timespan, runnerId) * this._hourlyRate),
      owedDeliveryFee: accounting.formatMoney(this._perOrderRate),
      owedTips: accounting.formatMoney(runner.getTotalTips(runnerId, timespan)),
      runnerOwed: accounting.formatMoney(this.getTotalOwed(shifts, timespan, runnerId)),
    });
  },
  sort(payout){ return _.sortBy(payout, 'hoursWorked').reverse(); },
  payout(workers, shifts, timespan){

    const payout = this.sort(
      staffJoy.getWorkers(workers).map(worker => this.getRunnerPayout(worker, shifts, timespan))
      // .filter(worker => this.filterInactive(worker))
    );

    return payout;
  }
};

Meteor.methods({
  getShifts() {
    return Meteor.settings.devMode ? [
      {
        "shift": {
          "start": "2017-03-17T13:00:00",
          "user_id": 2719,
          "description": null,
          "published": true,
          "user_name": "miketest",
          "stop": "2017-03-17T21:00:00",
          "id": 149770,
          "role_id": 1439
        },
        "staffJoyUser": {
          "username": null,
          "phone_number": null,
          "confirmed": false,
          "working_hours": null,
          "name": "miketest",
          "internal_id": "HfpJwxTFfoeCpxxyn",
          "member_since": "2017-01-06T19:14:48",
          "sudo": false,
          "archived": false,
          "min_hours_per_workweek": 20,
          "email": "mike@p.com",
          "max_hours_per_workweek": 40,
          "active": false,
          "id": 2719,
          "last_seen": "2017-01-06T19:14:48"
        },
        "user": {
          "_id": "HfpJwxTFfoeCpxxyn",
          "createdAt": "2015-07-08T23:11:13.445Z",
          "username": "mike@tryhabitat.com",
          "services": {
            "password": {
              "bcrypt": "$2a$10$IL0F3HNrzLUhTy2.gh4rR.ubs1pbOXei9hZbOCceCo5Z3uKMZVyoS"
            },
            "resume": {
              "loginTokens": [
                {
                  "when": "2017-03-17T15:22:27.019Z",
                  "hashedToken": "jHfIx0BW5h+O3ik6Gvv/eViVRbkJiJnqrOxfZMyU1vg="
                }
              ]
            }
          },
          "emails": [
            {
              "address": "mike@tryhabitat.com",
              "verified": true
            }
          ],
          "profile": {
            "fn": "Mike",
            "profile_pic": "/images/runner_pics/runner_mike.png",
            "email": "mike@tryhabitat.com",
            "runHabitats": [
              "g77XEv8LqxJKjTT8k",
              "zfY5SkgFSjXcjXbgW"
            ],
            "transactions": [
              "oMpyCcJuBDGosvK2s",
              "4rAAcZXiFwYkAP7gP",
              "EkmWXEgqRQt2bGpen",
              "8xgaA5a95TGStRtLB",
              "Rupu5e66ccyM9tjg4",
              "udD8sffkTzsD3iKF5",
              "ACCu4GEGnN2wCrdDa",
              "dCGNNwXvvmr72iEgq",
              "EoLwwJ4AR3XcDzYxY",
              "MHRLN7g3TqysjKCvH",
              "En9CpXYRzomcsTJGi",
              "edc5d7NmD8wewhRoC",
              "6NtGkWfWdFuZGmcQK",
              "En7oN4mbsswguQFXa",
              "g5qkptanomNBh6q3N",
              "2H68AXenfeArHDZaP",
              "PjYSPGof2TcxbnyPX",
              "wKhfsGwgr4pS4awh8",
              "NAeLT2myBphrAZFL4",
              "Bbbb7EfvxNcL952Ra",
              "CTKYwf7q6WKeHafKT",
              "wwCHh7ggXAHHfY5Dr",
              "j7f7BEGCaxTqd5nhr",
              "JXhZPc8X6LEFG9DzR",
              "zhLxSH3QNwtcRisDK",
              "4xmvhLcZABuyaT6rZ",
              "QdFnvCNnSLh5JPX58",
              "xP7TMhMB5KFBFQvuf",
              "XNRyRAaD3aBrPj6zi",
              "m8Qmim3nhXKPSjjYp",
              "6i6bDptjHSPSABTs4",
              "tMLPjkgeXbjYDe7t8",
              "RJuy3bFaqZg3nNAkn",
              "D8wvYrYewTNwCnzEo",
              "TcjEGsSnzMdGjupGu",
              "CAYossMvz8QzAZkcX",
              "jTLPufSQkWtzhRa5p",
              "6bxmGkjxSxkKGrT7t",
              "N2ScqBZujbe466DQF",
              "gpieHJjqGDbNTah5H",
              "JqMa2eT6HF2tr6chM",
              "ZzsZJWuvGW2SiTAhf",
              "sJaH3RoXdvRyhNjcx",
              "G92xrpsBxg9fL2cn2",
              "fXwbcYSBDTAM6oy8d",
              "38Ws5Wgs8m6yDi7NK",
              "qxaQMK4NN5i7LwE9m",
              "b4nf3Jiy5oZMThk4y",
              "aFkZjcvuwNEBvx9Z3",
              "FBqzCLmCoAYr5D5rN",
              "tSTuqXskKWaWzcYby",
              "Wb95v6g2y9QGQEMdb",
              "vX6TaWSXDkaX4PokG",
              "rGYGdnLXurjqqtTvz",
              "9HWBm3moHQ9oetnvi",
              "pu6TroaNyqBD96vdr",
              "23LR3qNYhJoFXznhn",
              "97nbQps9j3buQyW7K",
              "sLAbkvm2Y4Xs7Cdo6",
              "oXFXetQNjKtscNXXQ",
              "RNqxiov2n7WekXXME",
              "mEz3ooHRoruR46kkh",
              "aJW6FHz6ybtPovi8B",
              "Jhd7r7XRkAZuMMMD3",
              "yBYH5HkX6Jn8qoqM4",
              "w5uN3nQJbkEN3S6kz",
              "NtGF3nucQRgpsdBib",
              "HmyLBtLdyRkLREjCD",
              "om5SqqRjTx5TKKkjG",
              "r8tQcfTsDQdjwTJvj",
              "2JdumZAXGzyheGqzL",
              "WasKmqG3DcBCioLNd",
              "4jaYitNeWKYegXLwD",
              "2T3jt7nssdFGxJNwE",
              "q6cZGf22JbL4STX4Z",
              "C2x5N7xEeZnNJAdAr",
              "C2x5N7xEeZnNJAdAr",
              "mL3JvmFiEnkiphuL9",
              "uTZCxMxDuyrqETWG2",
              "ApZsRofQTven8SeWv",
              "ez2wdmxkrtTrXpT8Q",
              "9MabNZQb977raQywn",
              "9MabNZQb977raQywn",
              "3s2QAuSu3QYQLaMfs",
              "bwfXjbZ5o7cAeXsNK",
              "yd9SkugRn5PAmgWE4",
              "RBNK5E6RSibgFto5H",
              "XwmAXvPEmn2Lw4guP",
              "XwBBHvna3MBPmxb3z",
              "fyM6dwZ67FTNuQZ7r",
              "y2p6vzNS8jTfDBCq3",
              "K2mKYPDZXzEGpKhhf",
              "4MErBKsNzrZzNBtvv",
              "ZWxaGrGuBn8pfW5RP",
              "ka9ZujqSuoodAkPm6",
              "4stHFZjii4b9Fctes",
              "oQ7p9sB3patR6Z7R3",
              "7quDdTEF8ZHpQW7XD",
              "fLJdzNn5omrn3wWHC",
              "gX63NCMy6Yv9gAABz",
              "6dtdccDSYHEfkLfnP",
              "Xd9ht8LKxwbmTTNDq",
              "CL58apqky8tTptQek",
              "fKs8waE4iuPC9DtuL",
              "9jjDg6tF4tc4pfREZ",
              "p7N6ZeRXNtPDMaL9N",
              "ana4e5T4AgwYfXg2d",
              "hxj6f6CaeeLMcXCGb",
              "CE9NwEYFPttCSdywJ",
              "i3CmvNJs523Y3RiSL",
              "n2zo767GxaebaAJyu",
              "MjsrS4ahHNZpzoA8e",
              "RbFk7bWo7toKgfFj6",
              "AKFddwz2P2ZEbTCq5",
              "nEobzwWJgm3NYyQMt",
              "SZ8JS8y9TdsNkZGAN",
              "TfR3wkLnxAis9KcQn",
              "5ekd8pX6vdeuj9W9r",
              "82sWxqBLAMBCh4ccY",
              "QheBQ4SXgN3JuursZ",
              "BAxFCmox7Nc4xnw9K",
              "S2cjLjxguQh4FgjYT",
              "T7bGA9sCP7KJGwgcd",
              "cdCMGR4egBY3WeZjN",
              "caAkuGXnFdcmFwqPn",
              "c6YsMReP9y2hvWeBB",
              "q4tq54fMMcKfmat7a",
              "NZkA9Gp98RqH8ni9T",
              "ZpHZsj3Mz8rLYxv95",
              "q8ExvxDQeLWX7pPe3",
              "QZdHZFSAWMPphkR7v",
              "yFqcrcbZZ4WJnigrZ",
              "Q6YC6BN7kyL7M3JND",
              "yvuLcapa24s3kxf9H",
              "iFm8YTHoit2nkS7ao",
              "Q7oeXjbMsDyH3AH8t",
              "FAcjyHJuxajWNuzNT",
              "cvmf3h6QySpyGxftc",
              "XFQaEESTBDqKBA4sA",
              "wkrJTSYihreZxoQ7z",
              "yCfP6ppDWEHzGkmga",
              "762tLiFPPArSyq8e3",
              "t2gfYCZTiqriBxAou",
              "xZ4PwTKZ5HanuLwAS",
              "phGpaoxJaPkPf94hs",
              "3649s2X6xumRJjLqK",
              "pHQbHJmi9nLhx85TL",
              "dcp4Yy7r6fySy64d6",
              "SmKLeZ7F48pjckoii",
              "JFXXh9AJedHMi6eRN",
              "s3DyreduTrEsEFxwu",
              "bmh6TpLu3iK9hAvMs",
              "r4q3WecFSAQt2isEW",
              "jz7aEMSiugHJuSrhA",
              "jByWL4bPM6QiGCFqz",
              "P8o27vLHE3Kpwtrig",
              "SNBtPmkZeFRmojePw",
              "dMuoH5diZfTGjGaSr",
              "99BZdwQpsYX5t49EQ",
              "kMShKJnsva9Yq5EXb",
              "4k3GZTGBzg9ztYwmy",
              "hJprgzJycpKaCaJEg",
              "8Fne9GFWNduk6u5QH",
              "cyh9g5gs2rHocxKcf",
              "wDEwts8arSWxke2WW",
              "pgQ9souFfYH9xY8kf",
              "Wqomsf5jyNHgzfT2y",
              "5LRFj6XNXwhkWwbG7",
              "kukfJZNW3MhYFQfcE",
              "saA5ZqRWswsoG97YF",
              "4o9WfeJfSfjB9DuyX",
              "c9Y6FnuMLPtFCGZ9E",
              "8r55yBJgo5qkcrJfy",
              "uRARhHMKWsmsALSyA",
              "3AAnWW8tpKCjQRvYD",
              "XJYWKoyooS5ncDaqR"
            ],
            "phone": "4433869479",
            "settings": {
              "push": true,
              "email": null,
              "text": true
            },
            "seenOrders": 22,
            "habitat": "g77XEv8LqxJKjTT8k",
            "loginPin": 34875,
            "avgRating": 4.5,
            "signupCode": "CTF1013",
            "mealCount": 0.25,
            "address": "1718 Edgley St",
            "geometry": {
              "type": "Point",
              "coordinates": [
                -75.161883,
                39.985883
              ]
            },
            "myPromo": "MICH5765",
            "gender": null,
            "ln": "P",
            "mealUser": false
          },
          "roles": [
            "runner",
            "student",
            "admin",
            "running"
          ],
          "deliveries": [
            {
              "_id": "KevG8Ws5fJwGupqfk"
            },
            {
              "_id": "8xgaA5a95TGStRtLB"
            },
            {
              "_id": "jcxd5HvRDnK3Yjy5i"
            },
            {
              "_id": "2H68AXenfeArHDZaP"
            },
            {
              "_id": "PjYSPGof2TcxbnyPX"
            },
            {
              "_id": "XNRyRAaD3aBrPj6zi"
            },
            {
              "_id": "8mC3zLFAnWHRKnsNy"
            },
            {
              "_id": "8jQqQHsfoJCCnww72"
            },
            {
              "_id": "tCAJP6TG4EFK7BXe5"
            },
            {
              "_id": "DqtaWgoXpadTuBuwo"
            },
            {
              "_id": "XozLktXNZnm2ddEmY"
            }
          ],
          "avgRating": 3,
          "status": {
            "online": true,
            "lastLogin": {
              "date": "2017-03-17T16:19:57.769Z",
              "ipAddr": "65.210.86.62",
              "userAgent": "Mozilla/5.0 (Linux; Android 7.1.1; Pixel Build/NOF26V; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/56.0.2924.87 Mobile Safari/537.36"
            },
            "idle": false
          }
        }
      },
    ]
 : staffJoy.getShifts();
  }
});


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
    return _.flatten(habitats.map(h =>
      HTTP.call(`GET`, staffJoy._getUrl(`locations/${h.staffJoyId}/roles/${h.staffJoyRunnerRole}/shifts`), {
        auth: staffJoy._auth,
        params: {
          start: moment(week.startTime).toISOString(),
          end: moment(week.endTime).toISOString(),
          include_summary: true,
          user_id: staffJoyId,
        }
      }).data.data));
  },
  getShiftHours(week, staffJoyId) {
    weekHours = runner.payouts.getWeekShifts(week, staffJoyId).map(shift => ({
      user_id: shift.user_id,
      hours: ((
        new Date(moment(shift.stop).format()).getTime() -
        new Date(moment(shift.start).format()).getTime()) /
        (1000*60*60)%24
      ),
    }));
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
    return (runnerTxs.length * 1.5);
  },
  _onDemandOwed(runnerTxs){
    return runnerTxs
      .filter(t => t.runnerPayRef && t.runnerPayRef.onDemand)
      .map(t => t.runnerPayRef.onDemandRate)
      .reduce((sum, num) => { return sum + num; }, 0);
  },
  _totalOwed(runnerTxs, allShifts, staffJoyId){
    return (this._totalHoursWorked(runnerTxs, allShifts, staffJoyId) * 4) +
            this._perTxKeep(runnerTxs) +
            this._onDemandOwed(runnerTxs) +
            this._tips(runnerTxs);
  },
  payRef(worker, allShifts, runnerTxs, runnerId, week){
    query = _.extend(worker, {
      week: week,
      hoursWorked: this._totalHoursWorked(runnerTxs, allShifts, worker.id),
      transactionCount: runnerTxs.length,
      templeCount: runnerTxs.filter(t => t.habitat === 'g77XEv8LqxJKjTT8k').length,
      ucCount: runnerTxs.filter(t => t.habitat === 'zfY5SkgFSjXcjXbgW').length,
      daasCount: runnerTxs.filter(t => t.DaaS).length,
      onDemand: runnerTxs.filter(t => t.runnerPayRef && t.runnerPayRef.onDemand).length,
      runnerHourlyRate: accounting.formatMoney(4),
      owedOnDemandTotal: this._onDemandOwed(runnerTxs),
      owedHourTotal: accounting.formatMoney(this._totalHoursWorked(runnerTxs, allShifts, worker.id) * 4),
      owedDeliveryFee: accounting.formatMoney(this._perTxKeep(runnerTxs)),
      owedTips: accounting.formatMoney(this._tips(runnerTxs)),
      runnerOwed: this._totalOwed(runnerTxs, allShifts, worker.id),
    }); console.log(query);
    return query;
  },
  getAll(week){
    console.log(`we're on week ${week.week}`);
    return runner.payouts.getWorkers().map((worker) => {
      const runnerUser = Meteor.users.findOne({username: worker.email});

      if(!runnerUser) { console.warn(`no user for ${worker.email}`); } else {
        const runnerTxs = runner.payouts.runnerTransactions(week, runnerUser._id);
        const allShifts = runner.payouts.getShiftHours(week, worker.id);
        return runner.payouts.payRef(worker, allShifts, runnerTxs, runnerUser._id, week.week);
      }
    }).filter(doc => doc && doc.transactionCount > 0 || doc &&  doc.daasCount > 0);
  }
};
Router.route('/staffjoy/weekTotals/:weekNum', {
  where: 'server',
  action() {
    const week = weeks.findOne({week: parseInt(this.params.weekNum)});
    try {
      return convert.json2csv(_.sortBy(runner.payouts.getAll(week), 'runnerOwed').reverse(), (err, spreadsheet) => {
        console.log('Finished converting');
        if(err) { console.warn(err.message); } else {
          console.log('Success, serving spreadsheet');
          this.response.writeHead(200, csv.writeHead(`runner_summary_week-${week.week}`, 'csv'));
          this.response.end(spreadsheet);
        }
      }, csv.settings);

    } catch (err) {
      console.warn(err.message, err.stack);
    }
  }
});

Router.route('/allweeks', {
  where: 'server',
  action() {
    const allPayouts = _.flatten(weeks.find({week: {$lte: 10}}, { sort: {week: 1}}).map(w => runner.payouts.getAll(w)));
    console.log(`allPaouts lenght ${allPayouts.length}`);

    try {
      return convert.json2csv(allPayouts, (err, spreadsheet) => {
        console.log('Finished converting');
        if(err) { console.warn(err.message); } else {
          console.log('Success, serving spreadsheet');
          this.response.writeHead(200, csv.writeHead(`runner_summary_week-`, 'csv'));
          this.response.end(spreadsheet);
        }
      }, csv.settings);

    } catch (err) {
      console.warn(err.message, err.stack);
    }
  }
});
