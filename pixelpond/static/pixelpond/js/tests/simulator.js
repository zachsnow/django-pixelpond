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
    
    PP.eachEqual(pixel.genome, PP.Instructions.NOP, 'the genome should be initialized to NOP (0)');
    PP.eachEqual(pixel.memory, PP.Instructions.NOP, 'the memory should be initialized to NOP (0)');
  });
  
  test('pixel data initialization', function(){
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
    
    equal(pixel.depth, 10, 'the pixel should have the right depth');
    equal(pixel.genome.length, 10, 'the genome should have the right length');
    equal(pixel.memory.length, 10, 'the memory should have the right length');
    
    deepEqual(pixel.genome, expectedGenome, 'the genome should be initialized to the parsed genome');
    PP.eachEqual(pixel.memory, PP.Instructions.NOP, 'the memory should be initialized to NOP (0)');
  });
  
  test('pixel serialization', function(){
    
  });
  
  module('Simulator :: Pond');
  
  module('Simulator :: Simulator');
  
})
