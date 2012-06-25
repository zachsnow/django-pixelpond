(function(PP){
  _.choose = function(l, iterator, context){
    var result = [];
    _.forEach(l, function(element){
      var e = iterator.call(context, element);
      if(!_.isUndefined(e)){
        result.push(e);
      }
    });
    return result;
  };
  
  PP.assert = function(t){
    if(!t){
      debugger;
    }
  };
  
  PP.clamp = function(i, max){
    return (i + max) % max;
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
    if(!max){
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
    var uuid = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/xxxx/g, function(c) {
      return PP.randomInt(65536).toString(16);
    });
    return uuid;
  };
  
  PP.randomInstruction = function(){
    var instruction = PP.randomInt(PP.Instructions.INSTRUCTION_NAMES.length);
    return instruction;
  };
  
  PP.zeroUUID = function(){
    return null;
    return '00000000-0000-4000-8000-000000000000';
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
    return setTimeout(function(){
      _.bind.apply(_, args)();
    }, niceness);
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // Testing.
  //////////////////////////////////////////////////////////////////////////////
  PP.Test = {};
  PP.Test.eachEqual = function(list, value, msg){
    console.info('each equal', list, value);
    QUnit.ok(_.all(list, function(element){
      return element === value;
    }), msg);
  };
})(PixelPond);

