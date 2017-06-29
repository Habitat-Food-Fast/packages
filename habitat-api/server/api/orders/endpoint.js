Router.route( '/api/v1/orders', function() {
  this.response.setHeader( 'Access-Control-Allow-Origin', '*' );
  if ( this.request.method === "OPTIONS" ) {
    this.response.setHeader( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' );
    this.response.setHeader( 'Access-Control-Allow-Methods', 'POST, OPTIONS' );
    this.response.end( 'Set OPTIONS.' );
  } else {
    API.handleRequest(this, 'orders', this.request.method);
  }
}, { where: 'server' } );

Router.route( '/api/v1/orders/:orderId', function() {
  this.response.setHeader( 'Access-Control-Allow-Origin', '*' );
  if ( this.request.method === "OPTIONS" ) {
    this.response.setHeader( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' );
    this.response.setHeader( 'Access-Control-Allow-Methods', 'PUT, GET, OPTIONS' );
    this.response.end( 'Set OPTIONS.' );
  } else {
    console.log(`inside query param orders/orderid`)
    API.handleRequest(this, 'orders', this.request.method);
  }
}, { where: 'server' } );

Router.route('/api/v1/orders/:orderId/accept', function() {
  this.response.setHeader( 'Access-Control-Allow-Origin', '*' );
  if ( this.request.method === "OPTIONS" ) {
    this.response.setHeader( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' );
    this.response.setHeader( 'Access-Control-Allow-Methods', 'POST, OPTIONS');
    this.response.end( 'Set OPTIONS.' );
  } else {
    console.log(`inside query param orders/orderid`)
    API.handleRequest(this, 'orders', this.request.method);
  }
}, { where: 'server' });

Router.route('/api/v1/orders/:orderId/decline', function() {
  this.response.setHeader( 'Access-Control-Allow-Origin', '*' );
  if ( this.request.method === "OPTIONS" ) {
    this.response.setHeader( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' );
    this.response.setHeader( 'Access-Control-Allow-Methods', 'POST, OPTIONS' );
    this.response.end( 'Set OPTIONS.' );
  } else {
    console.log(`inside query param orders/orderid`)
    API.handleRequest(this, 'orders', this.request.method);
  }
}, { where: 'server' } );

Router.route('/api/v1/orders/:orderId/assign', function() {
  this.response.setHeader( 'Access-Control-Allow-Origin', '*' );
  if ( this.request.method === "OPTIONS" ) {
    this.response.setHeader( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' );
    this.response.setHeader( 'Access-Control-Allow-Methods', 'POST, OPTIONS');
    this.response.end( 'Set OPTIONS.' );
  } else {
    API.handleRequest(this, 'orders', this.request.method);
  }
}, { where: 'server' });
