(function(window){
	window.JazzModes = {
			
		scales: ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'],
		rootsAdvanced: ['c','c#','db','d','d#','eb','e','f','f#','gb','g','g#','ab','a','a#','bb','b'],
		roots: ['c','db','d','eb','e','f','f#','gb','g','ab','a','bb','b'],
		
		scientificToVexflow: function(sc) {
			a = sc.split('');
			var octave = a.pop();
			if (a.length == 2) {
				if (a[1] == 'x') {
					a[1] = '##';
				};
			}
			a.push('/');
			a.push(octave);
			return a.join('').toLowerCase();
		},
		
		randomMode: function(config) {
			if (config && config.allowDoubleAccidentals) {
				return this._basicRandomMode();
			} else {
				var candidate = this._basicRandomMode();
				for(i = 0; i < 100; i++) {
					var suitable = true;
					var modeNotes = candidate.notes();
					
					  for (var i = 0; i < 7; i++) {
						  var accidental = modeNotes[i].accidental();
						  if (accidental != '') {
				              if (accidental == 'x') {
				                  accidental = '##';
				              }
							  if (accidental.length == 2) {
								  console.log("Double accidental", candidate);
								  suitable = false;
								  break;
							  }
						  }
					  }
					  
					  if (suitable) {
						  return candidate;
					  } else {
						  candidate = this._basicRandomMode();
					  }
				}
				
				throw "100 modes with double accidentals found";
			}
		},
		
		_basicRandomMode: function() {
			var scale = this.scales[Math.floor(Math.random()*this.scales.length)];
			var root = this.roots[Math.floor(Math.random()*this.roots.length)];

			var note = teoria.note(root + '4');
			return note.scale(scale);
		},
		
		renderMode: function(mode, canvas) {
			  var renderer = new Vex.Flow.Renderer(canvas,
					    Vex.Flow.Renderer.Backends.CANVAS);

			  var ctx = renderer.getContext();
			  
			  // Clear the canvas and redraw (important for changing the mode without refresh)
			  ctx.clearRect(0, 0, canvas.width, canvas.height);

			  var stave = new Vex.Flow.Stave(10, 0, 600);
			  stave.addClef("treble").setContext(ctx).draw();
			  
			  var notes = [];
			  var modeNotes = mode.notes();
			  for (var i = 0; i < 7; i++) {
				  noteName = this.scientificToVexflow(modeNotes[i].scientific());
				  var renderNote = new Vex.Flow.StaveNote({ keys: [noteName], duration: "4" });
				  var accidental = modeNotes[i].accidental();
				  if (accidental != '') {
		              if (accidental == 'x') {
		                  accidental = '##';
		              }/*
					  if (rewriteDoubleAccidentals && accidental.length == 2) {
						  var enharmonics = modeNotes[i].enharmonics();
						  if (enharmonics.length > 0) {
							  console.log(enharmonics[0]);
							  noteName = scientificToVexflow(enharmonics[0].scientific());
							  renderNote = new Vex.Flow.StaveNote({ keys: [noteName], duration: "4" });
					          accidental = enharmonics[0].accidental();
						  }
					  }*/
					  if (accidental != '') {
						  renderNote.addAccidental(0, new Vex.Flow.Accidental(accidental));
					  }
				  }
				  notes.push(renderNote);
			  }
			  // Create a voice in 4/4
			  var voice = new Vex.Flow.Voice({
			    num_beats: 7,
			    beat_value: 4,
			    resolution: Vex.Flow.RESOLUTION
			  });

			  // Add notes to voice
			  voice.addTickables(notes);

			  // Format and justify the notes to 500 pixels
			  var formatter = new Vex.Flow.Formatter().
			    joinVoices([voice]).format([voice], 500);

			  // Render voice
			  voice.draw(ctx, stave);
		},
		
		showNotes: function(mode, container) {
			var result = [];
			var modeNotes = mode.notes();
			for (var i = 0; i < 7; i++) {
				result.push(modeNotes[i].name().toUpperCase() + modeNotes[i].accidental());
			}
			container.text(result.join(" "));
		},
		
		modeName: function(mode) {
			return mode.tonic.name().toUpperCase() + mode.tonic.accidental() + " " + mode.name;
		},
		
		Game: {
			IdentifyTheMode: function(container, config) {
				this.config = {
					showStave: true,
					showNotes: false,
					showScore: true,
					showTime: false
				}
				$.extend(this.config, config);
				
				this.run = function() {
					var scoreCount = 0;
					var initialTime = new Date();
					
					container = $(container); // make sure it's jQuery object
					
					// Create a canvas for showing the notation
					var staveCanvas = $('<canvas class="canvas" width="700" height="200"></canvas>');
					$(container).append(staveCanvas);
					
					// Create a div for showing the note names
					var notesDiv = $('<div id="name"></div>');
					$(container).append(notesDiv);
					
					// Create the form of mode names
					var form = $('<form id="choices"></form>');
					$(container).append(form);
					
					// Create a div for the score
					var score = $('<div>0 correct</div>');
					$(container).append(score);
					
					if (this.config.showTime) {
						var timeDiv = $('<div>0 seconds</div>');
						container.append(timeDiv);
						setInterval(function() {
							timeDiv.text(Math.floor((new Date() - initialTime) / 1000) + " seconds");
						}, 200);
					}
					
					var randomMode = JazzModes.randomMode({allowDoubleAccidentals: false});
					
					// Render the scale and note names
					JazzModes.renderMode(randomMode, staveCanvas.get(0)); // VexFlow need the actual DOM node
					JazzModes.showNotes(randomMode, notesDiv);
					var scaleName = JazzModes.modeName(randomMode);

				    // Create form
				    for(var i in JazzModes.scales) {
				    	scale = JazzModes.scales[i];
				    	form.append('<input type="radio" name="modeType" value="' + scale + '">' + scale + '</input>');
				    }
				    form.on('click', 'input[type=radio]', function(e) {
				    	if (this.value == randomMode.name) {
				    		console.log("Well done, it's a " + scaleName + "!");
				    		score.text(++scoreCount + " correct");
				    	} else {
				    		console.log("No, it's a " + scaleName + "!");
				    	}

			    		// TODO: Refactor - same as above
			    		randomMode = JazzModes.randomMode({allowDoubleAccidentals: false});
						
						// Render the scale and note names
						JazzModes.renderMode(randomMode, staveCanvas.get(0)); // VexFlow need the actual DOM node
						JazzModes.showNotes(randomMode, notesDiv);
						scaleName = JazzModes.modeName(randomMode);
						
						// Reset the form selection
					    $('input[type=radio]', form).prop('checked', false);
				    });
				    
				};
			}
		}
	};
})(window);