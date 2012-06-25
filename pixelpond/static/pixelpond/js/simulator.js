(function(PP){
  var MAX_INT = 4294967295;
  
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
  
  PP.Instructions.fromInt = function(i){
    var instruction =  PP.clamp(i, PP.Instructions.INSTRUCTION_NAMES.length);
    return instruction;
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // Genomes.
  //////////////////////////////////////////////////////////////////////////////
  PP.Genome = {};
  
  // Pretty-print an instruction or genome.
  PP.Genome.print = function(instructions, style){
    style = style || 'pretty';
    switch(style){
      case 'pretty':
        return _.map(instructions, PP.Instructions.print).join('\n');
      case 'compressed':
        return _.map(instructions, PP.Instructions.print).join('; ') + ';';
      default:
        throw new Error('invalid style ' + style);
    }
  };
  
  PP.Genome.parse = function(s, style){
    style = style || 'pretty';
    
    var lines;
    switch(style){
      case 'pretty':
        lines = s.split('\n');
        break;
      case 'compressed':
        lines = s.split(';');
        break;
       default:
        throw new Error('invalid print style ' + style);
    }
    
    return _.choose(lines, function(s){
      s = $.trim(s).toUpperCase();
      
      // Empty lines.
      if(!s){
        return;
      }
      
      // Comments.
      if(s[0] === '#'){
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
        'load_', 'serialize',
        'reset', 'randomize', 'kill',
        'copyTo'
      );
      
      if(options.data){
        this.load_(options.data);
        this.reset();
      }
      else {
        this.options = _.extend({}, {
          depth: PP.Settings.defaultPondDepth 
        }, options);
        
        this.id = this.parentId = this.originatorId = PP.zeroUUID();
        this.generation = PP.Long.ZERO;
        
        this.depth = options.depth;
        this.genome = PP.list(this.depth, PP.Instructions.HALT);
        this.memory = PP.list(this.depth, PP.Instructions.HALT);
        this.reset();
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
    
    // Resets a cell's registers and memory. Leaves identifying
    // information and genome intact.
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
    
    // Resets a cell, resets it's identifying information, and
    // randomizes its genome.
    randomize: function(){
      this.reset();
      
      this.id = this.parentId = this.originatorId = PP.randomUUID();
      this.generation = PP.Long.ZERO;
      
      _.forEach(this.genome, function(instruction, i){
        this.genome[i] = PP.randomInstruction();
      }, this);
    },
    
    seed: function(genome, id){
      this.reset();
      this.id = PP.randomUUID();
      this.parentId = this.originatorId = id;
      this.generation = PP.Long.ONE;
      
      _.forEach(this.genome, function(instruction, i, thisGenome){
        thisGenome[i] = genome[i] || PP.Instructions.HALT;
      });
    },
    
    // Resets a cell and clears it's identifying information and
    // genome.
    kill: function(){
      this.reset();
      
      this.id = this.parentId = this.originatorId = PP.randomUUID();
      this.generation = PP.Long.ZERO;
      
      this.genome[0] = PP.Instructions.HALT;
    },
    
    copyTo: function(pixel){
      pixel.id = PP.randomUUID();
      pixel.parentId = this.id;
      pixel.originatorId = this.originatorId;
      
      // The next generation!
      pixel.generation = this.generation.add(PP.Long.ONE);
      
      // Copy over the genome.
      PP.assert(this.memory.length === pixel.genome.length);
      _.forEach(this.memory, function(instruction, i){
        pixel.genome[i] = PP.Instructions.fromInt(instruction);
      });
      
      var maxGeneration = PP.Settings.maxGeneration || pixel.generation;
      if(pixel.generation.greaterThan(maxGeneration)){
        PP.Settings.maxGeneration = pixel.generation;
        console.info('Maximum generation', PP.Settings.maxGeneration.toString());
        console.info('Genome', PP.Genome.print(pixel.genome, 'compressed'));
      }
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
        this.load_(options.data);
      }
      else {
        this.options = _.extend({}, {
          width: PP.Settings.defaultPondWidth,
          height: PP.Settings.defaultPondHeight,
          depth: PP.Settings.defaultPondDepth
        }, options);
        
        this.width = this.options.width;
        this.height = this.options.height;
        this.depth = this.options.depth;
        
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
    
    seed: function(genome, rate){
      var id = PP.randomUUID();
      rate = rate || PP.Settings.seedRate;
      _.forEach(this.pixels, function(pixel){
        if(PP.random() < rate){
          pixel.seed(genome, id);
          pixel.ex = PP.Settings.seedEnergy;
        }
      });
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
      _.bindAll(this, 'invoke');
      this.options = _.extend({
        frequency: 200,
        value: 4000,
        variation: 8000
      });
      
      this.frequency = this.options.frequency;
    },
    
    invoke: function(pond){
      var location = PP.randomLocation(pond.width, pond.height);
      var pixel = pond.at(location);
      
      pixel.randomize();
      pixel.ex = this.options.value + PP.randomInt(this.options.variation);
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
      this.runTimeout_ = null;
      
      this.pond = options.pond;
      
      this.options = _.extend({}, {
        cyclesPerEra: PP.Settings.defaultSimulatorCyclesPerEra,
        defaultEraCount: MAX_INT,
        
        // TODO: should these live in the pond? Probably.
        operators: [
          new PP.Operators.Inflow()
        ]
      }, options);
      
      _.forEach(this.options.operators, function(operator){
        operator.frequency = (operator.frequency / this.options.cyclesPerEra) >>> 0;
        PP.assert(operator.frequency);
      }, this);
    },
    
    // Run for a given number of eras; if undefined 
    run: function(eras){
      this.running_ = true;
      
      if(_.isUndefined(eras)){
        eras = this.options.defaultEraCount;
      }
      
      this.trigger('run');
      this.runEras_(eras, 0);
    },
    
    stop: function(){
      clearTimeout(this.runTimeout_);
      this.trigger('stop');
    },
    
    forEach: function(){
      return this.pond.forEach.apply(this.pond, arguments);
    },
    
    runEras_: function(erasRemaining, era){
      if(!erasRemaining){
        this.trigger('stop');
        return;
      }
      
      this.runTimeout_ = null;
      
      this.runEra_(era);
      
      this.runTimeout_ = PP.delay(this.runEras_, this, erasRemaining - 1, era + 1);
    },
    
    runEra_: function(era){
      for(var cycle = 0; cycle < this.options.cyclesPerEra; cycle++){
        this.runOperators_(era);
        
        var location = PP.randomLocation(this.pond.width, this.pond.height);
        this.runCycle_(location, cycle);
      }
      
      this.trigger('era', {
        era: era,
        tick: era * this.options.cyclesPerEra
      });
      
    },
    
    runOperators_: function(era){
      _.forEach(this.options.operators, function(operator){
        var mod = era % operator.frequency;
        if(mod === 0){
          operator.invoke(this.pond);
        }
      }, this);
    },
    
    runCycle_: function(location, cycle){
      var pixel = this.at(location);
      
      var stop = false;
      while(pixel.ex > 0 && !stop){
        var instruction = pixel.genome[pixel.ip];
        if(PP.random() < PP.Settings.mutationRate){
          instruction = PP.randomInstruction();
        }
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
            var ip = PP.clamp(pixel.ip + 1, pixel.genome.length);
            pixel.genome[ip] = PP.Instructions.fromInt(pixel.rx);
            pixel.ip = ip;
            break;
          
          case PP.Instructions.READ:
            pixel.rx = pixel.genome[pixel.gp];
            break;
            
          case PP.Instructions.WRITE:
            PP.assert(pixel.gp < pixel.genome.length);
            pixel.genome[pixel.gp] = PP.Instructions.fromInt(pixel.rx);
            break;
          
          case PP.Instructions.IN:
            pixel.rx = pixel.memory[pixel.gp];
            break;
            
          case PP.Instructions.OUT:
            PP.assert(pixel.gp < pixel.memory.length);
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
              var total = pixel.ex + neighbor.ex;
              pixel.ex = (total / 2) >>> 0;
              neighbor.ex = total - pixel.ex;
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
            if(pixel.rx === 0){
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
        
        pixel.ip = PP.clamp(pixel.ip + 1, pixel.genome.length);
      }
      
      if(pixel.ex <= 0){
        pixel.kill();
      }
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
    
    neighborOf_: function(location, pixel, interaction){
      // TODO: implement interactions!
      var neighboringLocation = PP.Locations.add(location, PP.Directions.OFFSETS[pixel.dx]);
      return this.at(neighboringLocation);
    },
    
    search_: function(pixel, offset, open, close){
      var extraLoopCount = 0;
      var ip = PP.clamp(pixel.ip + offset, pixel.genome.length);
      while(ip != pixel.ip){
        var instruction = pixel.genome[ip];
        if(instruction === open){
          extraLoopCount += 1;
        }
        else if(instruction === close){
          if(extraLoopCount === 0){
            break;
          }
          else {
            extraLoopCount -= 1;
          }
        }
        
        ip = PP.clamp(ip + offset, pixel.genome.length);
      }
      
      if(ip === pixel.ip){
        pixel.ex = 0;
      }
      else {
        pixel.ip = ip;
      }
    }
  });

})(PixelPond);
