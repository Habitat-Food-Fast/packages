console.log(`inside collection.weeks`)
class weeksCollection extends Mongo.Collection {
  insert(doc, callback) {
    console.log(Random);
    console.log(weeks);
    return super.insert({
      _id: Random.id(),
      week: weeks.find().count() + 1,
      lock: false,
      startTime: new Date(),
      endTime: new Date(Date.now() + 604800000) // now +1 week's time
    }, callback);
  }
  forceInsert(weeks) {
    return super.insert(weeks, (err) => {
      if (err) { console.warn('error inserting weeks'); }
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
