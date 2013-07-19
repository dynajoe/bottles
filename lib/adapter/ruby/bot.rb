require_relative 'adapter'

adapter = Bottles::Adapter.new 'localhost', 4000

adapter.start do |data|
  { :heading => Math::PI / 2, :speed => 10 }
end