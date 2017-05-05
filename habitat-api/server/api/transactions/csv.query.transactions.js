// txQuery = (wk, request) => {
//   let query = _.extend(
//     {
//       week: wk.week,
//       // buyerId: { $nin: Meteor.users.find().map(u => u._id) },
//     }, request.getAll ?
//       {} :
//     {
//       status: request.getIncomplete ?
//         { $nin: transactions.completedAndArchived() } :
//
//         { $in: transactions.completedAndArchived() }
//     }
//   );
//   if(request.bizId){
//     query.sellerId = request.bizId;
//   }
//   // const sort = {sort: request.getIncomplete || request.getAll ? { createdAt: 1} : { timeRequested: 1 }};
//   console.log(query);
//   const txs = transactions.find(query, { sort: {timeRequested: 1}});
//   console.log('transactions found ' +  txs.count());
//   return txs.fetch();
// };
