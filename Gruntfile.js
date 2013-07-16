module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.initConfig({
    simplemocha: {
      options: {
        reporter: 'spec',
        slow: 200,
        timeout: 1000,
      },
      all: {
        src: ['test/**/*.js']
      }
    },
    watch: {
      tests: {
        files: ['!node_modules', '**/*.js'],
        tasks: ['simplemocha']
      }
    },
    jshint: {
      src: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: ['lib/**/*.js']
      }
    }
  });
  grunt.registerTask('default', ['jshint', 'test']);
  grunt.registerTask('test', 'simplemocha');
  grunt.registerTask('watch', 'watch,tests');
};