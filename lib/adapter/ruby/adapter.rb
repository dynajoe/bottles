module Bottles
  class Adapter 
    require 'socket'
    require 'json'

    attr_accessor :host, :port

    def initialize host, port
      @host = host
      @port = port
    end

    def start &block
      socket = TCPSocket.new @host, @port

      loop { 
        line = socket.gets
        
        if line
          data = JSON.parse line
          commands = block.call data
          socket.puts commands.to_json
        end
      }
    end
  end
end