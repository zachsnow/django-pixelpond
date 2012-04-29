(function(PP){
  //////////////////////////////////////////////////////////////////////////////
  // Instructions
  //////////////////////////////////////////////////////////////////////////////
  PP.Instructions = {};
  
  PP.Instructions.LOGO_INDEX = 0;
  PP.Instructions.CODE_INDEX = 1;
  
  PP.Instructions.INSTRUCTIONS = [
    'NOP',
    'ZERO',
    'FWD',
    'BACK',
    'INCR',
    'DECR',
    'XCHG',
    'READ',
    'WRITE',
    'IN',
    'OUT',
    'POST',
    'RECV',
    'SENSE',
    'KILL',
    'SHARE',
    'FORK',
    'TURN',
    'LOOP',
    'REP',
    'HALT'
  ];
  _.map(PP.Instructions.INSTRUCTIONS, function(instruction, index){
    PP.Instructions[instruction] = index;
  });
  
  // Returns an error for a presumably unknown or unhandled exception.
  PP.Instructions.invalid = function(instruction){
    var instructionName = PP.Instructions.INSTRUCTIONS[instruction];
    if(instructionName){
      return 'unhandled instruction ' + instructionName;
    }
    else {
      'unknown instruction ' + instruction;
    }
  };
  
  // Pretty-print an instruction.
  PP.Instructions.print = function(instruction){
    var instructionName = PP.Instructions.INSTRUCTIONS[instruction];
    if(instructionName){
      return instructionName.toLowerCase();
    }
    throw new Error(PP.Instructions.invalid(instruction));
  };
  
  // Parse a single instruction, returning ``undefined`` if the instruction
  // is invalid.
  PP.Instructions.parse = function(s){
    s = $.trim(s);
    s = s.toUpperCase();
    return PP.Instructions[s];
  };
  
  
  PP.Instructions.cost = function(instruction){
    switch(instruction) {
      case NOP:
      case ZERO:
        return 1;
      
      case FWD:
      case BACK:
      case INCR:
      case DECR:
      case XCHG:
        return 1;
      
      case READ:
      case WRITE:
      case IN:
      case OUT:
        return 1;
      
      
      case POST:
      case RECV:
      case KILL:
      case SHARE:
      case FORK:
      case TURN:
      
      case HALT:
        return 1;
      
      case LOOP:
      case REP:
        return 1;
      
      default:
        throw new Error(PP.Instructions.invalid(instruction));
    }
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // Genomes.
  //////////////////////////////////////////////////////////////////////////////
  PP.Genome = {};
  
  // Pretty-print an instruction or genome.
  PP.Genome.print = function(instructions){
    // TODO: indent loops.
    return _.map(instructions, PP.Instructions.print).join('\n');
  };
  
  PP.Genome.parse = function(s){
    var lines = s.split('\n');
    return _.map(lines, function(s){
      s = $.trim(s).toUpperCase();
      
      // Comments. 
      if(s[0] == '#'){
        return;
      }
      
      var instruction = PP.Instructions.parse(s);
      
      // Invalid instruction.
      if(_.isUndefined(instruction)){
        throw new Error('invalid instruction ' + s);
      }
      
      return instruction;
    }).filter(function(instruction){
      // Filters out comments.
      return !_.isUndefined(instruction);
    });
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // Pixel.
  //////////////////////////////////////////////////////////////////////////////
  PP.Pixel = Thoracic.Class.extend({
    initialize: function(options){
      _.bindAll(this,
        'reset', 'serialize', 'clear', 'isAlive',
        'load_'
      );
      
      if(options.data){
        this.load_(options.data);
        this.reset();
      }
      else {
        options = _.extend({
          depth: PP.Settings.defaultPondDepth 
        });
        
        this.id = null;
        this.parentId = null;
        this.originatorId = null;
        this.generation = PP.Long.ZERO;
        
        
        this.genome = [];
        this.memory = [];
        this.depth = options.depth;
        this.genome.length = this.memory.length = this.depth;
        
        this.clear();
      }
    },
    
    load_: function(data){
      this.id = data.id
      this.parentId = data.parentId;
      this.originatorId = data.originatorId;
    
      this.generation = PP.Long.fromString(data.generation);
      
      this.genome = PP.Genome.parse(data.genome);
      this.memory = [];
      this.depth = this.memory.length = this.genome.length;
    },
    
    serialize: function(){
      return {
        id: this.id,
        parentId: this.parentId,
        originatorId: this.originatorId,
        
        generation: this.generation.toString(),
        
        genome: PP.Genome.print(this.genome)
      }
    },
    
    reset: function(){
      this.rx = 0;
      this.cx = 0;
      this.dx = 0;
      
      this.ex = 0;
      
      this.gp = 0;
      this.ip = 0;
      
      _.forEach(_.range(this.memory.length), function(i){
        this.memory[i] = PP.Instructions.NOP;
      }, this);
    },
    
    clear: function(){
      this.reset();
      
      _.forEach(_.range(this.genome.length), function(i){
        this.genome[i] = PP.Instructions.NOP;
      }, this);
    },
    
    isAlive: function(){
      return this.ex > 0;
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Pond.
  //////////////////////////////////////////////////////////////////////////////
  PP.Pond = Thoracic.Class.extend({
    initialize: function(options){
      _.bindAll(this,
        'serialize', 'forEach',
        'load_'
      );
      
      this.pixels = [];
      
      if(options.data){
        this.load_(this.options.data);
      }
      else {
        options = _.extend({
          width: PP.Settings.defaultPondWidth,
          height: PP.Settings.defaultPondHeight,
          depth: PP.Settings.defaultPondDepth
        }, options);
        
        this.width = options.width;
        this.height = options.height;
        this.depth = options.depth;
        
        this.pixels = _.map(_.range(this.width * this.height), function(){
          return new PP.Pixel({
            depth: this.depth
          })
        }, this);
      }
    },
    
    // Deserialize a server response.
    load_: function(data){
      this.width = data.width;
      this.height = data.height;
      this.depth = data.depth;
      
      this.pixels = _.map(data.pixels, function(pixel){
        return new PP.Pixel({
          data: pixel
        });
      }, this);
    },
    
    // Serialize to a format the server can understand.
    serialize: function(){
      return {
        width: this.width,
        height: this.height,
        depth: this.depth,
        pixels: _.map(this.pixels, function(pixel){
          return pixel.serialize();
        })
      };
    },
    
    forEach: function(iterator, context){
      var args = _.rest(_.rest(arguments));
      args.unshift({x: 0, y: 0});
      args.unshift(null);
      
      for(var y = 0; y < this.height; y++){
        for(var x = 0; x < this.width; x++){
          args[0] = this.pixels[y * this.width + x];
          args[1].x = x;
          args[1].y = y;
          iterator.apply(context, args);
        }
      }
      
      return;
    }
  });
  
  //////////////////////////////////////////////////////////////////////////////
  // Simulator.
  //
  // Given a pond and various other simulation settings, randomly simulates
  // the pond over a period of time.
  //////////////////////////////////////////////////////////////////////////////
  PP.Simulator = Thoracic.Class.extend({
    initialize: function(options){
      _.bindAll(this,
        'run', 'runEras_', 'runEra_', 'runCycle_',
        'stop',
        
        'pixelAt_',
        
        'forEach'
      );
      
      PP.logAll(this,
        'run', 'runEras_', 'runEra_',
        'stop'
      );
      
      this.pond = options.pond;
      
      this.options = _.extend({
        cyclesPerEra: 1000,
        defaultEraCount: this.pond.width * this.pond.height
      }, options);
      
    },
    
    // Run for a given number of eras; if undefined 
    run: function(eras){
      if(_.isUndefined(eras)){
        eras = this.options.defaultEraCount;
      }
      
      this.trigger('run');
      this.runEras_(eras);
    },
    
    stop: function(){
      clearInterval(this.runInterval_);
    },
    
    forEach: function(){
      this.pond.forEach.apply(this.pond, arguments);
    },
    
    runEras_: function(eras){
      if(!eras){
        this.trigger('terminated');
        return;
      }
      
      this.runEra_();
      
      PP.delay(this.runEras_, this, eras - 1);
    },
    
    runEra_: function(){
      for(var cycle = 0; cycle < this.options.cyclesPerEra; cycle++){
        var location = PP.randomLocation(this.pond.width, this.pond.height);
        this.runCycle_(location);
      }
      
      this.trigger('era');
    },
    
    runCycle_: function(location){
      
      var pixel = this.pixelAt_(location);
      
      var instruction = pixel.genome[pixel.ip];
      switch(instruction){
        
        case PP.Instructions.NOP:
          break;
        
        case PP.Instructions.ZERO:
          pixel.rx = 0;
          pixel.cx = 0;
          pixel.dx = 0;
          pixel.gp = 0;
          break;
        
        case PP.Instructions.FWD:
          pixel.gp = PP.clamp(pixel.gp + 1, pixel.genome.length);
          break;
          
        case PP.Instructions.BACK:
          pixel.gp = PP.clamp(pixel.gp - 1, pixel.genome.length);
          break;
          
        case PP.Instructions.INCR:
          pixel.rx = PP.clamp(pixel.rx + 1, pixel.genome.length);
          break;
        
        case PP.Instructions.DECR:
          pixel.rx = PP.clamp(pixel.rx - 1, pixel.genome.length);
          break;
        
        case PP.Instructions.XCHG:
          pixel.genome[pixel.ip + 1] = pixel.rx;
          pixel.ip = PP.clamp(pixel.ip + 1, pixel.genome.length);
          break;
        
        case PP.Instructions.READ:
          pixel.rx = pixel.genome[pixel.gp];
          break;
          
        case PP.Instructions.WRITE:
          pixel.genome[pixel.gp] = pixel.rx;
          break;
        
        case PP.Instructions.IN:
          pixel.rx = pixel.memory[pixel.gp];
          break;
          
        case PP.Instructions.OUT:
          pixel.memory[pixel.gp] = pixel.rx;
          break;
        
        case PP.Instructions.POST:
          var neighbor = this.neighborOf_(location, pixel, PP.Interactions.NEUTRAL);
          if(neighbor){
            neighbor.cx = pixel.rx;
          }
          break;
        
        case PP.Instructions.RECV:
          pixel.rx = pixel.cx;
          break;
          
        case PP.Instructions.SENSE:
          var neighbor = this.neighborOf_(location, pixel, PP.Interactions.NEUTRAL);
          if(neighbor){
            pixel.rx = neighbor.ex;
          }
          break;
          
        case PP.Instructions.KILL:
          var neighbor = this.neighborOf_(location, pixel, PP.Interaction.NEGATIVE);
          if(neighbor){
            pixel.ex += neighbor.ex;
            this.kill_(neighbor);
          }
          else {
            this.penalize_(pixel);
          }
          break;
        
        case PP.Instructions.SHARE:
          var neighbor = this.neighborOf_(location, pixel, PP.Interaction.POSITIVE);
          if(neighbor){
            pixel.ex = (pixel.ex + neighbor.ex) / 2;
            neighbor.ex = pixel.ex;
          }
          else {
            this.penalize_(pixel);
          }
          break;
          
        case PP.Instructions.FORK:
          var neighbor = this.neighborOf_(location, pixel, PP.Interaction.NEGATIVE);
          if(neighbor){
            // TODO: copy pixel over.
          }
          else {
            this.penalize_(pixel);
          }
          break;
      
        case PP.Instructions.TURN:
          pixel.dx = PP.clamp(pixel.dx + 1, PP.Directions.OFFSETS.length);
          break;
        
        case PP.Instructions.LOOP:
          if(pixel.rx == 0){
            this.search_(pixel, 1, PP.Instructions.LOOP, PP.Instructions.REP);
          }
          break;
          
        case PP.Instructions.REP:
          if(pixel.rx != 0){
            this.search_(pixel, -1, PP.Instructions.REP, PP.Instructions.LOOP);
          }
          break;
        
        default:
          throw new Error(PP.Instructions.invalid(instruction));
      }
      this.trigger('cycle', pixel);
    },
    
    penalize_: function(pixel){
      if(this.options.penaltyFactor){
        pixel.ex /= this.options.penaltyFactor;
      }
      if(this.options.penaltyScalar){
        pixel.ex -= this.options.penaltyScalar;
      }
      
      if(pixel.ex <= 0){
        this.kill_(pixel)
      }
    },
    
    pixelAt_: function(location){
      return this.pond.pixels[location.y * this.pond.width + location.x];
    },
    
    neighborOf_: function(location, pixel){
      var neighboringLocation = location.add(PP.Directions.OFFSETS[pixel.dx]);
      return this.pixelAt_(neighboringLocation);
    },
    
    search_: function(pixel, offset, open, close){
      var loopCount = 0;
      var p = PP.clamp(pixel.ip + offset, pixel.genome.length);
      while(p != pixel.ip){
        var i = pixel.genome[p];
        if(i === open){
          loopCount += 1;
        }
        else if(i === close){
          if(loopCount === 0){
            break;
          }
          else {
            loopCount -= 1;
          }
        }
        
        p = PP.clamp(p + 1, pixel.genome.length);
      }
      
      if(p === pixel.ip){
        this.kill_(pixel);
      }
      else {
        pixel.ip = p;
      }
    }
  });

})(PixelPond);
