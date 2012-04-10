(function(PP){
  PP.PondServer = Thoracic.Class.extend({
    initialize: function(){
      _.bindAll(this,
        'onLoadSuccess_', 'onLoadError_'
      );
      
      this.loadPond_();
    },
    
    loadPond_: function(){
      $.get(this.options.url, this.onLoadSuccess_, this.onLoadError_);
    },
    
    onLoadSuccess_: function(response){
      
    },
    
    onLoadError_: function(){
      
    }
  });

})(PixelPond);
