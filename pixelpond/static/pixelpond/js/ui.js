(function(PP){
  var WHITE = { r: 255, g: 255, b: 255 };
  var BLACK = { r: 0, g: 0, b: 0};

  var setPixel = function(px, color){
    px.r = color.r;
    px.g = color.g;
    px.b = color.b;
    px.a = _.isUndefined(color.a) ? 255 : color.a;
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // Color schemes are simple functions from pixels to jCanvas colors.
  //////////////////////////////////////////////////////////////////////////////
  PP.ColorSchemes = {
    
    // A simple scheme that colors viable pixels white, non-viable living pixels
    // grey, and non-living pixels black. 
    viable: function(pixel){
      if(pixel.isAlive()){
        if(pixel.generation >= PP.Settings.minimumViableGeneration){
          return WHITE;
        }
        return GREY;
      }
      return BLACK;
    },
    
    // A scheme that colors pixels that share a common ancestor the same color.
    lineage: function(pixel){
      if(pixel.isAlive()){
        return {
          r: pixel.originatorId.mod(256),
          g: pixel.originatorId.div(256).mod(256),
          b: pixel.originatorId.div(256 * 256).mod(256)
        }
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
        'render',
        'onRun_', 'onTerminate_'
      );
      
      options = _.extend({
        scale: PP.Settings.defaultCanvasScale,
        colorScheme: 'lineage'
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
      this.simulator.on('era', this.render);
      this.simulator.on('run', this.onRun_);
      this.simulator.on('terminated', this.onTerminate_);
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
    
    onTerminate_: function(){
      this.$el.removeClass('running');
    }
  });
  
})(PixelPond);
