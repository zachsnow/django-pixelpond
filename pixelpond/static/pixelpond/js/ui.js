(function(PP){
  var WHITE = { r: 255, g: 255, b: 255, a: 255 };
  var GREY = { r: 48, g: 48, b: 48, a: 255 };
  var BLACK = { r: 0, g: 0, b: 0, a: 255 };

  var setPixel = function(px, color){
    px.r = color.r;
    px.g = color.g;
    px.b = color.b;
    px.a = color.a;
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // Color schemes are simple functions from pixels to jCanvas colors.
  //////////////////////////////////////////////////////////////////////////////
  var TWO_PWR_8 = PP.Long.fromInt(256);
  var TWO_PWR_16 = PP.Long.fromInt(256 * 256);
  
  PP.ColorSchemes = {
    
    // A simple scheme that colors viable pixels white, non-viable living pixels
    // grey, and non-living pixels black. 
    viable: function(pixel){
      if(pixel.ex > 0){
        if(pixel.generation.greaterThanOrEqual(PP.Settings.minimumViableGeneration)){
          return WHITE;
        }
        return GREY;
      }
      return BLACK;
    },
    
    // A scheme that colors pixels that share a common ancestor the same color.
    lineage: function(pixel){
      if(pixel.ex > 0){
        if(pixel.generation.greaterThanOrEqual(PP.Settings.minimumViableGeneration)){
          var id = PP.Long.fromUUID(pixel.originatorId);
          return {
            r: id.low_ % 256,
            g: (id.low_ >>> 8) % 256,
            b: id.high_ % 256,
            a: 255
          };
        }
        return GREY;
      }
      return BLACK;
    }
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // Canvas.
  //////////////////////////////////////////////////////////////////////////////
  PP.Canvas = Thoracic.Class.extend({
    initialize: function(options){
      _.bindAll(this,
        'render', 'renderRandom',
        'onRun_', 'onStop_'
      );
      
      options = _.extend({
        scale: PP.Settings.defaultCanvasScale,
        colorScheme: PP.Settings.defaultCanvasColorScheme,
      }, options);
      
      this.simulator = options.simulator;
      if(!this.simulator){
        throw new Error('no simulator specified');
      }
      
      this.scale = options.scale;
      this.canvasWidth = this.simulator.pond.width * this.scale;
      this.canvasHeight = this.simulator.pond.height * this.scale;
      
      this.colorScheme = PP.ColorSchemes[options.colorScheme];
      if(!this.colorScheme){
        throw new Error('invalid color scheme')
      }
      
      // Create canvas.
      this.$el = $(
        '<canvas ' +
        'width="' + this.canvasWidth + '" ' +
        'height="' + this.canvasHeight + '" ' +
        '></canvas>'
      );
      
      
      this.$el.setPixels({
        x: 0,
        y: 0,
        width: this.canvasWidth,
        height: this.canvasHeight,
        each: function(px){
          setPixel(px, BLACK);
        }
      })
      
      // Connect events.
      this.simulator.on('era', this.renderRandom);
      this.simulator.on('run', this.onRun_);
      this.simulator.on('stop', this.onStop_);
    },
    
    renderRandom: function(){
      var location = PP.randomLocation(this.simulator.pond.width, this.simulator.pond.height);
      var pixel = this.simulator.at(location);
      
      var color = this.colorScheme(pixel);
        
      // TODO: this could be vastly optimized!
      this.$el.setPixels({
        x: location.x * this.scale,
        y: location.y * this.scale,
        width: this.scale,
        height: this.scale,
        each: function(px){
          setPixel(px, color);
        }
      });
      
   },
   
   render: function(){
      this.simulator.forEach(function(pixel, location){
        var color = this.colorScheme(pixel);
        
        // TODO: this could be vastly optimized!
        this.$el.setPixels({
          x: location.x * this.scale,
          y: location.y * this.scale,
          width: this.scale,
          height: this.scale,
          each: function(px){
            setPixel(px, color);
          }
        });
      }, this);
    },
    
    onRun_: function(){
      this.$el.addClass('running');
    },
    
    onStop_: function(){
      this.$el.removeClass('running');
    }
  });
  
})(PixelPond);
