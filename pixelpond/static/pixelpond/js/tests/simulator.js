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
    
    PP.eachEqual(pixel.genome, PP.Instructions.NOP, 'this genome should be initialized to NOP (0)');
    PP.eachEqual(pixel.memory, PP.Instructions.NOP, 'this memory should be initialized to NOP (0)');
  });
  
  module('Simulator :: Pond');
  
  module('Simulator :: Simulator');
  
})
