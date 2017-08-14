import { Random } from 'meteor/random';
import { transactions } from 'meteor/habitat-transactions';

class weeksCollection extends Mongo.Collection {
  insert(doc, callback) {
    return super.insert({
      _id: Random.id(),
      week: weeks.find().count() + 1,
      lock: false,
      startTime: doc.startTime || new Date(),
      endTime: doc.endTime || new Date(Date.now() + 604800000), // now +1 week's time
      runnerPayouts: [],
    }, callback);
  }
  forceInsert(weeks) {
    return super.insert(weeks, (err) => {
      if (err) { throwError({reason: err.message}); }
    });
  }
  getWeekCounts(){
    weeks.find({}, { sort: {week: 1}}).forEach((w) => {
      completed = transactions.find({week: w.week, status: { $in: transactions.completedAndArchived() } });
      allTxs = transactions.find({week: w.week}).count();

      percent = (completed.count() / allTxs) * 100;
      console.log(`week ending: ${w.endTime} completed ${completed.count()} / ${allTxs} ${percent}%`);
    });
  }
}

weeks = new weeksCollection('weeks');
