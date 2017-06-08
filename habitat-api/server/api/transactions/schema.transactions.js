import SimpleSchema from 'simpl-schema';
_baseSchema = new SimpleSchema({
  sellerId: {
    type: String,
    custom(){
      console.log(this.obj)
      const bp = businessProfiles.findOne(this.obj.sellerId);
      const hab = Habitats.findOne({name: bp.backend_habitat});
      if(!bp){
        throwError({reason: 'No vendor found'});
      } else if (!hab) {
        throwError({reason: 'No habitat found'});
      } else if (bp && bp.closed) {
        throwError({reason: 'Vendor is currently closed'});
      } else if (bp && this.obj.DaaS && !bp.DaaS){
        throwError({reason: 'Vendor is not enabled for Delivery-as-a-Service'});
      } else if (bp && hab && hab.orderType === 'pickup' && this.obj.isDelivery){
        throwError({reason: 'Habitat is closed for delivery'})
      }
    }
  },
  status: { type: String, allowedValues: ['created', 'pending_vendor', 'pending_runner'] },
  orderType: { type: String, allowedValues: ['credit_card', 'prepaid', 'cash'] },
  orderSize: { type: Number, optional: true },
  isDelivery: { type: Boolean },
  prepTime: { type: Number }, //only used if vendor mode
  partnerName: { type: String }, //PRIVATE: (not passed up)
  thirdParty: { type: Boolean }, //PRIVATE: (not passed up)
  DaaS: { type: Boolean }, //PRIVATE: (not passed up)
});

_timingSchema = new SimpleSchema({
  placedAt: { type: String, optional: true },
  expectedAt: { type: String, optional: true }
})
_orderSchema = new SimpleSchema ({
  order: { type: Array },
    'order.$': { type: Object },
      'order.$.itemName': { type: String },
      'order.$.itemCategory': { type: String, optional: true },
      'order.$.itemPrice': { type: Number },
      'order.$.modifiers': { type: Array, optional: true },
        'order.$.modifiers.$': { type: Object, optional: true },
          'order.$.modifiers.$.name': { type: String },
          'order.$.modifiers.$.category': { type: String },
          'order.$.modifiers.$.price': { type: Number, optional: true },
});
_customerSchema = new SimpleSchema({
  customer: { type: Object },
    'customer.name': { type: String },
    'customer.phone': { type: String },
    'customer.email': { type: String },
});
_payRefSchema = new SimpleSchema({
  payRef: { type: Object },
    'payRef.total': { type: Number },
    'payRef.tax': { type: Number },
    'payRef.tip': { type: Number },
});
_deliverySchema = new SimpleSchema({
  deliveryAddress: { type: String },
  deliveryInstructions: { type: String, optional: true },
  suite: { type: String, optional: true },
  loc: { type: Object, blackbox: true, optional: true },
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

handleErrors = (context, order) => {
  console.warn(`inside handleErrors`, order.sellerId)
  switch (order) {
    case !order.sellerId:
      console.warn(`inside handle errors no sellerId`)
      return API.utility.response(context, 400, { error: 400, message: `Must pass a valid Habitat sellerId`, });
    case order.thirdParty && !order.partnerName:
      return API.utility.response(context, 400, { error: 400, message: `Can't find partner for ${connection.data.partnerName}`, });
  }
}

validateOrder = (context, order) => {
  let schema = _baseSchema
    .extend(_orderSchema)
    .extend(_customerSchema)
    .extend(_payRefSchema)
    .extend(_timingSchema)

  if(order.isDelivery){
    order = _.extend(order, handleDelivery(context, order));
    schema.extend(_deliverySchema);
  }

  return schema.validate(order);
}
