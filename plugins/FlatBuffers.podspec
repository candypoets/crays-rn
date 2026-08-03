Pod::Spec.new do |spec|
  spec.name = 'FlatBuffers'
  spec.version = '25.12.19'
  spec.summary = 'FlatBuffers Swift runtime for nipworker'
  spec.homepage = 'https://github.com/google/flatbuffers'
  spec.license = { :type => 'Apache-2.0', :file => 'LICENSE' }
  spec.author = 'Google'
  spec.source = {
    :git => 'https://github.com/google/flatbuffers.git',
    :tag => "v#{spec.version}"
  }

  spec.ios.deployment_target = '12.0'
  spec.swift_version = '5.10'
  # The upstream 25.12.19 podspec only includes top-level FlatBuffers files.
  # Its Swift package also requires Common and nested Vectors sources.
  spec.source_files = [
    'swift/Sources/Common/**/*.swift',
    'swift/Sources/FlatBuffers/**/*.swift'
  ]
  spec.pod_target_xcconfig = { 'BUILD_LIBRARY_FOR_DISTRIBUTION' => 'YES' }
end
