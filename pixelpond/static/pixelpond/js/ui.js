(function(PP){
  var WHITE = { r: 255, g: 255, b: 255 };
  var BLACK = { r: 0, g: 0, b: 0};

  var setPixel = function(px, color){
    px.r = color.r;
    px.g = color.g;
    px.b = color.b;
  };
  
  PP.ColorSchemes = {
    
    // A simple scheme that colors viable pixels white, non-viable living pixels
    // grey, and non-living pixels black. 
    viable: function(pixel){
      if(pixel.energy > 0){
        if(pixel.generation >= PP.Settings.minimumViableGeneration){
          return WHITE;
        }
        return GREY;
      }
      return BLACK;
    },
    
    // A scheme that colors pixels that share a common ancestor the same color.
    lineage: function(pixel){
      return {
        r: pixel.lineage.mod(256),
        g: pixel.lineage.div(256).mod(256),
        b: pixel.lineage.div(256 * 256).mod(256)
      }
    }
  };
  
  PP.Canvas = Thoracic.Class.extend({
    initialize: function(options){
      _.bindAll(this,
        'render'
      );
      
      // Default options.
      var defaultOptions = {
        scale: 1,
        colorScheme: 'lineage'
      };
      
      this.options = _.extend({}, defaultOptions, options);
      
      if(!this.options.simulator){
        throw new Error("no simulator specified");
      }
      
      this.width = this.options.simulator.width;
      this.height = this.options.simulator.height;
      
      this.colorScheme = PP.UI.ColorScheme.get(this.options.colorScheme);
      if(!this.colorScheme){
        throw new Error("invalid color scheme")
      }
      
      // Create canvas.
      this.$el = $('<canvas></canvas>');
      this.$el.setPixels({
        x: 0,
        y: 0,
        width: this.width * this.options.scale,
        height: this.height * this.options.scale,
        each: function(px){
          setPixel(px, BLACK);
        }
      })
      
      // Connect events.
      this.options.simulator.on('cycle', this.render);
      this.options.simulator.on('terminate', this.onTerminate_);
    },
    
    render: function(pixel){
      var color = this.colorScheme(pixel);
      
      this.$el.setPixels({
        x: pixel.x * this.options.scale,
        y: pixel.y * this.options.scale,
        width: this.options.scale,
        height: this.options.scale,
        each: function(px){
          setPixel(px, color);
        }
      });
    },
    
    onTerminate_: function(){
    
    }
  });
  
})(PixelPond);
