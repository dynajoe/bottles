module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-cafe-mocha');

  grunt.initConfig({
    cafemocha: {
      all: {
         src: 'test/**/*.js',
         options: {
            ui: 'tdd',
            growl: true,
            reporter: 'spec',
            require: [
                'should',
            ]
         }
      }
    },
    watch: {
      tests: {
        files: ['!node_modules','lib/**/*.js', 'test/**/*.js'],
        tasks: ['cafemocha']
      }
    },
    jshint: {
      src: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: ['lib/**/*.js', '!lib/random.js']
      }
    }
  });
 
  grunt.registerTask('default', ['jshint', 'test']);
  grunt.registerTask('test', 'cafemocha');

};
