// mongobq --host candidate.40.mongolayer.com --port 11053  -u habitat_mike -p Mpasz1992 -d habitat -c mastertransactions -P stitch-market-tryhabitat-com -B stitch-market-tryhabitat-com -D market -T mastertransactions --keyfile stitch-market-tryhabit
class masterTransactionsCollection extends Mongo.Collection {
  _options(opts){ return _.extend({ getIncomplete: false }); }
  _fetchBaseDoc(txId){ return transactions.csv.orders(txId, this._options()); }
  _denormalize(txId) {
    const tx = this._fetchBaseDoc(txId);
    // const p = Instances.findOne(tx.promoId);
    // const promo = !tx.promoId ? false : p;
    //
    // if(promo){ check(promo, Instances.schema); }
    // const doc = _.extend(tx, promo ? promo : {});
    return tx;
  }
  insert(txId){
    doc = _.extend(this._denormalize(txId));
    if(doc && !masterTransactions.findOne(txId)){
      return super.insert(doc, err => err ? console.warn(err.message) :
        transactions.update(txId, {$set: {archived: true}}, err => err ? console.warn(err.message) : console.log(`${txId} peration complete`)
        )
      );
    }
  }
}

masterTransactions = new masterTransactionsCollection("mastertransactions");
