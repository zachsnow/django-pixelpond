(function(PP){
  PP.clamp = function(i, max){
    i %= max;
    i += max;
    i %= max;
    return i;
  };
  
  PP.logAll = function(){
    var context = _.first(arguments);
    var methods = _.rest(arguments);
    
    _.forEach(methods, function(method){
      var toString = function(x, d){
        var s = x.toString();
        if(s === '[object Object]'){
          s = d;
        }
        return s;
      }
      var original = context[method];
      
      var contextName = toString(context, 'this');
      
      context[method] = function(){
        var args = _.map(arguments, function(arg){
          return toString(arg, 'object');
        });
        console.info('invoking ' + contextName + '.' + method + ' with ' + args.join(', '));
        original.apply(context, arguments);
      };
    });
  };
  
  PP.tryInvoke = function(){
    var f = _.first(arguments);
    var args = _.rest(arguments);
    if(_.isFunction(f)){
      return f.apply(_.first(args), _.rest(args));
    }
    return f;
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // Random
  //////////////////////////////////////////////////////////////////////////////
  
  // NOTE: we should seed the random number generator using a value generated
  // on the server.
  var twister = new MersenneTwister();
  
  PP.seed = function(seed){
    Twister = new MersenneTwister(seed);
  };
  
  PP.random = function(){
    return twister.random();
  };
  
  PP.randomInt = function(max){
    var r = twister.genrand_int32();
    if(_.isUndefined(max)){
      return r;
    }
    return r % max;
  };
  
  PP.randomLocation = function(x, y){
    return {
      x: PP.randomInt(x),
      y: PP.randomInt(y)
    };
  };
  
  PP.randomUUID = function(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (PP.random() * 16) | 0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };
  
  PP.randomInstruction = function(){
    return PP.randomInt(PP.Instructions.INSTRUCTION_NAMES.length);
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // Arrays
  //////////////////////////////////////////////////////////////////////////////
  PP.list = function(count, value, context){
    var l = [];
    if(_.isFunction(value)){
      for(var i = 0; i < count; i++){
        l[i] = value.call(context, i);
      };
    }
    else {
      for(var i = 0; i < count; i++){
        l[i] = value;
      }
    }
    return l;
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // UI Niceness.
  //////////////////////////////////////////////////////////////////////////////
  // By piping every invocation of setTimeout used to make the UI more
  // responsive through PixelPond.delay, we can specify the timeout used and
  // thereby adjust the 'niceness'. 
  //////////////////////////////////////////////////////////////////////////////
  var niceness = 0;
  
  PP.nice = function(n){
    if(n < 0){
      n = 0;
    }
    niceness = n;
  };
  
  PP.delay = function(){
    var args = _.toArray(arguments);
    setTimeout(function(){
      _.bind.apply(_, args)();
    }, niceness);
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // Testing.
  //////////////////////////////////////////////////////////////////////////////
  PP.eachEqual = function(list, value, msg){
    QUnit.ok(_.all(list, function(element){
      return element === value;
    }), msg);
  };
})(PixelPond);

