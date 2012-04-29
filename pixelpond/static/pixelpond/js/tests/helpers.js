(function(PP){
  module('Helpers :: General');
  
  test('clamp', function(){
    equal(99, PP.clamp(-1, 100), 'wrap at lower endpoint');
    equal(0, PP.clamp(0, 100), 'endpoint unchanged');
    equal(1, PP.clamp(1, 100), 'in-interval unchanged');
    equal(50, PP.clamp(50, 100), 'in-interval unchanged');
    equal(99, PP.clamp(99, 100), 'endpoint unchanged');
    equal(0, PP.clamp(100, 100), 'wrap at upper endpoint');
    equal(1, PP.clamp(101, 100), 'wrap past uppser endpoint');
  });
  
})(PixelPond);
