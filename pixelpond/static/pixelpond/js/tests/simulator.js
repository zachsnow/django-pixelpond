$(function(){
  var PP = PixelPond;
  
  module('Simulator :: Genome');
  test('parse genome', function(){
    var text = ' fwd \n back \n read \n write \n loop \n loop \n rep ';
    var expected = [
      PP.Instructions.FWD,
      PP.Instructions.BACK,
      PP.Instructions.READ,
      PP.Instructions.WRITE,
      PP.Instructions.LOOP,
      PP.Instructions.LOOP,
      PP.Instructions.REP
    ];
    
    var genome = PP.Genome.parse(text);
    deepEqual(genome, expected, 'parse a simple program');
  });
  
  module('Simulator :: Pixel');
  
  test('pixel default initialization', function(){
    var depth = 64;
    
    var pixel = new PP.Pixel({
      depth: depth
    });
    
    equal(pixel.depth, depth, 'the pixel should have the right depth');
    equal(pixel.genome.length, depth, 'the genome should have the right length');
    equal(pixel.memory.length, depth, 'the memory should have the right length');
    
    PP.Test.eachEqual(pixel.genome, PP.Instructions.HALT, 'the genome should be initialized to HALT (0)');
    PP.Test.eachEqual(pixel.memory, PP.Instructions.HALT, 'the memory should be initialized to HALT (0)');
  });
  
  test('pixel deserialization', function(){
    var data = {
      id: PP.randomUUID(),
      parentId: PP.randomUUID(),
      originatorId: PP.randomUUID(),
      generation: '1000',
      genome: ' in \n incr \n out \n loop \n in \n write \n read \n out \n rep \n nop '
    };
    
    var pixel = new PP.Pixel({
      data: data
    });
    
    equal(pixel.id, data.id, 'the pixel should have the right id');
    equal(pixel.parentId, data.parentId, 'the pixel should have the right parent id');
    equal(pixel.originatorId, data.originatorId, 'the pixel should have the right originator id');
    equal(pixel.generation.toString(), data.generation, 'the pixel should have the right generation');
    
    equal(pixel.depth, 10, 'the pixel should have the right depth');
    equal(pixel.genome.length, 10, 'the genome should have the right length');
    equal(pixel.memory.length, 10, 'the memory should have the right length');
    
    var expectedGenome = [
      PP.Instructions.IN,
      PP.Instructions.INCR,
      PP.Instructions.OUT,
      PP.Instructions.LOOP,
      PP.Instructions.IN,
      PP.Instructions.WRITE,
      PP.Instructions.READ,
      PP.Instructions.OUT,
      PP.Instructions.REP,
      PP.Instructions.NOP
    ];
    deepEqual(pixel.genome, expectedGenome, 'the genome should be initialized to the parsed genome');
    
    PP.Test.eachEqual(pixel.memory, PP.Instructions.HALT, 'the memory should be initialized to HALT (0)');
  });
  
  test('pixel serialization', function(){
    var data = {
      id: PP.randomUUID(),
      parentId: PP.randomUUID(),
      originatorId: PP.randomUUID(),
      generation: '1000',
      genome: ' rep \n write \n sense \n fork \n in \n share \n kill \n halt \n xchg \n turn '
    };
    
    var pixel = new PP.Pixel({
      data: data
    });
    
    var actual = pixel.serialize();
    var expected = _.extend({}, data, {
      genome: PP.Genome.print([
        PP.Instructions.REP,
        PP.Instructions.WRITE,
        PP.Instructions.SENSE,
        PP.Instructions.FORK,
        PP.Instructions.IN,
        PP.Instructions.SHARE,
        PP.Instructions.KILL,
        PP.Instructions.HALT,
        PP.Instructions.XCHG,
        PP.Instructions.TURN
      ])
    });
    
    deepEqual(expected, actual, 'the serialized data should be the same as the (normalized) inital data');
  });
  
  module('Simulator :: Pond');
  
  module('Simulator :: Simulator');
  
})
