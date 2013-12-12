module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			files: [
				'config.js',
				'LogicPull.js',
				'public/javascripts/**/*.js', 
				'lib/**/*.js', 
				'middleware/**/*.js', 
				'routes/**/*.js', 
				'subdomains/**/*.js',
				'models/**/*.js',
				'bin/db/init.js'
			],
			options: {
				ignores: [
					'public/javascripts/preload/**/*.js', 
					'public/javascripts/plugins/**/*.js', 
					'public/javascripts/*.min.js'
				],
				curly: true,
				eqnull: true,
				browser: true,
				globals: {
					jQuery: true,
					console: true,
					exports: true,
					require: true
				},
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				mangle: true
			},
			build: {
				files: {
					'public/javascripts/editor.min.js': ['public/javascripts/editor/**/*.js'],
					'public/javascripts/admin.min.js': ['public/javascripts/admin.js'],
					'public/javascripts/viewer.min.js': ['public/javascripts/viewer.js']
				}
			},
		},
		cssmin: {
			combine: {
				files: {
					'public/stylesheets/admin.min.css' : ['public/stylesheets/admin.css'],
					'public/stylesheets/editor.min.css' : ['public/stylesheets/editor.css'],
					'public/stylesheets/wysihtml5-lm.min.css' : ['public/stylesheets/wysihtml5-lm.css'],
					'public/stylesheets/wysihtml5-text.min.css' : ['public/stylesheets/wysihtml5-text.css'],
					'public/stylesheets/viewer.min.css' : ['public/stylesheets/viewer.css'],
					'public/stylesheets/interviews.css' : ['public/stylesheets/interviews.css']
				}
			}
		}
	});


	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	// Default task(s).
	grunt.registerTask('default', ['jshint', 'uglify', 'cssmin']);

};