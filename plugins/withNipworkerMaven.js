const { withPodfile, withProjectBuildGradle } = require('@expo/config-plugins');

const NIPWORKER_MAVEN_URL = 'https://candypoets.github.io/nipworker/';
const FLATBUFFERS_PODSPEC = '../plugins/FlatBuffers.podspec';

function withNipworkerFlatBuffers(config) {
  return withPodfile(config, (project) => {
    const podDeclaration = `pod 'FlatBuffers', :podspec => '${FLATBUFFERS_PODSPEC}'`;

    if (project.modResults.contents.includes(podDeclaration)) {
      return project;
    }

    const targetBlock = /target\s+['"][^'"]+['"]\s+do/;
    if (!targetBlock.test(project.modResults.contents)) {
      throw new Error('Could not find the iOS application target in the Podfile');
    }

    project.modResults.contents = project.modResults.contents.replace(
      targetBlock,
      (match) => `${match}\n  # nipworker is generated with FlatBuffers 25.12.19, which is not published to CocoaPods trunk.\n  ${podDeclaration}`,
    );

    return project;
  });
}

/**
 * Adds the Maven repository that hosts nipworker's version-matched Android AAR.
 * Keeping this in a config plugin makes `expo prebuild --clean` safe.
 */
module.exports = function withNipworkerNativeDependencies(config) {
  const configWithIosDependency = withNipworkerFlatBuffers(config);

  return withProjectBuildGradle(configWithIosDependency, (project) => {
    if (project.modResults.language !== 'groovy') {
      throw new Error('withNipworkerMaven currently expects a Groovy project build.gradle');
    }

    if (project.modResults.contents.includes(NIPWORKER_MAVEN_URL)) {
      return project;
    }

    const repositoriesBlock = /allprojects\s*\{\s*repositories\s*\{/;
    if (!repositoriesBlock.test(project.modResults.contents)) {
      throw new Error('Could not find the Android allprojects repositories block');
    }

    project.modResults.contents = project.modResults.contents.replace(
      repositoriesBlock,
      (match) => `${match}\n        maven {\n            url = uri(System.getenv("NIPWORKER_MAVEN_URL") ?: "${NIPWORKER_MAVEN_URL}")\n        }`,
    );

    return project;
  });
};
