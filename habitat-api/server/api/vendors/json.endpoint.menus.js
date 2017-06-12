Router.route( '/api/v1/menus', function() {
  this.response.setHeader( 'Access-Control-Allow-Origin', '*' );
  if ( this.request.method === "OPTIONS" ) {
    this.response.setHeader( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' );
    this.response.setHeader( 'Access-Control-Allow-Methods', 'GET, OPTIONS' );
    this.response.end( 'Set OPTIONS.' );
  } else {
    API.handleRequest(this, 'menus', this.request.method);
  }
}, { where: 'server' } );
