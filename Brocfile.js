var pick = require( 'broccoli-static-compiler' ),
	merge = require( 'broccoli-merge-trees' ),

	// filters
	transpileES6 = require( 'broccoli-es6-transpiler' ),
	transpileES6Modules = require( 'broccoli-es6-module-transpiler' ),
	compileSass = require( 'broccoli-sass' ),
	requirejs = require( 'broccoli-requirejs' ),
	cleanTranspiled = require( './broccoli/clean-transpiled' ),
	compileTutorials = require( './broccoli/compile-tutorials' ),
	compileRactive = require( 'broccoli-ractive' ),

	shared, app, css, tutorials, tree;

	shared = pick( 'shared', {
		srcDir: '/',
		files: [ '**/*.*' ],
		destDir: '/'
	});

	app = (function () {
		var app, ractive_components, vendor;

		app = pick( 'src/app', {
			srcDir: '/',
			files: [ '**/*.js' ],
			destDir: '/'
		});

		ractive_components = compileRactive( 'src/ractive_components', {
			files: [ '**/*.html' ],
			destDir: '/ractive_components',
			type: 'es6'
		});

		app = merge([ app, ractive_components ]);
		app = transpileES6Modules( app, { type: 'amd' });
		app = cleanTranspiled( app );
		app = transpileES6( app, { globals: { define: true } });

		// external libs
		vendor = pick( 'vendor', {
			srcDir: '/',
			files: [ '**/*.*' ],
			destDir: '/vendor/'
		});

		app = requirejs( merge([ app, vendor ]), {
			requirejs: {
				name: 'app',
				out: 'app.js',
				optimize: 'none',

				onModuleBundleComplete: function ( data ) {
					var fs, amdclean, outputFile, prod, paths, cdnPaths, cdnDependencies, names, aliases;

					fs = require( 'fs' );
					amdclean = require( 'amdclean' );

					outputFile = data.path;

					fs.writeFileSync( outputFile, amdclean.clean({
						filePath: outputFile,
						wrap: {
							start: '(function(){',
							end: '}());'
						}
					}));
				}
			}
		});

		return app;
	}());

	css = compileSass( [ 'src/styles', shared ], 'main.scss', 'min.css', {
		outputStyle: 'compressed'
	});

	tutorials = (function () {
		var templates, data, partials;

		templates = pick( 'src/', {
			srcDir: '/templates',
			files: [ '**/*.*' ],
			destDir: '/templates'
		});

		data = pick( 'src/', {
			srcDir: '/tutorials',
			files: [ '**/*.*' ],
			destDir: '/tutorials'
		});

		partials = pick( shared, {
			srcDir: '/partials',
			files: [ '**/*.html' ],
			destDir: '/partials'
		});

		return compileTutorials( merge([ templates, data, shared ]) );
	}());

module.exports = merge([ app, tutorials, shared, css ]);