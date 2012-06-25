(function(PP){
  PP.Settings = {
    defaultPondWidth: 128,
    defaultPondHeight: 128,
    defaultPondDepth: 64,
    
    defaultSimulatorCyclesPerEra: 10,
    
    defaultCanvasScale: 2,
    defaultCanvasColorScheme: 'lineage',
    
    minimumViableGeneration: PP.Long.fromInt(2),
    maxGeneration: PP.Long.ZERO,
    
    mutationRate: 0.00001,
    seedRate: 0.05,
    seedEnergy: 1000
  };
})(PixelPond);
