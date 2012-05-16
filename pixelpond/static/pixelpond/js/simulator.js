(function(PP){
  //////////////////////////////////////////////////////////////////////////////
  // Locations
  //////////////////////////////////////////////////////////////////////////////
  PP.Locations = {
    add: function(l1, l2){
      return {
        x: l1.x + l2.x,
        y: l1.y + l2.y
      };
    }
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // Directions
  //////////////////////////////////////////////////////////////////////////////
  PP.Directions = {};
  
  PP.Directions.DIRECTION_NAMES = [
    'NORTH',
    'SOUTH',
    'EAST',
    'WEST'
  ];
  _.forEach(PP.Directions.DIRECTION_NAMES, function(direction, index){
    PP.Directions[direction] = index;
  });
  
  PP.Directions.OFFSETS = [
    {
      x: 0,
      y: -1
    }, {
      x: 0,
      y: 1
    }, {
      x: -1,
      y: 0
    }, {
      x: 1,
      y: 0
    }
  ];
  
  //////////////////////////////////////////////////////////////////////////////
  // Instructions
  //////////////////////////////////////////////////////////////////////////////
  PP.Instructions = {};
  
  PP.Instructions.LOGO_INDEX = 0;
  PP.Instructions.CODE_INDEX = 1;
  
  PP.Instructions.INSTRUCTION_NAMES = [
    'HALT',
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
    'REP'
  ];
  _.forEach(PP.Instructions.INSTRUCTION_NAMES, function(instruction, index){
    PP.Instructions[instruction] = index;
  });
  
  // Returns an error for a presumably unknown or unhandled exception.
  PP.Instructions.invalid = function(instruction){
    var instructionName = PP.Instructions.INSTRUCTION_NAMES[instruction];
    if(instructionName){
      return 'unhandled instruction ' + instructionName;
    }
    else {
      'unknown instruction ' + instruction;
    }
  };
  
  // Pretty-print an instruction.
  PP.Instructions.print = function(instruction){
    var instructionName = PP.Instructions.INSTRUCTION_NAMES[instruction];
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
      case PP.Instructions.NOP:
      case PP.Instructions.ZERO:
        return 1;
      
      case PP.Instructions.FWD:
      case PP.Instructions.BACK:
      case PP.Instructions.INCR:
      case PP.Instructions.DECR:
      case PP.Instructions.XCHG:
        return 1;
      
      case PP.Instructions.READ:
      case PP.Instructions.WRITE:
      case PP.Instructions.IN:
      case PP.Instructions.OUT:
        return 1;
      
      
      case PP.Instructions.SENSE:
      case PP.Instructions.POST:
      case PP.Instructions.RECV:
      case PP.Instructions.KILL:
      case PP.Instructions.SHARE:
      case PP.Instructions.FORK:
      case PP.Instructions.TURN:
        return 1;
        
      case PP.Instructions.LOOP:
      case PP.Instructions.REP:
        return 1;
      
      case PP.Instructions.HALT:
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
        'reset', 'serialize', 'clear', 'isAlive', 'randomize',
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
        
        
        this.depth = options.depth;
        this.genome = PP.list(this.depth, PP.Instructions.NOP);
        this.memory = PP.list(this.depth, PP.Instructions.NOP);
        this.clear();
      }
    },
    
    load_: function(data){
      this.id = data.id
      this.parentId = data.parentId;
      this.originatorId = data.originatorId;
    
      this.generation = PP.Long.fromString(data.generation);
      
      this.genome = PP.Genome.parse(data.genome);
      this.depth = this.genome.length;
      this.memory = PP.list(this.depth, PP.Instructions.HALT);
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
      
      _.forEach(this.memory, function(instruction, i){
        this.memory[i] = PP.Instructions.HALT;
      }, this);
    },
    
    clear: function(){
      this.reset();
      
      this.genome[PP.Instructions.LOGO_INDEX] = PP.Instructions.HALT;
      this.genome[PP.Instructions.CODE_INDEX] = PP.Instructions.HALT;
    },
    
    randomize: function(){
      this.reset();
      
      this.id = this.parentId = this.originatorId = PP.zeroUUID();
      this.generation = PP.Long.ZERO;
      
      _.forEach(this.genome, function(instruction, i){
        this.genome[i] = PP.randomInstruction();
      }, this);
    },
    
    kill: function(){
      this.reset();
      
      this.id = this.parentId = this.originatorId = PP.zeroUUID();
      this.generation = PP.Long.ZERO;
      
      this.genome[PP.Instructions.LOGO_INDEX] = PP.Instructions.HALT;
      this.genome[PP.Instructions.CODE_INDEX] = PP.Instructions.HALT;
    },
    
    copyTo: function(pixel){
      pixel.id = PP.randomUUID();
      pixel.parentId = this.id;
      pixel.originatorId = this.originatorId;
      pixel.generation = this.generation.add(PP.Long.ONE);
    },
    
    isAlive: function(){
      return this.ex > 0;
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Interactions
  //////////////////////////////////////////////////////////////////////////////
  PP.Interactions = {
    NEGATIVE: -1,
    NEUTRAL: 0,
    POSITIVE: 1
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // Pond.
  //////////////////////////////////////////////////////////////////////////////
  PP.Pond = Thoracic.Class.extend({
    initialize: function(options){
      _.bindAll(this,
        'serialize', 'forEach', 'at',
        'load_'
      );
      
      this.pixels = [];
      
      if(options.data){
        this.load_(this.options.data);
      }
      else {
        this.options = _.extend({
          width: PP.Settings.defaultPondWidth,
          height: PP.Settings.defaultPondHeight,
          depth: PP.Settings.defaultPondDepth
        }, options);
        
        console.info('here');
        this.width = options.width;
        this.height = options.height;
        this.depth = options.depth;
        
        this.pixels = PP.list(this.width * this.height, function(){
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
    },
    
    at: function(location){
      return this.pixels[location.y * this.width + location.x];
    }
  });
  
  //////////////////////////////////////////////////////////////////////////////
  // Operators
  //////////////////////////////////////////////////////////////////////////////
  PP.Operators = {};
  PP.Operators.Inflow = Thoracic.Class.extend({
    initialize: function(options){
      this.options = _.extend({
        frequency: 500,
        value: 4000,
        variation: 8000
      });
      
      this.frequency = this.options.frequency;
    },
    
    invoke: function(pond){
      console.info('inflow!');
      
      var location = PP.randomLocation(pond.width, pond.height);
      var pixel = pond.at(location);
      
      pixel.ex = this.options.value + PP.randomInt(this.options.variation);
      pixel.randomize();
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
        'run', 'runEras_', 'runEra_', 'runCycle_', 'runOperators_',
        'stop',
        
        'at',
        
        'forEach'
      );
      
      this.pond = options.pond;
      
      this.options = _.extend({
        cyclesPerEra: 100,
        defaultEraCount: this.pond.width * this.pond.height,
        
        // TODO: should these live in the pond? Probably.
        operators: [
          new PP.Operators.Inflow()
        ]
      }, options);
    },
    
    // Run for a given number of eras; if undefined 
    run: function(eras){
      if(_.isUndefined(eras)){
        eras = this.options.defaultEraCount;
      }
      
      this.trigger('run');
      this.runEras_(eras, 0);
    },
    
    stop: function(){
      clearInterval(this.runInterval_);
    },
    
    forEach: function(){
      return this.pond.forEach.apply(this.pond, arguments);
    },
    
    runEras_: function(erasRemaining, era){
      if(!erasRemaining){
        this.trigger('terminated');
        return;
      }
      
      this.runEra_(era);
      
      PP.delay(this.runEras_, this, erasRemaining - 1, era + 1);
    },
    
    runEra_: function(era){
      for(var cycle = 0; cycle < this.options.cyclesPerEra; cycle++){
        this.runOperators_(era, cycle);
        
        var location = PP.randomLocation(this.pond.width, this.pond.height);
        this.runCycle_(location, cycle);
      }
      
      this.trigger('era', {
        era: era
      });
    },
    
    runOperators_: function(era, cycle){
      var tick = era * this.options.cyclesPerEra + cycle;
      
      _.forEach(this.options.operators, function(operator){
        var mod = tick % operator.frequency;
        if(mod == 0){
          operator.invoke(this.pond);
        }
      }, this);
    },
    
    runCycle_: function(location, cycle){
      var stop = false;
      var count = 0;
      var pixel = this.at(location);
      
      while(pixel.ex >= 0 && !stop){
        count += 1;
        
        var instruction = pixel.genome[pixel.ip];
        pixel.ex -= PP.Instructions.cost(instruction);
        
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
            var neighbor = this.neighborOf_(location, pixel, PP.Interactions.NEGATIVE);
            if(neighbor){
              pixel.ex += neighbor.ex;
              neighbor.kill();
            }
            else {
              this.penalize_(pixel);
            }
            break;
          
          case PP.Instructions.SHARE:
            var neighbor = this.neighborOf_(location, pixel, PP.Interactions.POSITIVE);
            if(neighbor){
              pixel.ex = (pixel.ex + neighbor.ex) / 2;
              neighbor.ex = pixel.ex;
            }
            else {
              this.penalize_(pixel);
            }
            break;
            
          case PP.Instructions.FORK:
            var neighbor = this.neighborOf_(location, pixel, PP.Interactions.NEGATIVE);
            if(neighbor){
              pixel.copyTo(neighbor);
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
          
          case PP.Instructions.HALT:
            stop = true;
            break;
            
          default:
            throw new Error(PP.Instructions.invalid(instruction));
        }
      }
      
      if(pixel.ex <= 0){
        pixel.kill();
      }
      
      // this.trigger('cycle', pixel);
    },
    
    penalize_: function(pixel){
      if(this.options.penaltyFactor){
        pixel.ex /= this.options.penaltyFactor;
      }
      if(this.options.penaltyScalar){
        pixel.ex -= this.options.penaltyScalar;
      }
    },
    
    at: function(location){
      return this.pond.at.apply(this.pond, arguments);
    },
    
    neighborOf_: function(location, pixel){
      var neighboringLocation = PP.Locations.add(location, PP.Directions.OFFSETS[pixel.dx]);
      return this.at(neighboringLocation);
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
        pixel.ex = 0;
      }
      else {
        pixel.ip = p;
      }
    }
  });

})(PixelPond);
