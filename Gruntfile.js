module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    simplemocha:{
      options: {
        reporter: 'spec',
        slow: 200,
        timeout: 1000,
      },
      all: {
        src: ['test/util.js']
      }
    },
    watch:{
      all:{
        files:['!node_modules', '**/*.js'],
        tasks:['test']
      }
    }
  });

  grunt.registerTask('test', 'simplemocha');
  grunt.registerTask('watch', 'watch');
};