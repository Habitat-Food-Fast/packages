import SimpleSchema from 'simpl-schema';
_baseSchema = new SimpleSchema({
  sellerId: {
    type: String,
    custom(){
      console.log(this.obj)
      const bp = businessProfiles.findOne(this.obj.company_name ?
        { company_name: this.obj.company_name} :
        this.obj.sellerId
      );
      if(!bp){ throwError({reason: 'No vendor found'}); }
      const hab = Habitats.findOne({name: bp.backend_habitat});
      if (!hab) {
        throwError({reason: 'No habitat found'});
      } else if (bp.closed) {
        throwError({reason: 'Vendor is currently closed'});
      } else if (this.obj.DaaS && !bp.DaaS){
        throwError({reason: 'Vendor is not enabled for Delivery-as-a-Service'});
      } else if (hab.orderType === 'pickup' && this.obj.isDelivery){
        throwError({reason: 'Habitat is closed for delivery'})
      }
    }
  },
  status: { type: String, allowedValues: ['created', 'pending_vendor', 'pending_runner'] },
  orderSize: { type: Number, optional: true },
  isDelivery: { type: Boolean },
  prepTime: { type: Number }, //only used if vendor mode
  partnerName: { type: String }, //PRIVATE: (not passed up)
  thirdParty: { type: Boolean }, //PRIVATE: (not passed up)
  DaaS: { type: Boolean }, //PRIVATE: (not passed up)
  method: { type: String },
  status: { type: String, allowedValues: ['created', 'pending_vendor', 'pending_runner'] },
  DaaSType: { type: String, allowedValues: ['credit_card', 'online', 'cash'] },
  grubhubId: {type: String, optional: true},
  company_name: {type: String, optional: true},
  orderNumber: {type: String, optional: true},
  cashTip: { type: Boolean, optional: true, },
});

_timingSchema = new SimpleSchema({
  placedAt: { type: String, optional: true },
  expectedAt: { type: String, optional: true }
})
_orderSchema = new SimpleSchema ({
  plainOrder: { type: Array },
    'plainOrder.$': { type: Object },
      'plainOrder.$.orderId': { type: Number }, //the index
      'plainOrder.$.quantity': { type: Number, optional: true, },
      'plainOrder.$.itemInstructions': { type: String },
      'plainOrder.$.itemName': { type: String },
      'plainOrder.$.itemCategory': { type: String, optional: true },
      'plainOrder.$.itemPrice': { type: Number, optional: true },
      'plainOrder.$.modifiersText': { type: Array, optional: true },
        'plainOrder.$.modifiersText.$': { type: Object, optional: true },
          'plainOrder.$.modifiersText.$.name': { type: String },
          'plainOrder.$.modifiersText.$.category': { type: String },
          'plainOrder.$.modifiersText.$.price': { type: Number, optional: true },
});
_customerSchema = new SimpleSchema({
  customer: { type: Object },
    'customer.name': { type: String, optional: true },
    'customer.phone': { type: String },
    'customer.email': { type: String, optional: true },
});
_payRefSchema = new SimpleSchema({
  payRef: { type: Object },
    'payRef.tp': { type: Number },
    'payRef.tax': { type: Number },
    'payRef.tip': { type: Number },
});
_deliverySchema = new SimpleSchema({
  deliveryAddress: { type: String },
  deliveryInstructions: { type: String, optional: true },
  suite: { type: String, optional: true },
  loc: { type: Object, blackbox: true, optional: true },
  //grubhub stuff, should move toward this more descriptive way.
  address1: { type: String, optional: true},
  address2: { type: String, optional: true},
  city: { type: String, optional: true},
  state: { type: String, optional: true},
  zip: { type: String, optional: true},
  'cross-street': { type: String, optional: true},
})

function handleDelivery(context, tx){
  console.log(tx.deliveryAddress);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${tx.deliveryAddress}.json`;
  const params = {
    params: {
      country: 'us',
      types: 'country,region,postcode,place,locality,neighborhood,address,poi',
      proximity: [ -75.1597308, 39.9802519 ],
      bbox: [-75.27935,39.888665,-75.084343,40.047854],
      access_token: Meteor.settings.public.mapboxKey
    }
  };
  try {
    const result = HTTP.get(url, params);
    if(result.statusCode === 200){
      addresses = JSON.parse(result.content);
      return {
        deliveryAddress: addresses.features[0].place_name,
        deliveryInstructions: tx.deliveryInstructions,
        suite: tx.suite,
        loc: addresses.features[0].geometry,
      }
    }
  } catch (e) {
    JSON.stringify(e, null, 2);
    throw new Meteor.Error(e.code);
  }
}


validateOrder = (context, order) => {
  console.log(`order is`);
  console.log(order);
  let schema = _baseSchema
  .extend(_customerSchema)
  .extend(_timingSchema)
  if (!order.sellerId === order.partnerName) {
    schema.extend(_orderSchema).extend(_payRefSchema)
  }

  if(order.method === 'Delivery' || order.isDelivery){
    order = _.extend(order, handleDelivery(context, order));
    schema.extend(_deliverySchema);
  }

  return schema.validate(order);
}
